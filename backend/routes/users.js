import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Archived from "../models/Archived.js";
import Membership from "../models/Membership.js";
import Notification from "../models/Notification.js";
import createUploader from "../middleware/multer.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageUpload = createUploader({
  folder: "users",
  allowedTypes: ["image/png"],
});

function formatImage(image) {
  const url = image?.url;
  return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// get logged in user
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ msg: "User couldn't found" });

    // Expire mood to NORMAL after 3 hours
    const threeHours = 3 * 60 * 60 * 1000;
    if (user.mood && user.mood.value !== "NORMAL" && (Date.now() - new Date(user.mood.updatedAt).getTime() > threeHours)) {
      user.mood.value = "NORMAL";
      await user.save();
    }

    user.profileImage = formatImage(user.profileImage);
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// get user by id
router.get("/id/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(404).json({ msg: "User couldn't found" });
    user.profileImage = formatImage(user.profileImage);
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// get user by email
router.get("/email/:email", authMiddleware, async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }).select("-passwordHash");
    if (!user) return res.status(404).json({ msg: "User couldn't found" });
    user.profileImage = formatImage(user.profileImage);
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// update user meta
router.patch("/user", authMiddleware, imageUpload.single("image"), async (req, res) => {
  const { firstname, lastname } = req.body;
  try {
    const update = {};
    if (firstname) update.firstname = firstname;
    if (lastname) update.lastname = lastname;
    if (req.file) update["profileImage.url"] = `/uploads/users/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    );

    if (!user) return res.status(404).json({ msg: "User not found" });

    user.profileImage = formatImage(user.profileImage);

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// update user mood
router.patch("/user/mood", authMiddleware, async (req, res) => {
  const { mood } = req.body;

  if (!mood) return res.status(400).json({ msg: "Mood is required" });

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { "mood.value": mood, "mood.updatedAt": Date.now() } },
      { new: true }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ msg: "Mood updated successfully", currentMood: user.mood.value });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// change password
router.patch("/user/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ msg: "Invalid current password" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(
      req.user.id,
      { passwordHash },
      { new: true }
    );

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ msg: "Password changed successfully", token });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// delete user
router.delete("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const ownerMemberships = await Membership.find({
      userId: req.user.id,
      role: "OWNER"
    }).select("projectId");

    if (ownerMemberships.length > 0) {
      return res.status(400).json({
        msg: "Delete your projects or transfer their ownerships",
        projectIds: ownerMemberships.map(membership => membership.projectId)
      });
    }

    const memberships = await Membership.find({
      userId: req.user.id,
      role: { $in: ["ADMIN", "MEMBER"] }
    }).select("projectId");

    const recepientIds = new Set();

    for (const membership of memberships) {
      const members = await Membership.find({
        projectId: membership.projectId,
        userId: { $ne: req.user.id }
      }).select("userId");
      members.forEach(member => recepientIds.add(member.userId.toString()));
    }

    const tasks = await Task.find({ assigneeId: req.user.id });

    if (tasks.length > 0) {
      const archives = tasks.map(task => {
        const archived = task.toObject();
        delete archived._id;

        archived.closed = true;
        archived.dueDate = null;
        archived.boardId = null;
        archived.assigneeId = null;
        archived.isTimerRunning = false;
        archived.ethereum.assigned = 0;

        return archived;
      });

      await Archived.insertMany(archives);
      await Task.deleteMany({ assigneeId: req.user.id });
    }

    await Membership.deleteMany({ userId: req.user.id });
    // deleting his projects won't matter since user is forced
    // to delete owned projects first before deleting account

    const uploadsDir = path.resolve(__dirname, "..", "uploads", "users");
    const imagePath = path.join(uploadsDir, `${user._id}.png`);

    await User.findByIdAndDelete(req.user.id);
    try {
      await fs.unlink(imagePath);
    } catch (fileErr) {
      if (fileErr.code !== "ENOENT") throw fileErr;
    }

    if (recepientIds.size > 0) {
      await Notification.create({
        users: Array.from(recepientIds),
        type: "DELETED_ACCOUNT",
        icon: {
          type: "USER",
          refId: user._id
        },
        title: `${user.firstname} ${user.lastname} deleted their account. Their tasks have been archived.`,
        action: { type: "MESSAGE" }
      })
    }

    res.status(200).json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
