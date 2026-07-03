import express from "express";
import { list, read } from "../../mcp-server/client/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const resources = await list();
    res.json(resources);
});

router.get("/:name", async (req, res) => {
    const uri = `vynce://resources/${req.params.name}`;
    const text = await read(uri);
    res.json({ text });
});

export default router;
