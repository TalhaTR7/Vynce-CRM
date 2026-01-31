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
                userIds: recipients([task.assigneeId]),
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
                userIds: recipients([task.assigneeId]),
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
        task.ethereum.assigned = 0;
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
            userIds,
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