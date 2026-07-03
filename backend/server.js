import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import projectRoutes from "./routes/projects.js";
import memberRoutes from "./routes/memberships.js";
import boardRoutes from "./routes/boards.js";
import taskRoutes from "./routes/tasks.js";
import archiveRoutes from "./routes/archives.js";
import auctionRoutes from "./routes/markets.js";
import messageRoutes from "./routes/messages.js";
import mailRoutes from "./routes/inbox.js";
import inviteRoutes from "./routes/invitations.js";
import leaderboardRoutes from "./routes/leaderboards.js";
import geminiRoutes from "./routes/gemini.js";
import resourceRoute from "./routes/resources.js";
import "./cron/taskDueNotifications.js";
import "./cron/cleanupNotifications.js";
import "./cron/resetWeeklyXP.js";
import "./cron/handleAuctions.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/memberships", memberRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/archives", archiveRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/inbox", mailRoutes);
app.use("/api/invitations", inviteRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/uploads", express.static("uploads"));
app.use("/api/resources", resourceRoute);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

app.listen(process.env.PORT, () => console.log(`Server running on ${process.env.PORT}`));
