import dotenv from "dotenv";
dotenv.config();

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8","1.1.1.1"]);

import express from "express";
import connectDB from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.routes.js";
import interviewRouter from "./routes/interview.route.js";

const app = express();

app.use(cors({
    origin:"http://localhost:5173",
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());

//routes

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interview", interviewRouter)

const PORT = process.env.PORT || 6000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on Port:${PORT}`);
        });
    } catch (err) {
        console.error("Server failed to start", err);
    }
};

startServer();