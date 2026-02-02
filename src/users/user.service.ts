import { Types } from "mongoose"
import { models } from "../models/model"
const { User ,ConnectionModel} = models
import mongoose from 'mongoose'
interface IUser {
  _id: Types.ObjectId | string
  name: string
  email: string
  role: string
}

export const createUser = async (userData: any) => {
  const user = await User.create(userData)
  return user
}

export const getUsers = async () => {
  return await User.find()
}

export const sendConnectionRequest = async (requesterId: string, recipientId: string) => {
  if (requesterId === recipientId) throw new Error("Cannot connect with yourself")
  const recipient = await User.findById(recipientId)
  if (!recipient) throw new Error("Recipient user does not exist")
  const existing = await ConnectionModel.findOne({ requester: requesterId, recipient: recipientId })
  if (existing) throw new Error("Connection request already exists")
  const request = await ConnectionModel.create({ requester: requesterId, recipient: recipientId })
  return request
}

export const respondConnectionRequest = async (requestId: string, action: "accepted" | "rejected") => {
  const request = await ConnectionModel.findById(requestId)
  if (!request) throw new Error("Connection request not found")
  request.status = action
  await request.save()
  return request
}

export const getConnections = async (userId: string) => {
  return await ConnectionModel.find({
    $or: [{ requester: userId }, { recipient: userId }]
  }).populate("requester recipient", "name email")
}


export const getAcceptedConnections = async (userId: string) => {
  const connections = await ConnectionModel.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted"
  })
    .populate<{ requester: IUser; recipient: IUser }>("requester", "name email role")
    .populate<{ requester: IUser; recipient: IUser }>("recipient", "name email role")


  return connections.map(conn => {
    const otherUser: IUser =
      conn.requester._id.toString() === userId ? conn.recipient : conn.requester

    return {
      connectionId: conn._id,
      status: conn.status,
      user: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role
      },
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt
    }
  })
}



