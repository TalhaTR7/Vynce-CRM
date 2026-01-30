import express from "express";
import authMiddleware from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
    else return `http://localhost:${process.env.PORT}/api${url}`;
}


// get user mails
router.get("/user", authMiddleware, async (req, res) => {
    try {
        let inbox = await Notification.find({
            users: {
                $elemMatch: { _id: req.user.id }
            }
        }).sort({ createdAt: -1 }).lean();

        inbox = await Promise.all(
            inbox.map(async mail => {
                const userEntry = mail.users.find(id => id.user === req.user.id);
                if (mail.icon.type === "PROJECT") {
                    const project = await Project
                        .findById(mail.icon.refId)
                        .select("projectImage")
                        .lean();
                    mail.icon.url = formatImage(project.projectImage);
                }
                else if (mail.icon.type === "USER") {
                    const user = await User
                        .findById(mail.icon.refId)
                        .select("profileImage")
                        .lean();
                    mail.icon.url = formatImage(user.profileImage);
                }
                return mail;
            })
        );

        res.status(200).json(inbox);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// mark as read on click
router.patch("/read/:mailId", authMiddleware, async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const mailId = new mongoose.Types.ObjectId(req.params.mailId);

    try {
        const mail = await Notification.findOneAndUpdate(
            { _id: mailId },
            { $set: { "users.$[elem].read": true } },
            {
                arrayFilters: [{ "elem._id": userId }],
                new: true
            }
        );

        if (!mail) return res.status(200).json({ msg: "Already read or not found" });

        mail.read = true;
        await mail.save();
        res.status(200).json({ msg: "Marked as read" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// read selected mails at once
router.patch("/read-multiple", authMiddleware, async (req, res) => {
    const { mailIds } = req.body;

    if (mailIds.length === 0) return res.status(400).json({ msg: "Empty array" });

    try {
        const result = await Notification.updateMany(
            { _id: { $in: mailIds }, "users._id": req.user.id, "users.read": false },
            { $set: { "users.$.read": true } }
        );

        res.status(200).json({ msg: "Marked as read" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// mark all as read
router.patch("/read-all", authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { "users._id": req.user.id, "users.read": false },
            { $set: { "users.$.read": true } }
        );

        res.status(200).json({ msg: "Marked as read" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;



