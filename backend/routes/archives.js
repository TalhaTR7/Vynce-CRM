import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Archived from "../models/Archived.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import Membership from "../models/Membership.js";

const router = express.Router();

function recipients(ids) {
    return ids.map(id => ({ _id: id }));
}

function formatImage(image) {
    const url = image?.url;
    if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
    else return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// get archived tasks of a project
router.get("/project/:projectId", authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    if (!projectId) return res.status(404).json({ msg: "projectId is required" });

    try {
        const membership = await Membership.findOne({ projectId, userId: req.user.id });
        if (membership.role === "MEMBER") return res.status(403).json({ msg: "Not accessable" });

        let archives = await Archived
            .find({ projectId })
            .sort({ createdAt: 1 })
            .select("projectId creatorId title ethereum worktime difficulty activity")
            .populate("projectId", "_id projectImage name")
            .populate("creatorId", "profileImage firstname lastname");

        archives = archives.map(task => {
            task = task.toObject();
            const comment_count = task?.activity?.filter(action => action.type === "COMMENT").length || 0;
            if (task.projectId?.projectImage?.url)
                task.projectId.projectImage = formatImage(task.projectId.projectImage);
            if (task.creatorId?.profileImage?.url)
                task.creatorId.profileImage = formatImage(task.creatorId.profileImage);

            return {
                _id: task._id,
                title: task.title,
                ethereum: task.ethereum,
                worktime: task.worktime,
                difficulty: task.difficulty,
                project: task.projectId,
                creator: task.creatorId,
                comments: comment_count
            };
        });

        res.status(200).json(archives);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// close a task
router.patch("/task/close", authMiddleware, async (req, res) => {
    const { taskId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const task = await Task.findById(taskId).session(session);

        if (!task) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Task not found" });
        }

        if (!task.isSubmitted) {
            await session.abortTransaction();
            return res.status(400).json({ msg: "Task must be submitted before closing" });
        }

        if (!task.creatorId.equals(req.user.id)) {
            await session.abortTransaction();
            return res.status(401).json({ msg: "Unauthorized for closure" });
        }

        // make activity
        const creator = await User
            .findById(req.user.id)
            .select("firstname lastname")
            .session(session);

        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "TASK_CLOSED",
            content: `${creator.firstname} ${creator.lastname} closed this task`,
            time: new Date()
        });

        // reward assignee
        if (!task.isRewarded) {
            const assignee = await User
                .findById(task.assigneeId)
                .session(session);

            if (!assignee) {
                await session.abortTransaction();
                return res.status(404).json({ msg: "Assignee couldn't found" });
            }

            const THRESHOLD = 3000;
            const MP_TOTAL = assignee.motivationScore + task.motivation;
            const MP_LEVEL = Math.floor(MP_TOTAL / THRESHOLD);
            const MP_REM = MP_TOTAL % THRESHOLD;

            await User.findByIdAndUpdate(assignee._id, {
                $inc: {
                    ethereum: task.ethereum.calculated,
                    motivationLevel: MP_LEVEL
                },
                $set: {
                    motivationScore: MP_REM
                }
            }, { session });
            task.isRewarded = true;
        }

        // make notification
        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create([{
                users: recipients([task.assigneeId]),
                type: "TASK_CLOSED",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `Task was closed and you were rewarded [${task.title}]`,
                action: {
                    type: "MESSAGE"
                }
            }], { session });
        }

        // wrap up
        task.closed = true;
        task.dueDate = null;
        task.boardId = null;
        task.assigneeId = null;
        task.isTimerRunning = false;

        const archived = task.toObject();
        delete archived._id;

        await Archived.create([archived], { session });
        await Task.deleteOne({ _id: task._id }).session(session);

        await session.commitTransaction();

        res.status(200).json({
            closed: archived.closed,
            activity: task.activity.at(-1)
        });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// archive a task
router.patch("/task/archive", authMiddleware, async (req, res) => {
    const { taskId } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const task = await Task
            .findById(taskId)
            .session(session);

        if (!task) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Task not found" });
        }

        if (!task.creatorId.equals(req.user.id)) {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Unauthorized to delete" });
        }

        // make activity
        const creator = await User
            .findById(req.user.id)
            .select("firstname lastname")
            .session(session);

        task.activity.push({
            type: "ACTION",
            userId: req.user.id,
            action: "TASK_DELETED",
            content: `${creator.firstname} ${creator.lastname} archived this task`,
            time: new Date()
        });

        // make notification
        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create([{
                users: recipients([task.assigneeId]),
                type: "TASK_DELETED",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `${creator.firstname} ${creator.lastname} archived the task [${task.title}]`,
                action: {
                    type: "MESSAGE"
                }
            }], { session });
        }

        task.closed = true;
        task.dueDate = null;
        task.boardId = null;
        task.assigneeId = null;
        task.isTimerRunning = false;

        const archived = task.toObject();
        delete archived._id;

        await Archived.create([archived], { session });
        await Task.deleteOne({ _id: task._id }).session(session);

        await session.commitTransaction();

        res.status(200).json({
            closed: task.closed,
            activity: task.activity.at(-1)
        });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// restore a task
router.post("/restore/:taskId", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const {
        boardId,
        title,
        assigneeId,
        dueDate = null,
        ethereum = 1,
        difficulty = 1,
        description = ""
    } = req.body;

    if (!boardId || !title || !assigneeId)
        return res.status(400).json({ msg: "Required fields are missing" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let archived = await Archived.findById(taskId).session(session);
        if (!archived) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Archived task not found" });
        }

        const archivedObj = archived.toObject();
        delete archived._id;

        const assignee = await User.findById(assigneeId).select("currentMood").session(session);
        if (!assignee) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Assignee task not found" });
        }

        const creator = await User.findById(req.user.id).select("firstname lastname").session(session);

        const membership = await Membership.findOne({
            projectId: archived.projectId,
            userId: assignee._id,
        }).select("role").session(session);

        if (!membership) {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Assignee is not a member of this project" })
        };

        const setReward = Math.max(1, Number(ethereum) || 1);
        const multiplier = {
            ANGRY: 2,
            EXHAUSTED: 1.8,
            SICK: 1.6,
            SAD: 1.5,
            NORMAL: 1.5,
            OKAY: 1.5,
            VIBING: 1.4,
            HAPPY: 1.2,
            CHILLING: 1
        }[assignee.currentMood] || 1;
        const calculatedReward = Math.max(1, Math.floor(setReward * multiplier));

        const [task] = await Task.create([{
            ...archivedObj,
            boardId,
            title,
            creatorId: req.user.id,
            assigneeId,
            dueDate,
            ethereum: {
                assigned: setReward,
                calculated: calculatedReward
            },
            difficulty,
            description,
            activity: [...archived.activity, {
                type: "ACTION",
                userId: req.user.id,
                action: "TASK_RESTORED",
                content: "Task was restored from archive"
            }]
        }], { session });

        if (assigneeId !== req.user.id) {
            await Notification.create([{
                users: [{ _id: assigneeId }],
                type: "TASK_RESTORED",
                icon: {
                    type: "PROJECT",
                    refId: archived.projectId
                },
                title: `${creator.firstname} ${creator.lastname} restored this task`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                },
            }], { session });
        }

        await Archived.deleteOne({ _id: archived._id }).session(session);
        await session.commitTransaction();
        res.status(201).json(task);
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// permanently delete a task from archives
router.delete("/task/:taskId/", authMiddleware, async (req, res) => {
    const { taskId } = req.params;

    try {
        const task = await Archived.findById(taskId);

        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (!task.creatorId.equals(req.user.id))
            return res.status(403).json({ msg: "Unauthorized to delete" });

        // make notification

        const actor = await User
            .findById(req.user.id)
            .select("firstname lastname");

        const members = await Membership.find({
            projectId: task.projectId,
            userId: { $ne: req.user.id },
            role: "OWNER"
        }).select("userId").lean();
        const userIds = members.map(member => member.userId);

        if (userIds.length > 0) await Notification.create({
            users: userIds,
            type: "SHREDDING",
            icon: {
                type: "PROJECT",
                refId: task.projectId
            },
            title: `${actor.firstname} ${actor.lastname} permanently deleted the task [${task.title}]`,
            action: {
                type: "MESSAGE"
            }
        });

        // delete it actually
        await Task.findByIdAndDelete(taskId);

        res.status(200).json({ msg: "Task permanently deleted" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;