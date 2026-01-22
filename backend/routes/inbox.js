import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Member from "../models/Membership.js";
import Board from "../models/Board.js";
import Task from "../models/Task.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
    else return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


router.get("/user", authMiddleware, async (req, res) => {

    const inbox = [
        {
            
        }
    ]
});

export default router;
