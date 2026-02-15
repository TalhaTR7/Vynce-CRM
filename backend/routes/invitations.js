import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/auth.js";
import Project from "../models/Project.js";
import Invitation from "../models/Invitation.js";
import Membership from "../models/Membership.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// get the invitation data
router.get("/:inviteId", authMiddleware, async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.inviteId);
        if (!invitation) return res.status(404).json({ msg: "Invitation couldn't found" });
        res.status(201).json(invitation);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// invite a user
router.post("/invite", authMiddleware, async (req, res) => {
    const { email, projectId } = req.body;
    const inviterId = req.user.id;

    if (!email) return res.status(400).json({ msg: "Email is required" });
    if (!projectId) return res.status(400).json({ msg: "projectId is required" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findById(projectId).session(session);
        if (!project) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Project not found" });
        }

        const inviter = await User
            .findById(inviterId)
            .select("firstname lastname profileImage")
            .session(session);

        const inviterMembership = await Membership.findOne({
            projectId,
            userId: inviterId,
            role: { $in: ["OWNER", "ADMIN"] }
        }).session(session);

        if (!inviterMembership) {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Unauthorized" });
        }

        const invitee = await User.findOne({ email }).session(session);
        if (!invitee) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "User couldn't found" });
        }

        if (invitee._id.equals(inviterId)) {
            await session.abortTransaction();
            return res.status(400).json({ msg: "Cannot invite yourself" });
        }

        const existingMember = await Membership.exists({
            projectId,
            userId: invitee._id
        }).session(session);

        if (existingMember) {
            await session.abortTransaction();
            return res.status(400).json({ msg: "User is already exists in the project" });
        }

        const existingInvite = await Invitation.exists({
            projectId,
            inviteeId: invitee._id,
            status: "PENDING"
        }).session(session);

        if (existingInvite) {
            await session.abortTransaction();
            return res.status(400).json({ msg: "Invitation already sent" });
        }

        const invitation = new Invitation({
            projectId,
            inviterId,
            inviteeId: invitee._id,
            status: "PENDING"
        });
        await invitation.save({ session });

        await Notification.create([{
            users: [{ _id: invitee._id }],
            type: "PROJECT_INVITATION",
            icon: {
                type: "PROJECT",
                refId: project._id
            },
            title: `${inviter.firstname} ${inviter.lastname} invited you to their project: ${project.name}`,
            action: { type: "DIALOGUE" },
            payload: {
                invitationId: invitation._id,
                inviter: {
                    fullname: `${inviter.firstname} ${inviter.lastname}`,
                    profileImage: formatImage(inviter.profileImage)
                },
                project: {
                    _id: project._id,
                    name: project.name,
                    projectImage: formatImage(project.projectImage)
                },
                status: invitation.status
            }
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ invitation });
    } catch (err) {
        await session.abortTransaction();
        return (err.code === 11000)
            ? res.status(400).json({ msg: "Invitation already exists" })
            : res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// accept the invitation
router.patch("/accept", authMiddleware, async (req, res) => {
    const { invitationId } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invitation = await Invitation.findOne({
            _id: invitationId,
            inviteeId: userId,
            status: "PENDING"
        }).session(session)
            .populate("inviteeId", "firstname lastname profileImage")
            .populate("projectId", "name projectImage");
        if (!invitation) return res.status(400).json({ msg: "Invitation not valid or not found" });

        const userExists = await Membership.exists({
            projectId: invitation.projectId._id,
            userId
        }).session(session);
        if (userExists) return res.status(400).json({ msg: "User already exists in the project" });

        await Membership.create([{
            projectId: invitation.projectId,
            userId: userId,
            role: "MEMBER"
        }], { session });

        invitation.status = "ACCEPTED";

        const invitee = invitation.inviteeId;
        const project = invitation.projectId;
        const admins = await Membership.find({
            projectId: invitation.projectId._id,
            role: "ADMIN"
        }).session(session);
        const adminIds = admins.map(admin => admin.userId);

        await Notification.create([{
            users: [{ _id: invitation.inviterId }],
            type: "ACCEPTED_INVITATION",
            icon: { type: "USER", refId: invitee._id },
            title: `${invitee.firstname} ${invitee.lastname} accepted your invitation to join ${project.name}`,
            action: { type: "MESSAGE" }
        }, {
            users: adminIds.map(id => ({ _id: id })),
            type: "WELCOME",
            icon: { type: "USER", refId: invitee._id },
            title: `${project.name}: New member onboard! Say hi to ${invitee.firstname} ${invitee.lastname}`,
            action: { type: "MESSAGE" }
        }, {
            users: [{ _id: invitee._id }],
            type: "NEW_TO_PROJECT",
            icon: {
                type: "PROJECT",
                refId: project._id
            },
            title: `Welcome to ${project.name}`,
            action: {
                type: "NAVIGATE",
                url: `/project/${project._id}`
            }
        }], { session, ordered: true });

        await invitation.save({ session });
        await session.commitTransaction();
        res.status(200).json({ msg: "Invitation accepted", status: invitation.status });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


// decline the invitation
router.patch("/decline", authMiddleware, async (req, res) => {
    const { invitationId } = req.body;
    const userId = req.user.id;

    try {
        const invitation = await Invitation.findOne({
            _id: invitationId,
            inviteeId: userId,
            status: "PENDING"
        }).populate("inviteeId", "firstname lastname")
            .populate("projectId", "name");
        if (!invitation) return res.status(400).json({ msg: "Invitation not valid or not found" });

        invitation.status = "DECLINED";
        await invitation.save();

        const invitee = invitation.inviteeId;
        const project = invitation.projectId;
        await Notification.create({
            users: [{ _id: invitation.inviterId }],
            type: "DECLINED_INVITATION",
            icon: { type: "USER", refId: invitee._id },
            title: `${invitee.firstname} ${invitee.lastname} has decline your invitation to join ${project.name}`,
            action: { type: "MESSAGE" }
        });



        res.status(200).json({ msg: "Invitation declined", status: invitation.status });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;