export const suggestFriends = async (userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId)

  const suggestions = await ConnectionModel.aggregate([
    {
      $match: {
        $or: [
          { user1: userObjectId, status: 'accepted' },
          { user2: userObjectId, status: 'accepted' }
        ]
      }
    },
    {
      $project: {
        friendId: {
          $cond: {
            if: { $eq: ['$user1', userObjectId] },
            then: '$user2',
            else: '$user1'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'connections',
        let: { myFriendId: '$friendId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$status', 'accepted'] },
                  {
                    $or: [
                      { $eq: ['$user1', '$$myFriendId'] },
                      { $eq: ['$user2', '$$myFriendId'] }
                    ]
                  }
                ]
              }
            }
          },
          {
            $project: {
              candidateId: {
                $cond: {
                  if: { $eq: ['$user1', '$$myFriendId'] },
                  then: '$user2',
                  else: '$user1'
                }
              }
            }
          }
        ],
        as: 'friendConnections'
      }
    },
    { $unwind: '$friendConnections' },
    {
      $project: {
        candidateId: '$friendConnections.candidateId',
        mutualFriendId: '$friendId'
      }
    },
    {
      $match: {
        candidateId: { $ne: userObjectId }
      }
    },
    {
      $lookup: {
        from: 'connections',
        let: { candidateId: '$candidateId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$user1', userObjectId] },
                          { $eq: ['$user2', '$$candidateId'] }
                        ]
                      },
                      {
                        $and: [
                          { $eq: ['$user2', userObjectId] },
                          { $eq: ['$user1', '$$candidateId'] }
                        ]
                      }
                    ]
                  },
                  { $in: ['$status', ['accepted', 'pending']] }
                ]
              }
            }
          }
        ],
        as: 'existingConnection'
      }
    },
    {
      $match: {
        existingConnection: { $size: 0 }
      }
    },
    {
      $group: {
        _id: '$candidateId',
        mutualFriends: { $sum: 1 },
        mutualFriendIds: { $addToSet: '$mutualFriendId' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'candidateUser'
      }
    },
    { $unwind: '$candidateUser' },
    {
      $lookup: {
        from: 'users',
        pipeline: [{ $match: { _id: userObjectId } }],
        as: 'currentUser'
      }
    },
    { $unwind: '$currentUser' },
    {
      $addFields: {
        mutualFriendsScore: {
          $multiply: [
            {
              $min: [
                { $divide: ['$mutualFriends', 10] },
                1
              ]
            },
            40
          ]
        },
        commonInterestsScore: {
          $multiply: [
            {
              $cond: {
                if: {
                  $and: [
                    { $isArray: '$candidateUser.interests' },
                    { $isArray: '$currentUser.interests' }
                  ]
                },
                then: {
                  $min: [
                    {
                      $divide: [
                        {
                          $size: {
                            $setIntersection: [
                              '$candidateUser.interests',
                              '$currentUser.interests'
                            ]
                          }
                        },
                        5
                      ]
                    },
                    1
                  ]
                },
                else: 0
              }
            },
            25
          ]
        },
        sameLocationScore: {
          $cond: {
            if: {
              $and: [
                { $ne: ['$candidateUser.location', null] },
                { $ne: ['$currentUser.location', null] },
                { $eq: ['$candidateUser.location', '$currentUser.location'] }
              ]
            },
            then: 15,
            else: 0
          }
        },
        sameRoleScore: {
          $cond: {
            if: {
              $and: [
                { $ne: ['$candidateUser.role', null] },
                { $ne: ['$currentUser.role', null] },
                { $eq: ['$candidateUser.role', '$currentUser.role'] }
              ]
            },
            then: 10,
            else: 0
          }
        },
        profileCompletenessScore: {
          $multiply: [
            {
              $divide: [
                {
                  $add: [
                    { $cond: [{ $ne: ['$candidateUser.bio', null] }, 1, 0] },
                    { $cond: [{ $ne: ['$candidateUser.avatar', null] }, 1, 0] },
                    { $cond: [{ $gt: [{ $size: { $ifNull: ['$candidateUser.interests', []] } }, 0] }, 1, 0] },
                    { $cond: [{ $ne: ['$candidateUser.location', null] }, 1, 0] },
                    { $cond: [{ $ne: ['$candidateUser.company', null] }, 1, 0] }
                  ]
                },
                5
              ]
            },
            5
          ]
        },
        recentActivityScore: {
          $multiply: [
            {
              $cond: {
                if: { $ne: ['$candidateUser.lastActive', null] },
                then: {
                  $max: [
                    0,
                    {
                      $subtract: [
                        1,
                        {
                          $divide: [
                            {
                              $divide: [
                                { $subtract: [new Date(), '$candidateUser.lastActive'] },
                                1000 * 60 * 60 * 24
                              ]
                            },
                            30
                          ]
                        }
                      ]
                    }
                  ]
                },
                else: 0.5
              }
            },
            5
          ]
        }
      }
    },
    {
      $addFields: {
        totalScore: {
          $add: [
            '$mutualFriendsScore',
            '$commonInterestsScore',
            '$sameLocationScore',
            '$sameRoleScore',
            '$profileCompletenessScore',
            '$recentActivityScore'
          ]
        }
      }
    },
    { $sort: { totalScore: -1, mutualFriends: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: '$candidateUser._id',
        name: '$candidateUser.name',
        email: '$candidateUser.email',
        avatar: '$candidateUser.avatar',
        role: '$candidateUser.role',
        location: '$candidateUser.location',
        bio: '$candidateUser.bio',
        mutualFriends: 1,
        score: { $round: ['$totalScore', 2] },
        scoreBreakdown: {
          mutualFriends: { $round: ['$mutualFriendsScore', 2] },
          commonInterests: { $round: ['$commonInterestsScore', 2] },
          sameLocation: { $round: ['$sameLocationScore', 2] },
          sameRole: { $round: ['$sameRoleScore', 2] },
          profileCompleteness: { $round: ['$profileCompletenessScore', 2] },
          recentActivity: { $round: ['$recentActivityScore', 2] }
        }
      }
    }
  ])

  return suggestions
}

