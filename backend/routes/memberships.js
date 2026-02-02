import express from "express";
import authMiddleware from "../middleware/auth.js";
import Membership from "../models/Membership.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Archived from "../models/Archived.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const router = express.Router();


// get all membership data
router.get("/", authMiddleware, async (req, res) => {
    try {
        const memberships = await Membership.find();
        res.status(200).json(memberships);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// leave the project
router.delete("/leave", authMiddleware, async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user.id;

    if (!projectId) return res.status(404).json({ msg: "projectId is required" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findById(projectId).session(session);
        if (!project) return res.status(404).json({ msg: "Project couldn't found" });

        const membership = await Membership.findOne({ projectId: projectId, userId: userId }).session(session);
        if (!membership) return res.status(403).json({ msg: "Not a member" });

        const user = await User.findById(userId).session(session);
        const notificationsMap = new Map();

        if (membership.role === "OWNER")
            return res.status(403).json({ msg: "Can't leave the project being the OWNER" });

        else if (membership.role === "ADMIN") {
            const createdTasks = await Task.find({ projectId, creatorId: userId }).session(session);
            const ownerMembership = await Membership.findOne({ projectId, role: "OWNER" }).populate("userId", "firstname lastname").session(session);
            const owner = ownerMembership.userId;

            createdTasks.forEach(task => {
                task.creatorId = owner._id;
                task.activity.push({
                    userId,
                    type: "ACTION",
                    action: "TRANSFERED_OWNERSHIP",
                    content: `Task ownership transfered to ${owner.firstname} ${owner.lastname}`
                });
            });

            await Promise.all(createdTasks.map(task => task.save({ session })));
            createdTasks.forEach(task => {
                if (!task.assigneeId.equals(owner._id) && !task.assigneeId.equals(userId)) {
                    notificationsMap.set(task.assigneeId.toString(), {
                        title: `${user.firstname} ${user.lastname} left. Your tasks are now managed by ${owner.firstname} ${owner.lastname}`,
                        type: "LEFT_PROJECT"
                    });
                }
            });

            const assignedTasks = await Task.find({ projectId, assigneeId: userId, creatorId: { $ne: userId } }).session(session);
            for (const task of assignedTasks) {
                const archived = task.toObject();
                delete archived._id;
                archived.closed = true;
                archived.dueDate = null;
                archived.boardId = null;
                archived.assigneeId = null;
                archived.ethereum.assigned = 0;
                archived.isTimerRunning = false;
                archived.activity.push({
                    userId,
                    type: "ACTION",
                    action: "TASK_DELETED",
                    content: `Task was archived because ${user.firstname} ${user.lastname} left the project`
                })
                await Archived.create([archived], { session });
                await Task.deleteOne({ _id: task._id }).session(session);
            }

            const adminMembers = await Membership.find({ projectId, role: "ADMIN" }).populate("userId", "firstname lastname").session(session);
            [...adminMembers, ownerMembership].forEach(member => {
                const id = member.userId._id.toString();
                if (id !== userId && !notificationsMap.has(id)) {
                    notificationsMap.set(id, {
                        title: `${user.firstname} ${user.lastname} has left the project`,
                        type: "LEFT_PROJECT"
                    });
                }
            });
        }

        else if (membership.role === "MEMBER") {
            const assignedTasks = await Task.find({ projectId, assigneeId: userId }).session(session);
            for (const task of assignedTasks) {
                const archived = task.toObject();
                delete archived._id;
                archived.closed = true;
                archived.dueDate = null;
                archived.boardId = null;
                archived.assigneeId = null;
                archived.ethereum.assigned = 0;
                archived.isTimerRunning = false;
                archived.activity.push({
                    userId,
                    type: "ACTION",
                    action: "TASK_DELETED",
                    content: `Task was archived because ${user.firstname} ${user.lastname} left the project`
                })
                await Archived.create([archived], { session });
                await Task.deleteOne({ _id: task._id }).session(session);
            }

            const higherUps = await Membership.find({ projectId, role: { $in: ["OWNER", "ADMIN"] } }).populate("userId", "firstname lastname").session(session);
            higherUps.forEach(member => {
                notificationsMap.set(member.userId._id.toString(), {
                    title: `${user.firstname} ${user.lastname} has left the project. His tasks have been archived`,
                    type: "LEFT_PROJECT"
                });
            });
        }

        const notifications = Array.from(notificationsMap.entries()).map(([id, info]) => ({
            users: [{ _id: id }],
            icon: { type: "PROJECT", refId: projectId },
            ...info,
            action: { type: "NAVIGATE", url: `/project/${projectId}` }
        }));
        if (notifications.length > 0) await Notification.insertMany(notifications, { session });

        await Membership.deleteOne({ projectId, userId }).session(session);

        await session.commitTransaction();
        res.status(200).json({ msg: "You have successfully left the project" });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// get only user projects with role
router.get("/user", authMiddleware, async (req, res) => {
    try {
        const memberships = await Membership.find({ userId: req.user.id })
            .populate("projectId", "name projectImage");

        const projects = memberships.map(membership => {
            const project = membership.projectId.toObject();
            project.projectImage.url = project.projectImage.url.startsWith("/assets")
                ? project.projectImage.url
                : `http://localhost:${process.env.PORT}/api${project.projectImage.url}`
            project.role = membership.role;
            return project;
        });

        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get members of the project with roles
router.get("/project/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const memberships = await Membership.find({ projectId: id })
            .populate("userId", "profileImage firstname lastname email currentMood");

        const users = memberships.map(membership => {
            const user = membership.userId.toObject();
            user.profileImage.url = user.profileImage.url.startsWith("/assets")
                ? user.profileImage.url
                : `http://localhost:${process.env.PORT}/api${user.profileImage.url}`
            user.role = membership.role;
            user.joined = membership.createdAt;
            return user;
        });

        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});



export default router;
