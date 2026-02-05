import mongoose from "mongoose"

const MONGO_URI = "mongodb+srv://nasireaglines_db_user:Mk9%239AvT@rag.d74ni5g.mongodb.net/TalkNation?retryWrites=true&w=majority"

async function fixIndexes() {
  await mongoose.connect(MONGO_URI)

  const db = mongoose.connection.db
  if (!db) {
    throw new Error("MongoDB connection not initialized")
  }

  const collection = db.collection("conversations")

  const indexes = await collection.indexes()

  const badIndex = indexes.find(i => i.name === "participants_1_deletedFor_1")
  if (badIndex) {
    await collection.dropIndex("participants_1_deletedFor_1")
  }

  await collection.createIndex({ participants: 1 })

  console.log("Indexes fixed successfully")
  process.exit(0)
}

fixIndexes().catch(err => {
  console.error(err)
  process.exit(1)
})
