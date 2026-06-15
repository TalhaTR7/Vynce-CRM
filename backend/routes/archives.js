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
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
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
            const assignee = await User.findById(task.assigneeId).session(session);
            if (!assignee) {
                await session.abortTransaction();
                return res.status(404).json({ msg: "Assignee couldn't be found" });
            }

            // Overdue penalty — deduct 10% per day overdue, floor at 20% of original
            let finalReward = task.ethereum.calculated;
            if (task.dueDate && new Date() > new Date(task.dueDate)) {
                const daysLate = Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
                const penalty = Math.min(0.8, daysLate * 0.10); // max 80% deduction
                finalReward = Math.max(1, Math.floor(task.ethereum.calculated * (1 - penalty)));
            }

            const THRESHOLD = 3000;
            const MP_TOTAL = assignee.motivationScore + task.motivation;
            const MP_LEVEL = Math.floor(MP_TOTAL / THRESHOLD);
            const MP_REM = MP_TOTAL % THRESHOLD;

            await User.findByIdAndUpdate(assignee._id, {
                $inc: {
                    ethereum: finalReward,   // was task.ethereum.calculated
                    motivationLevel: MP_LEVEL
                },
                $set: { motivationScore: MP_REM }
            }, { session });

            task.isRewarded = true;
        }

        const isOverdue = task.dueDate && new Date() > new Date(task.dueDate);

        // make notification
        if (!task.assigneeId.equals(task.creatorId)) {
            await Notification.create([{
                users: recipients([task.assigneeId]),
                type: "TASK_CLOSED",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `Task was closed and you were rewarded ${isOverdue ? "(overdue penalty applied)" : ""}`,
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

        const creator = await User.findById(req.user.id).select("firstname lastname").session(session);

        const assignee = await User.findById(assigneeId).select("mood").session(session);
        if (!assignee) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Assignee task not found" });
        }

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
            CRYING: 1.7,
            SAD: 1.3,
            NORMAL: 1,
            OKAY: 1.3,
            HAPPY: 1.7,
            ECSTATIC: 2
        }[assignee.mood?.value || "NORMAL"] || 1;
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
            timerStartedAt: null,
            worktime: 0,
            motivation: 0,
            isTimerRunning: false,
            isSubmitted: false,
            isRewarded: false,
            closed: false,
            activity: [{
                type: "ACTION",
                userId: req.user.id,
                action: "TASK_RESTORED",
                content: `${creator.firstname} ${creator.lastname} restored this task`
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
                title: `${creator.firstname} ${creator.lastname} restored this task and assigned it to you. Click to open it.`,
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

        const actor = await User
            .findById(req.user.id)
            .select("firstname lastname");

        const membership = await Membership.findOne({
            projectId: task.projectId,
            userId: req.user.id,
            role: { $in: ["OWNER", "ADMIN"] }
        }).lean();
        if (!membership) return res.status(403).json({ msg: "Not authorized" });

        if (membership.role === "ADMIN") {
            const owner = await Membership.findOne({
                projectId: task.projectId,
                role: "OWNER"
            });
            await Notification.create({
                users: [{ _id: owner.userId }],
                type: "SHREDDING",
                icon: { type: "PROJECT", refId: task.projectId },
                title: `${actor.firstname} ${actor.lastname} permanently deleted a task`,
                action: { type: "MESSAGE" }
            });
        }

        await Archived.findByIdAndDelete(taskId);
        res.status(200).json({ msg: "Task permanently deleted" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// delete tasks in bulk from archives
router.delete("/tasks", authMiddleware, async (req, res) => {
    const { taskIds, projectId } = req.body;

    if (!projectId) return res.status(400).json({ msg: "projectId is required" });
    if (!Array.isArray(taskIds)) return res.status(400).json({ msg: "Invalid argument: taskIds" });

    try {
        const tasks = await Archived.find({ _id: { $in: taskIds }, projectId });

        const actor = await User
            .findById(req.user.id)
            .select("firstname lastname");

        const membership = await Membership.findOne({
            projectId,
            userId: req.user.id,
            role: { $in: ["OWNER", "ADMIN"] }
        }).lean();
        if (!membership) return res.status(403).json({ msg: "Not authorized" });

        /*
        only admins and the owner can do shredding, if its an admin,
        there will always be an owner, if its the owner, no need to
        notify anyone because the only one to know about the shredding
        is the owner itself
        */

        if (membership.role === "ADMIN") {
            const owner = await Membership.findOne({
                projectId,
                role: "OWNER"
            }).lean();
            await Notification.create({
                users: [{ _id: owner.userId }],
                type: "SHREDDING",
                icon: { type: "PROJECT", refId: projectId },
                title: `${actor.firstname} ${actor.lastname} permanently deleted ${tasks.length} tasks`,
                action: { type: "MESSAGE" }
            });
        }

        await Archived.deleteMany({ _id: { $in: taskIds } });
        res.status(200).json({ msg: "Tasks deleted permanently" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;