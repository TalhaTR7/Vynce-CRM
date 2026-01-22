import express from "express";
import authMiddleware from "../middleware/auth.js";
import Project from "../models/Project.js";
import Member from "../models/Membership.js";
import Board from "../models/Board.js";
import createUploader from "../middleware/multer.js";

const router = express.Router();

const imageUpload = createUploader({
    folder: "projects",
    allowedTypes: ["image/png"],
});

function formatImage(image) {
    const url = image?.url;
    if (url.startsWith("/assets") || url.startsWith("http")) return { url: url };
    else return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// create a project
router.post("/", authMiddleware, imageUpload.single("image"), async (req, res) => {
    const { name } = req.body;

    try {
        const project = await Project.create({
            name,
            projectImage: {
                url: req.file
                    ? `/uploads/projects/${req.file.filename}`
                    : "/assets/project.png"
            }
        });

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
        const projects = memberships.map(member => {
            const project = member.projectId.toObject();
            project.projectImage = formatImage(project.projectImage);
            project.role = member.role;
            return project;
        });
        res.status(200).json(projects, memberships);
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

        const boards = await Board.find({ projectId: id });

        let memberships = await Member.find({ projectId: id })
            .populate("userId", "firstname lastname email currentMood profileImage");


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
router.patch("/project/:id/edit", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, projectImage } = req.body;

    try {
        const update = {};

        if (name) update.name = name;

        if (projectImage?.url) update["projectImage.url"] = projectImage.url;

        const project = await Project.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true }
        );

        if (!project) return res.status(404).json({ msg: "Project not found" });

        project.projectImage = formatImage(project.projectImage);

        res.status(200).json(project);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});



export default router;
