import express from "express";
import authMiddleware from "../middleware/auth.js";
import Membership from "../models/Membership.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Archived from "../models/Archived.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import OwnershipLedger from "../models/OwnershipLedger.js";
import RoleLedger from "../models/RoleLedger.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


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


// terminate membership
router.delete("/remove", authMiddleware, async (req, res) => {
    const { projectId, memberIds } = req.body;
    const ownerId = req.user.id;

    if (!projectId) return res.status(400).json({ msg: "projectId is required" });
    if (!Array.isArray(memberIds)) return res.status(400).json({ msg: "Invalid argument: memberIds" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findById(projectId).session(session);
        if (!project) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Project couldn't found" });
        }

        const membership = await Membership
            .findOne({
                projectId,
                userId: ownerId,
                role: "OWNER"
            })
            .populate("userId", "firstname lastname")
            .session(session);
        if (!membership) {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Unauthorized to remove members" });
        }
        const owner = membership.userId;

        const members = await Membership
            .find({ _id: { $in: memberIds }, projectId })
            .populate("userId", "firstname lastname")
            .session(session)
            .lean();

        for (const member of members) {
            member.user = member.userId;
            delete member.userId;

            if (member.role === "OWNER") {
                await session.abortTransaction();
                return res.status(403).json({ msg: "OWNER cannot be removed" });
            }

            const assignedTasks = await Task
                .find({ projectId, assigneeId: member.user._id })
                .session(session);
            for (const task of assignedTasks) {
                const archived = task.toObject();
                delete archived._id;
                archived.closed = true;
                archived.dueDate = null;
                archived.boardId = null;
                archived.assigneeId = null;
                archived.isTimerRunning = false;
                archived.activity.push({
                    userId: owner._id,
                    type: "ACTION",
                    action: "TASK_DELETED",
                    content: `Task was archived because ${member.user.firstname} ${member.user.lastname} was removed from the project`
                })
                await Archived.create([archived], { session });
                await Task.deleteOne({ _id: task._id }).session(session);
            }

            const createdTasks = await Task
                .find({ projectId, creatorId: member.user._id })
                .session(session);
            for (const task of createdTasks) {
                task.creatorId = ownerId;
                task.activity.push({
                    userId: owner._id,
                    type: "ACTION",
                    action: "TRANSFERED_OWNERSHIP",
                    content: `Task ownership transferred to ${owner.firstname} ${owner.lastname}`
                });
                await task.save({ session });
            }

            await Notification.create([{
                users: [{ _id: member.user._id }],
                type: "REMOVED_FROM_PROJECT",
                icon: { type: "USER", refId: req.user.id },
                title: `${owner.firstname} ${owner.lastname} removed you from ${project.name}`,
                action: { type: "MESSAGE" }
            }], { session });

            await Membership.deleteOne({
                projectId,
                userId: member.user._id
            }).session(session);
        }

        await session.commitTransaction();
        res.status(200).json({ msg: "Member(s) were successffully removed and notified" });
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
            .populate("userId", "profileImage firstname lastname email mood");

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


// get ownership offer by id
router.get("/transfer-ownership/:offerId", authMiddleware, async (req, res) => {
    try {
        const offer = await OwnershipLedger.findById(req.params.offerId);
        if (!offer) return res.status(404).json({ msg: "Offer couldn't found" });
        res.status(201).json(offer);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// post an offer to transfer ownership 
router.post("/transfer-ownership/offer", authMiddleware, async (req, res) => {
    const { projectId, adminId } = req.body;
    const ownerId = req.user.id;

    if (!projectId || !adminId)
        return res.status(400).json({ msg: "projectId and adminId are required" });

    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ msg: "Project not found" });

        const ownerMembership = await Membership.findOne({
            projectId,
            userId: ownerId
        }).populate("userId", "firstname lastname profileImage");
        if (!ownerMembership) return res.status(403).json({ msg: "Unauthorized" });
        if (ownerMembership.role !== "OWNER") return res.status(403).json({ msg: "Not an OWNER" });
        const owner = ownerMembership.userId;

        const adminMembership = await Membership.findOne({
            projectId,
            userId: adminId,
        }).populate("userId", "firstname lastname profileImage");
        if (!adminMembership) return res.status(404).json({ msg: "Admin couldn't found" });
        if (adminMembership.role !== "ADMIN") return res.status(403).json({ msg: "Selected user is not an ADMIN" });
        const admin = adminMembership.userId;

        const existingTransfer = await OwnershipLedger.findOne({
            projectId,
            status: "PENDING"
        });
        if (existingTransfer) return res.status(409).json({ msg: "There is already a pending request" });

        const offer = await OwnershipLedger.create({
            projectId,
            ownerId,
            adminId,
            status: "PENDING"
        });

        await Notification.create({
            users: [{ _id: adminId }],
            type: "OWNERSHIP_REQUEST",
            icon: { type: "PROJECT", refId: projectId },
            title: `${owner.firstname} ${owner.lastname} offered you the ownership of "${project.name}"`,
            action: { type: "DIALOGUE" },
            payload: {
                offerId: offer._id,
                project: {
                    _id: projectId,
                    name: project.name,
                    projectImage: formatImage(project.projectImage),
                },
                owner: {
                    fullname: `${owner.firstname} ${owner.lastname}`,
                    profileImage: formatImage(owner.profileImage)
                },
                admin: {
                    fullname: `${admin.firstname} ${admin.lastname}`,
                    profileImage: formatImage(admin.profileImage)
                },
                status: offer.status
            }
        });

        res.status(200).json({ msg: "Ownership offer sent" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// accept ownership
router.patch("/transfer-ownership/accept", authMiddleware, async (req, res) => {
    const { offerId } = req.body;
    if (!offerId) return res.status(400).json({ msg: "offerId is required" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const offer = await OwnershipLedger.findById(offerId)
            .populate("projectId", "name")
            .populate("adminId", "firstname lastname")
            .populate("ownerId", "firstname lastname")
            .session(session);
        if (!offer) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Invalid offer" });
        }
        if (offer.status !== "PENDING") {
            await session.abortTransaction();
            return res.status(409).json({ msg: `Offer already ${offer.status.toLowerCase()}` });
        }

        const project = offer.projectId;
        const admin = offer.adminId;
        const owner = offer.ownerId;

        if (!admin._id.equals(req.user.id)) {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Not authorized" });
        }

        const ownerMembership = await Membership.findOne({
            projectId: project._id,
            userId: owner._id
        }).session(session);
        const adminMembership = await Membership.findOne({
            projectId: project._id,
            userId: admin._id
        }).session(session);

        if (!ownerMembership || !adminMembership) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Memberships not found" });
        }
        if (ownerMembership.role !== "OWNER" || adminMembership.role !== "ADMIN") {
            await session.abortTransaction();
            return res.status(409).json({ msg: "Invalid membership roles for transfer" });
        }

        ownerMembership.role = "ADMIN";
        adminMembership.role = "OWNER";
        await Promise.all([
            ownerMembership.save({ session }),
            adminMembership.save({ session })
        ]);

        offer.status = "ACCEPTED";
        await offer.save({ session });

        await Notification.create([{
            users: [{ _id: owner._id }],
            type: "OWNERSHIP_RESPONSE",
            icon: { type: "PROJECT", refId: project._id },
            title: `${admin.firstname} ${admin.lastname} has accepted your offer for the ownership of "${project.name}"`,
            action: { type: "MESSAGE" }
        }], { session });

        await Notification.create([{
            users: [{ _id: admin._id }],
            type: "OWNERSHIP_ALERT",
            icon: { type: "PROJECT", refId: project._id },
            title: `Look at you! You're now the owner of ${project.name}`,
            action: { type: "MESSAGE" }
        }], { session });

        const members = await Membership.find({
            projectId: project._id,
            userId: { $nin: [offer.adminId, offer.ownerId] }
        }).session(session);

        await Promise.all(members.map(member =>
            Notification.create([{
                users: [{ _id: member.userId }],
                type: "OWNERSHIP_ALERT",
                icon: { type: "PROJECT", refId: project._id },
                title: `${admin.firstname} ${admin.lastname} is now the owner of ${project.name}`,
                action: { type: "MESSAGE" }
            }], { session })
        ));

        await session.commitTransaction();
        res.status(200).json({ msg: "Ownership offer accepted" });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// decline ownership
router.patch("/transfer-ownership/decline", authMiddleware, async (req, res) => {
    const { offerId } = req.body;
    if (!offerId) return res.status(400).json({ msg: "offerId is required" });

    try {
        const offer = await OwnershipLedger.findById(offerId)
            .populate("projectId", "name")
            .populate("adminId", "firstname lastname");
        if (!offer) return res.status(404).json({ msg: "Invalid offer" });
        if (offer.status !== "PENDING") return res.status(409).json({ msg: `Offer already ${offer.status.toLowerCase()}` });

        const project = offer.projectId;
        const admin = offer.adminId;

        if (!admin._id.equals(req.user.id)) return res.status(403).json({ msg: "Not authorized" });

        offer.status = "DECLINED";
        await offer.save();

        await Notification.create({
            users: [{ _id: offer.ownerId }],
            type: "OWNERSHIP_RESPONSE",
            icon: { type: "USER", refId: admin._id },
            title: `${admin.firstname} ${admin.lastname} has declined your offer for the ownership of "${project.name}"`,
            action: { type: "MESSAGE" }
        });

        res.status(200).json({ msg: "Ownership offer declined" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// promote a member
router.patch("/change-role/promote", authMiddleware, async (req, res) => {
    const { membershipId } = req.body;
    if (!membershipId) return res.status(400).json({ msg: "membershipId is required" });

    try {
        const membership = await Membership
            .findById(membershipId)
            .populate("projectId");
        if (!membership) return res.status(404).json({ msg: "Not a member" });
        if (membership.role === "ADMIN") return res.status(400).json({ msg: "User is already an admin" });

        const ownership = await Membership.findOne({
            projectId: membership.projectId,
            userId: req.user.id
        }).populate("userId", "firstname lastname profileImage");
        if (!ownership) return res.status(403).json({ msg: "Unauthorized: outsider" });
        if (ownership.role !== "OWNER") return res.status(403).json({ msg: "Unauthorized: not the OWNER" });

        const project = membership.projectId;
        const owner = ownership.userId;

        const oldRole = membership.role;
        membership.role = "ADMIN";
        await membership.save();
        const newRole = membership.role;

        await RoleLedger.create({
            membershipId,
            actor: req.user.id,
            action: "PROMOTION",
            oldRole,
            newRole
        });

        await Notification.create({
            users: [{ _id: membership.userId }],
            type: "PROMOTION",
            icon: { type: "PROJECT", refId: project._id },
            title: `Hey you! You're now an Admin of "${project.name}", ${owner.firstname} ${owner.lastname} made you one`,
            action: { type: "MESSAGE" }
        })

        res.status(200).json({ msg: "Member promoted to admin", membership });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// demote an admin
router.patch("/change-role/demote", authMiddleware, async (req, res) => {
    const { membershipId } = req.body;
    if (!membershipId) return res.status(400).json({ msg: "membershipId is required" });

    try {
        const membership = await Membership.findById(membershipId);
        if (!membership) return res.status(404).json({ msg: "Not a member" });
        if (membership.role === "MEMBER") return res.status(400).json({ msg: "User is already a member" });

        const ownership = await Membership.findOne({
            projectId: membership.projectId,
            userId: req.user.id
        }).populate("userId", "firstname lastname profileImage");
        if (!ownership) return res.status(403).json({ msg: "Unauthorized: outsider" });
        if (ownership.role !== "OWNER") return res.status(403).json({ msg: "Unauthorized: not the OWNER" });
        const owner = ownership.userId;

        const oldRole = membership.role;
        membership.role = "MEMBER";
        await membership.save();
        const newRole = membership.role;

        await RoleLedger.create({
            membershipId,
            actor: req.user.id,
            action: "DEMOTION",
            oldRole,
            newRole
        });

        await Task.updateMany({
            creatorId: membership.userId,
            projectId: membership.projectId
        }, {
            $set: { creatorId: owner._id }
        });

        await Notification.create({
            users: [{ _id: membership.userId }],
            type: "DEMOTION",
            icon: { type: "PROJECT", refId: membership.projectId },
            title: `Plot twist! Enjoy a simpler life as a Member again, ${owner.firstname} ${owner.lastname} made you one`,
            action: { type: "MESSAGE" }
        })

        res.status(200).json({ msg: "Admin demoted to member" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;
