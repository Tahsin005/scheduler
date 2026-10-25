import { Router } from "express";
import { getAccounts, disconnectAccount, addAccount } from "../controllers/accountControllers.js";
import { protect } from "../middlewares/authMiddleware.js";

const accountRouter = Router();

accountRouter.get("/", protect, getAccounts);
accountRouter.post("/", protect, addAccount);
accountRouter.delete("/:id", protect, disconnectAccount);

export default accountRouter;