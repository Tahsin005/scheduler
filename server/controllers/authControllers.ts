import { Request, Response } from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET! + "_refresh");

export const generateAccessToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as any
    });
};

export const generateRefreshToken = (id: string): string => {
    return jwt.sign({ id }, getRefreshSecret(), {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any
    });
};

export const generateToken = generateAccessToken;

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: "User already exists." });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ name, email, password: hashedPassword });
        const token = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
            refreshToken
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists && (await bcrypt.compare(password, userExists.password))) {
            const token = generateAccessToken(userExists._id.toString());
            const refreshToken = generateRefreshToken(userExists._id.toString());

            userExists.refreshToken = refreshToken;
            await userExists.save();

            res.status(200).json({
                _id: userExists._id,
                name: userExists.name,
                email: userExists.email,
                token,
                refreshToken
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken: tokenFromBody } = req.body;
        if (!tokenFromBody) {
            res.status(401).json({ message: "Refresh token is required" });
            return;
        }

        let decoded: any;
        try {
            decoded = jwt.verify(tokenFromBody, getRefreshSecret());
        } catch (err: any) {
            res.status(401).json({ message: "Invalid or expired refresh token" });
            return;
        }

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== tokenFromBody) {
            res.status(401).json({ message: "Refresh token is invalid or has been revoked" });
            return;
        }

        const newAccessToken = generateAccessToken(user._id.toString());
        const newRefreshToken = generateRefreshToken(user._id.toString());

        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            token: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            }
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
        }
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
