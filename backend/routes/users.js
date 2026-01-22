import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

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
router.patch("/user", authMiddleware, async (req, res) => {
  const { firstname, lastname } = req.body;
  try {
    let user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (firstname.trim() && firstname !== user.firstname)
      user.firstname = firstname;
    if (lastname.trim() && lastname !== user.lastname)
      user.lastname = lastname;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


export default router;
