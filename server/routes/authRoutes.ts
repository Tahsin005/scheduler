import { Router } from "express";
import { loginUser, registerUser, refreshToken, logoutUser } from "../controllers/authControllers.js";

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/refresh', refreshToken);
authRouter.post('/logout', logoutUser);

export default authRouter;
