import express from "express";
import authMiddleware from "../middleware/auth.js";
import Project from "../models/Project.js";
import Member from "../models/Membership.js";
import Board from "../models/Board.js";
import createUploader from "../middleware/multer.js";
import Membership from "../models/Membership.js";
import Notification from "../models/Notification.js";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Task from "../models/Task.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageUpload = createUploader({
    folder: "projects",
    allowedTypes: ["image/png"],
});

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// create a project
router.post("/", authMiddleware, imageUpload.single("image"), async (req, res) => {
    const { name } = req.body;

    try {
        const uploadsDir = path.resolve(__dirname, "..", "uploads", "projects");
        const defaultImagePath = path.resolve(__dirname, "..", "..", "frontend", "public", "assets", "project.png");

        const project = await Project.create({ name });

        if (req.file) {
            const processed = await sharp(req.file.path)
                .resize(500, 500, { fit: "cover" })
                .png()
                .toBuffer();

            const projectId = project._id.toString();
            const filename = `${projectId}.png`;
            const destImagePath = path.join(uploadsDir, filename);

            await fs.writeFile(destImagePath, processed);
            await fs.unlink(req.file.path).catch(() => { });
            project.projectImage = { url: `/uploads/projects/${filename}` };
        } else {
            await fs.mkdir(uploadsDir, { recursive: true });
            const projectId = project._id.toString();
            const destImagePath = path.join(uploadsDir, `${projectId}.png`);
            await fs.copyFile(defaultImagePath, destImagePath);
            project.projectImage = { url: `/uploads/projects/${projectId}.png` };
        }

        await project.save();

        await Member.create({
            projectId: project._id,
            userId: req.user.id,
            role: "OWNER",
        });

        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get all projects
router.get("/", authMiddleware, async (req, res) => {
    try {
        let projects = await Project.find();
        projects = projects.map(project => {
            const projectObj = project.toObject();
            projectObj.projectImage = formatImage(projectObj.projectImage);
            return projectObj;
        });
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get user projects only
router.get("/user", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const memberships = await Member.find({ userId }).populate("projectId");

        const projects = memberships
            .filter(member => member.projectId)
            .map(member => {
                const project = member.projectId.toObject();
                project.projectImage = formatImage(project.projectImage);
                project.role = member.role;
                return project;
            });

        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get project by id
router.get("/project/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ msg: "Project not found" });
        project.projectImage = formatImage(project.projectImage);

        const boards = await Board.find({ projectId: id }).sort({ position: 1 });

        let memberships = await Member.find({ projectId: id })
            .populate("userId", "firstname lastname email mood profileImage");


        memberships = memberships.map(membership => {
            membership.userId.profileImage = formatImage(membership.userId.profileImage);
            return {
                _id: membership._id,
                user: membership.userId,
                role: membership.role,
                createdAt: membership.createdAt,
            }
        });

        const membership = await Member.findOne({
            projectId: id,
            userId: req.user.id
        });

        if (!membership) res.status(403).json({ msg: "Not a member" });

        res.status(200).json({
            ...project.toObject(),
            userRole: membership.role,
            boards,
            memberships
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// edit project meta
router.patch("/project/:id/", authMiddleware, imageUpload.single("image"), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const update = {};
        if (name) update.name = name;

        if (req.file) update["projectImage.url"] = `/uploads/projects/${req.file.filename}`;

        const editor = await Membership.findOne({
            projectId: id,
            userId: req.user.id,
            role: { $in: ["ADMIN", "OWNER"] }
        }).populate("userId", "firstname lastname");

        if (!editor) return res.status(403).json({ msg: "Not an ADMIN or OWNER" });

        const project = await Project.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true }
        );

        if (!project) return res.status(404).json({ msg: "Project not found" });

        project.projectImage = formatImage(project.projectImage);

        const members = await Membership.find({
            projectId: id,
            role: { $in: ["ADMIN", "MEMBER"] }
        }).select("userId").lean();
        const userIds = members.map(member => member.userId);

        if (userIds.length > 0) {
            await Promise.all(userIds.map(userId =>
                Notification.create({
                    users: [{ _id: userId }],
                    type: "EDIT_PROJECT",
                    icon: {
                        type: "PROJECT",
                        refId: id
                    },
                    title: `${editor.firstname} ${editor.lastname} made edits to the project. Click to view changes!`,
                    action: {
                        type: "NAVIGATE",
                        url: `/project/${id}`
                    }
                })
            ))
        }

        res.status(200).json(project);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// delete a project
router.delete("/project/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findById(id).session(session);
        if (!project) {
            await session.abortTransaction();
            return res.status(404).json({ msg: "Project could not found" });
        }

        const membership = await Membership.findOne({
            projectId: project._id,
            userId: req.user.id
        }).session(session);
        if (!membership) {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Not a member of the project" });
        }
        if (membership.role !== "OWNER") {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Not the OWNER" });
        }

        const memberCount = await Membership.countDocuments({ projectId: project._id }).session(session);
        if (memberCount > 1) {
            await session.abortTransaction();
            return res.status(403).json({ msg: "Remove every member and admin first" });
        }

        await Task.deleteMany({ projectId: project._id }).session(session);
        await Board.deleteMany({ projectId: project._id }).session(session);
        await Membership.deleteOne({ _id: membership._id }).session(session);
        await Project.deleteOne({ _id: id }).session(session);

        await session.commitTransaction();
        res.status(200).json({ msg: "Project deleted successfully" });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession()
    }
});


export default router;
