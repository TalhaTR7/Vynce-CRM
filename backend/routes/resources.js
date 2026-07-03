import express from "express";
import { list, read } from "../../mcp-server/client/index.js";


const router = express.Router();


router.get("/resources", async (req, res) => {
    const resources = await list();
    res.json(resources);
});

router.get("/resources/:name", async (req, res) => {
    try {
        const uri = `vynce://resources/${req.params.name}`;
        const text = await read(uri);
        res.json({ text });
    } catch (err) {
        console.error("Resource error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        console.log("API returned");
    }
});

export default router;
