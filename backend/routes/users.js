import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Membership from "../models/Membership.js";
import Project from "../models/Project.js";
import Chat from "../models/Chat.js";
import createUploader from "../middleware/multer.js";

const router = express.Router();

const imageUpload = createUploader({
  folder: "users",
  allowedTypes: ["image/png"],
});

function formatImage(image) {
  const url = image?.url;
  if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
  else return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// get all users
router.get("/", authMiddleware, async (req, res) => {
  try {
    let users = await User.find().select("-passwordHash");

    users = users.map(user => {
      const userObj = user.toObject();
      userObj.profileImage.url = userObj.profileImage.url.startsWith("/assets")
        ? userObj.profileImage.url
        : `http://localhost:${process.env.PORT}/api${userObj.profileImage.url}`;
      return userObj;
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// get logged in user
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    user.profileImage.url = user.profileImage.url.startsWith("/assets")
      ? user.profileImage.url
      : `http://localhost:${process.env.PORT}/api${user.profileImage.url}`
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// get user by id
router.get("/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(404).json({ msg: "User not found" });
    user.profileImage.url = user.profileImage.url.startsWith("/assets")
      ? user.profileImage.url
      : `http://localhost:${process.env.PORT}/api${user.profileImage.url}`
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

    const userResponse = {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
    };

    res.status(201).json({ token, user: userResponse });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });


    const userMemberships = await Membership.find({
      userId: req.user.id,
      role: "OWNER"
    });

    if (userMemberships.length > 0) {
      return res.status(400).json({
        msg: "Delete your projects or transfer their ownerships",
        userProjectIds: userMemberships.map(membership => membership.projectId)
      });
    }

    await Membership.deleteMany({ userId: req.user.id });
    await Task.deleteMany({ assigneeId: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



export default router;
