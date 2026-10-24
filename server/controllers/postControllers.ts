import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { GoogleGenAI } from "@google/genai";
import Generation from "../models/Generation.js";

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

        let mediaUrl = null;

        if (generateImage) {
            mediaUrl = "https://images.unsplash.com/photo-1607827448387-a67db1383b59?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";
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
    
}


// get posts
export const getPosts = async(req: AuthRequest, res: Response): Promise<void> => {
    
}

// schedule post
export const schedulePost = async(req: AuthRequest, res: Response): Promise<void> => {
    
}