import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


router.post("/signup", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const uploadsDir = path.resolve(__dirname, "..", "uploads", "users");
    const defaultImagePath = path.resolve(__dirname, "..", "..", "frontend", "public", "assets", "profile.png");

    const newUser = new User({
      firstname,
      lastname,
      email,
      passwordHash
    });

    const userId = newUser._id.toString();
    newUser.profileImage = { url: `/uploads/users/${userId}.png` };

    await fs.mkdir(uploadsDir, { recursive: true });
    const destImagePath = path.join(uploadsDir, `${userId}.png`);
    await fs.copyFile(defaultImagePath, destImagePath);

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const userResponse = {
      _id: newUser._id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
    };

    res.status(201).json({ token, user: userResponse });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const userResponse = {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
    };

    res.status(200).json({ token, user: userResponse });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
