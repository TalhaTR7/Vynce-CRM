import express from "express";
import { list, read } from "../../mcp-server/client.js";


const router = express.Router();


router.get("/resources", async (req, res) => {
    const resources = await list();
    res.json(resources);
});

router.get("/resources/:name", async (req, res) => {
    const uri = `vynce://resources/${req.params.name}`;
    const text = await read(uri);
    res.json({ text });
});

export default router;
