import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getActivities } from "../controllers/activityControllers.js";

const activityRouter = express.Router();

activityRouter.get("/", protect, getActivities);

export default activityRouter;