import express from "express";
import authMiddleware from "../middleware/auth.js";


const router = express.Router();

router.post("/chat", authMiddleware, async (req, res) => {
    const { contents, system_instruction } = req.body;
    console.log("KEY:", process.env.CLAUDE_API_KEY);
    const apiKey = process.env.CLAUDE_API_KEY;
    try {
        const response = await fetch(
            `...`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents, system_instruction })
        }
        );
        const data = await response.json();
        console.log("Claude response:", JSON.stringify(data, null, 2));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


router.get("/models", authMiddleware, async (req, res) => {
    const apiKey = process.env.CLAUDE_API_KEY;
    const response = await fetch(
        `...`
    );
    const data = await response.json();
    res.status(200).json(data);
});


export default router;