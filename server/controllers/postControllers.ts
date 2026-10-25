import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { GoogleGenAI } from "@google/genai";
import Generation from "../models/Generation.js";
import Post from "../models/Post.js";
import { cloudinary } from "../config/cloudinary.js";

// generate post
export const generatePost = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { prompt, tone, generateImage } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(400).json({
                message: "Gemini API key is missing."
            });
            return;
        }

        const ai = new GoogleGenAI({
            apiKey
        });

        // generate text
        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a social media post based on this prompt: "${prompt}". Tone: ${tone}. 
            Include relevant hashtags.
            Format the response as JSON with "content" and "imagePrompt" fields.
            The "imagePrompt" should be a highly descriptive prompt for an image generator that complements the post.
            `,
        })

        let content = "";
        let imagePrompt = prompt;

        try {
            const rawText = textResponse.text || "";
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);

            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {
                content: rawText,
                imagePrompt: prompt
            };

            content = data.content;
            imagePrompt = data.imagePrompt;
        } catch (error) {
            content = textResponse.text || "";
        }

        let mediaUrl: string | null = null;

        if (generateImage) {
            try {
                const seed = Math.floor(Math.random() * 10000000);
                const promptForImage = (imagePrompt || prompt || "cute pet").trim().slice(0, 400);
                const tempUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptForImage)}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;

                // Upload to Cloudinary for persistence
                const uploadResult = await cloudinary.uploader.upload(tempUrl, {
                    folder: "ai-generations",
                });
                mediaUrl = uploadResult.secure_url;
            } catch (err: any) {
                console.error("Cloudinary upload failed:", err);
            }
        }

        // save generation to DB
        const generation = await Generation.create({
            user: req.user._id,
            prompt,
            content,
            mediaUrl,
            mediaType: mediaUrl ? "image" : undefined,
            tone
        });

        res.json(generation);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error"
        })
    }
}

// get generations
export const getGenerations = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const generations = await Generation.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        res.json(generations);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error"
        });
    }
}


// get posts
export const getPosts = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const posts = await Post.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        res.json(posts);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error"
        });
    }
}

// schedule post
export const schedulePost = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { content, platforms, scheduledFor, status } = req.body;

        let parsedPlatforms = platforms;
        if (typeof platforms === "string") {
            try {
                parsedPlatforms = JSON.parse(platforms);
            } catch (error) {
                parsedPlatforms = platforms.split(",");
            }
        }

        let mediaUrl: string | undefined = req.body.mediaUrl;
        let mediaType: "image" | "video" | undefined = req.body.mediaType;

        if (req.file) {
            const result = await new Promise<any>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "auto", folder: "social-scheduler" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file!.buffer);
            });
            mediaUrl = result.secure_url;
            mediaType = result.resource_type === "video" ? "video" : "image";
        }

        const post = await Post.create({
            user: req.user._id,
            content,
            platforms: parsedPlatforms,
            mediaUrl,
            mediaType,
            scheduledFor,
            status,
        });
        res.status(201).json(post);
    } catch (error: any) {
        res.status(500).json({
            message: error?.message || "Server error"
        });
    }
}