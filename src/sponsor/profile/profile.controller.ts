import { Request, Response } from "express";
import { ProfileService } from "./profile.service";

const profileService = new ProfileService();

export const createProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const profile = await profileService.createProfile(userId, req.body);
    res.status(201).json(profile);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("validation failed") || error.message.includes("required")) {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Profile already exists") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const profile = await profileService.getProfile(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json(profile);
  } catch (error: unknown) {
    if (error instanceof Error) res.status(500).json({ message: error.message });
    else res.status(500).json({ message: "Unknown error occurred" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const profile = await profileService.updateProfile(userId, req.body);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json(profile);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("validation failed") || error.message.includes("required")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
};
