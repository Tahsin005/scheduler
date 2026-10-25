import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import ActivityLog from "../models/ActivityLog.js";

// get all activity
export const getActivity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const activities = await ActivityLog.find({
            user: req.user._id,
        }).sort({ createdAt: -1 }).limit(10).populate("relatedPost", "content");
        res.json(activities);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error",
        })
    }
}