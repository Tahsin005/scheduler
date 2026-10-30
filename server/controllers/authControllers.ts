import { Request, Response } from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN || "10000d") as any });
}

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
        await user.save();

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id.toString())
            })
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists && (await bcrypt.compare(password, userExists.password))) {
            res.status(200).json({
                _id: userExists._id,
                name: userExists.name,
                email: userExists.email,
                token: generateToken(userExists._id.toString())
            })
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
