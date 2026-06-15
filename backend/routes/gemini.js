import express from "express";
import authMiddleware from "../middleware/auth.js";


const router = express.Router();

router.post("/chat", authMiddleware, async (req, res) => {
    const { contents, system_instruction } = req.body;
    console.log("KEY:", process.env.GEMINI_API_KEY);
    const apiKey = process.env.GEMINI_API_KEY;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents, system_instruction })
        }
        );
        const data = await response.json();
        console.log("Gemini response:", JSON.stringify(data, null, 2));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


router.get("/models", authMiddleware, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();
    res.status(200).json(data);
});


export default router;