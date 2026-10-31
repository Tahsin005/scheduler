import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import socialAuthRouter from "./routes/socialAuthRoutes.js";
import accountRouter from "./routes/accountRoutes.js";
import postRouter from "./routes/postRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import { initScheduler } from "./services/schedulerService.js";

const app = express();

// trust reverse proxy for Render / Cloudflare
app.set("trust proxy", 1);

// database connection
await connectDB();

// middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());

const port = Number(process.env.PORT) || 3000;

app.get('/', (_req: Request, res: Response) => {
    res.send('Server is Live!');
});

// health check endpoints for Render and frontend cold-start detection
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
        status: 'ok',
        message: 'Server is healthy and running',
        uptime: Math.floor(process.uptime()),
        database: isDbConnected ? 'connected' : 'connecting',
        timestamp: new Date().toISOString(),
    });
});

// routes
app.use("/api/auth", authRouter);
app.use("/api/oauth", socialAuthRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/posts", postRouter);
app.use("/api/activity", activityRouter);

// initialize scheduler
initScheduler();

// global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({ message });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${port}`);
});
