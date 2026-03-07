import express from "express";
import authMiddleware from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
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
                if (mail.icon.type === "PROJECT") {
                    const project = await Project
                        .findById(mail.icon.refId)
                        .select("projectImage")
                        .lean();
                    if (project) mail.icon.url = formatImage(project.projectImage);
                }
                else if (mail.icon.type === "USER") {
                    const user = await User
                        .findById(mail.icon.refId)
                        .select("profileImage")
                        .lean();
                    if (user) mail.icon.url = formatImage(user.profileImage);
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
router.patch("/read", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { mailId } = req.body;

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
    const { selected } = req.body;

    try {
        await Notification.updateMany({
            _id: { $in: selected },
            "users._id": req.user.id,
            "users.read": false
        }, {
            $set: { "users.$.read": true }
        });

        res.status(200).json({ msg: "Marked as read" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// delete selected mails
router.patch("/delete", authMiddleware, async (req, res) => {
    const { selected } = req.body;

    try {
        await Notification.deleteMany({
            _id: { $in: selected },
            "users._id": req.user.id
        });
        res.status(200).json({ msg: "Mails Deleted" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;



