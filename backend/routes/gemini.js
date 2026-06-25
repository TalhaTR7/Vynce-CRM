import express from "express";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
];

async function callGemini(apiKey, model, body) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }
    );
    const data = await response.json();
    return { status: response.status, data };
}

router.post("/chat", authMiddleware, async (req, res) => {
    const { contents, system_instruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    for (const model of MODELS) {
        try {
            const { status, data } = await callGemini(apiKey, model, { contents, system_instruction });
            if (status === 503 || data?.error?.code === 503) continue; // try next model
            return res.status(200).json(data);
        } catch (err) {
            continue;
        }
    }

    res.status(503).json({ msg: "All models are currently unavailable. Please try again later." });
});

router.get("/models", authMiddleware, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

export default router;