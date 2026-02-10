import express from "express";
import authMiddleware from "../middleware/auth.js";
import Membership from "../models/Membership.js"
import Project from "../models/Project.js";
import Board from "../models/Board.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import Task from "../models/Task.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
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
                users: userIds.map(id => ({ _id: id })),
                type: "NEW_BOARD",
                icon: {
                    type: "PROJECT",
                    refId: projectId
                },
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
        const project = await Project.findById(projectId).select("name projectImage");
        if (!project) return res.status(404).json({ msg: "Project not found" });
        project.projectImage = formatImage(project.projectImage);

        const membership = await Membership.findOne({
            projectId,
            userId: req.user.id,
        }).select("role");

        if (!membership) return res.status(403).json({ msg: "Not a member of this project" });

        const boards = await Board
            .find({ projectId })
            .sort({ position: 1 })
            .select("name position color")
            .lean();

        const response = boards.map(board => ({
            _id: board._id,
            name: board.name,
            position: board.position,
            color: board.color,
            project,
        }));

        res.json(response);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// edit a board
router.patch("/board/:boardId", authMiddleware, async (req, res) => {
    const { boardId } = req.params;
    const { projectId, name, color } = req.body;

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
                users: userIds.map(id => ({ _id: id })),
                type: "EDIT_BOARD",
                icon: {
                    type: "PROJECT",
                    refId: projectId
                },
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
            return res.status(409).json({ msg: "Board name already exists" });
        res.status(500).json({ msg: err.message });
    }
});


// move board
router.patch("/move/:boardId", authMiddleware, async (req, res) => {
    const { boardId } = req.params;
    const { projectId, newPosition } = req.body;

    if (newPosition === undefined || newPosition === null)
        return res.status(400).json({ msg: "A position is required" });

    const session = await mongoose.startSession();

    const MAX_RETRIES = 3;
    try {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            let result = null;
            try {
                await session.withTransaction(async () => {
                    const auth = await Membership.exists({
                        projectId,
                        userId: req.user.id,
                        role: { $in: ["OWNER", "ADMIN"] }
                    }).session(session);
                    if (!auth) {
                        result = { status: 403, msg: "Unauthorized" };
                        return;
                    }

                    const board = await Board.findById(boardId).session(session);
                    if (!board) {
                        result = { status: 404, msg: "Board could not found" };
                        return;
                    }

                    if (!board.projectId.equals(projectId)) {
                        result = { status: 403, msg: "Board does not belong" };
                        return;
                    }

                    const oldPosition = board.position;
                    if (oldPosition === newPosition) {
                        result = { status: 200, msg: "No change" };
                        return;
                    }

                    const boardCount = await Board.countDocuments({ projectId }).session(session);
                    if (newPosition < 0 || newPosition >= boardCount) {
                        result = { status: 400, msg: "Position out of bounds" };
                        return;
                    }

                    const OFFSET = boardCount + 1;

                    board.position = boardCount;
                    await board.save({ session });

                    if (oldPosition < newPosition) {
                        await Board.updateMany({
                            projectId,
                            position: { $gt: oldPosition, $lte: newPosition }
                        },
                            { $inc: { position: OFFSET } },
                            { session }
                        );
                        await Board.updateMany({
                            projectId,
                            position: { $gt: oldPosition + OFFSET, $lte: newPosition + OFFSET }
                        },
                            { $inc: { position: -(OFFSET + 1) } },
                            { session }
                        );
                    }

                    if (oldPosition > newPosition) {
                        await Board.updateMany({
                            projectId,
                            position: { $gte: newPosition, $lt: oldPosition }
                        },
                            { $inc: { position: OFFSET } },
                            { session }
                        );
                        await Board.updateMany({
                            projectId,
                            position: { $gte: newPosition + OFFSET, $lt: oldPosition + OFFSET }
                        },
                            { $inc: { position: 1 - OFFSET } },
                            { session }
                        );
                    }
                    board.position = newPosition;
                    await board.save({ session });
                });

                if (result) return res.status(result.status).json({ msg: result.msg });

                const editorMembership = await Membership.findOne({
                    projectId,
                    userId: req.user.id
                }).select("userId").populate("userId", "firstname lastname");
                const members = await Membership.find({
                    projectId,
                    userId: { $ne: req.user.id },
                    role: { $in: ["OWNER", "ADMIN"] }
                }).select("userId").lean();
                const userIds = members.map(member => member.userId);
                const editor = editorMembership?.userId;

                if (userIds.length > 0 && editor) {
                    await Notification.create({
                        users: userIds.map(id => ({ _id: id })),
                        type: "EDIT_BOARD",
                        icon: {
                            type: "PROJECT",
                            refId: projectId
                        },
                        title: `${editor.firstname} ${editor.lastname} changed the positions of boards. Click to view changes!`,
                        action: {
                            type: "NAVIGATE",
                            url: `/project/${projectId}`
                        }
                    });
                }


                return res.status(200).json({ msg: "Board moved successfully" });
            } catch (err) {
                const isWriteConflict = err?.code === 112 || err?.codeName === "WriteConflict";
                const isTransient = err?.errorLabels?.includes?.("TransientTransactionError");
                if ((isWriteConflict || isTransient) && attempt < MAX_RETRIES) continue;
                throw err;
            }
        }
        return res.status(500).json({ msg: "Could not move" });
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// delete board
router.delete("/board/:boardId", authMiddleware, async (req, res) => {
    const { boardId } = req.params;
    if (!boardId) return res.status(400).json({ msg: "boardId is required" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const board = await Board.findById(boardId).session(session);
        if (!board) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Board not found" });
        }

        const tasksExist = await Task.exists({ boardId }).session(session);
        if (tasksExist) {
            await session.abortTransaction();
            res.status(403).json({ msg: "Board contains tasks, move or delete them first" });
        }

        const membership = await Membership.findOne({
            projectId: board.projectId,
            userId: req.user.id
        }).session(session);
        if (!membership) {
            await session.abortTransaction();
            res.status(403).json({ msg: "Unauthorized: Not a member" });
        }
        if (membership.role === "MEMBER") {
            await session.abortTransaction();
            res.status(403).json({ msg: "Unauthorized: OWNER or ADMIN only" });
        }

        const deletedPosition = board.position;

        await Board.deleteOne({ _id: boardId }).session(session);

        await Board.updateMany({
            projectId: board.projectId,
            position: { $gt: deletedPosition }
        }, {
            $inc: { position: -1 }
        }, { session });

        await session.commitTransaction();

        res.status(200).json({ msg: "Board deleted successfully" });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});



export default router;
