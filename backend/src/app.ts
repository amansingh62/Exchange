import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "../src/auth/authRoutes.js"

export const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);