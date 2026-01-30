import express from "express";
import authMiddleware from "../middleware/auth.js";
import Membership from "../models/Membership.js"
import Project from "../models/Project.js";
import Board from "../models/Board.js";
import Notification from "../models/Notification.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
    else return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// create a board
router.post("/board", authMiddleware, async (req, res) => {
    const { projectId, name, color } = req.body;

    try {
        if (!projectId || !name) return res.status(400).json({ msg: "projectId and name are required" });

        const project = await Project.findById(projectId).select("_id");
        if (!project) return res.status(404).json({ msg: "Project not found" });

        const boardExists = await Board.exists({ name: name, projectId: projectId });
        if (boardExists) return res.status(409).json({ msg: "Board already exists" });

        const membership = await Membership.findOne({
            projectId,
            userId: req.user.id,
        }).select("role userId").populate("userId", "firstname lastname");

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        if (!["OWNER", "ADMIN"].includes(membership.role))
            return res.status(403).json({ msg: "Not an OWNER or ADMIN" });

        const lastBoard = await Board
            .findOne({ projectId })
            .sort({ position: -1 })
            .select("position");

        const position = lastBoard ? lastBoard.position + 1 : 0;

        const board = await Board.create({
            projectId,
            name,
            position,
            color,
            creator: req.user.id
        });

        const members = await Membership.find({
            projectId,
            userId: { $ne: req.user.id },
            role: { $in: ["OWNER", "ADMIN"] }
        }).select("userId").lean();
        const userIds = members.map(member => member.userId);
        const creator = membership.userId;

        if (userIds.length > 0) {
            await Notification.create({
                userIds,
                type: "NEW_BOARD",
                icon: { type: "PROJECT", refId: projectId },
                title: `${creator.firstname} ${creator.lastname} created a new board [${name}]`,
                action: {
                    type: "NAVIGATE",
                    url: `/project/${projectId}`
                }
            });
        }

        res.status(201).json(board);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get all boards of the project
router.get("/project/:projectId", authMiddleware, async (req, res) => {
    const { projectId } = req.params;

    try {
        if (!projectId) return res.status(400).json({ msg: "projectId is required" });

        const projectExists = await Project.exists({ _id: projectId });
        if (!projectExists) return res.status(404).json({ msg: "Project not found" });

        const membership = await Membership.findOne({
            projectId,
            userId: req.user.id,
        }).select("role");

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        let boards = await Board
            .find({ projectId })
            .sort({ position: 1 })
            .select("name position color projectId")
            .populate("projectId", "name projectImage")
            .lean();

        boards = boards.map(board => {
            board.projectId.projectImage = formatImage(board.projectId.projectImage);
            return {
                _id: board._id,
                name: board.name,
                position: board.position,
                color: board.color,
                project: board.projectId,
            }
        });

        res.json(boards);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// edit a board
router.patch("/board/:boardId", authMiddleware, async (req, res) => {
    const { boardId } = req.params;
    const { projectId, name, color, position } = req.body;

    try {
        if (!projectId || !boardId)
            return res.status(400).json({ msg: "projectId and boardId are required" });

        const projectExists = await Project.exists({ _id: projectId });
        if (!projectExists) return res.status(404).json({ msg: "Project not found" });

        const board = await Board.findOne({ _id: boardId, projectId });
        if (!board) return res.status(404).json({ msg: "Board doesn't exist" });

        const membership = await Membership.findOne({
            projectId,
            userId: req.user.id
        }).select("role userId").populate("userId", "firstname lastname");

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        if (!["OWNER", "ADMIN"].includes(membership.role))
            return res.status(403).json({ msg: "Unauthorized" });

        if (name !== board.name) board.name = name;
        if (color) board.color = color;
        if (position !== undefined && position !== board.position) {
            if (position < 0) res.status(500).json({ msg: "Position can't be negative" });
            board.position = position;
        }

        await board.save();

        const members = await Membership.find({
            projectId,
            userId: { $ne: req.user.id },
            role: { $in: ["OWNER", "ADMIN"] }
        }).select("userId").lean();
        const userIds = members.map(member => member.userId);
        const editor = membership.userId;

        if (userIds.length > 0) {
            await Notification.create({
                userIds,
                type: "EDIT_BOARD",
                icon: { type: "PROJECT", refId: projectId },
                title: `${editor.firstname} ${editor.lastname} made edits to the board. Click to view changes!`,
                action: {
                    type: "NAVIGATE",
                    url: `/project/${projectId}`
                }
            });
        }

        res.json(board);
    } catch (err) {
        if (err.code === 11000)
            return res.status(409).json({ msg: "Board name already exists or position is occupied" });
        res.status(500).json({ msg: err.message });
    }
});


export default router;
