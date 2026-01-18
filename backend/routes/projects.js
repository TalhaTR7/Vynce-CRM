import express from "express";
import authMiddleware from "../middleware/auth.js";
import Project from "../models/Project.js";
import Member from "../models/Membership.js";

const router = express.Router();

// create a project
router.post("/", authMiddleware, async (req, res) => {
    const { name } = req.body;

    try {
        const newProject = new Project({ name });
        await newProject.save();

        const ownerMembership = new Member({
            projectId: newProject._id,
            userId: req.user.id,
            role: "OWNER",
        });
        await ownerMembership.save();

        res.status(201).json(newProject);
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
            projectObj.projectImage.url = projectObj.projectImage.url.startsWith("/assets")
                ? projectObj.projectImage.url
                : `http://localhost:${process.env.PORT}/api${projectObj.projectImage.url}`;
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
        let projects = memberships.map(member => member.projectId.toObject());
        projects = projects.map(project => {
            project.projectImage.url = project.projectImage.url.startsWith("/assets")
                ? project.projectImage.url
                : `http://localhost:${process.env.PORT}/api${project.projectImage.url}`;
            return project;
        })
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get project by id
router.get("/project/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        let project = await Project.findById(id);
        if (!project) return res.status(404).json({ msg: "Project not found" });
        project.projectImage.url = project.projectImage.url.startsWith("/assets")
            ? project.projectImage.url
            : `http://localhost:${process.env.PORT}/api${project.projectImage.url}`;

        const members = await Member.find({ projectId: id })
            .populate("userId", "firstname lastname email");

        res.status(200).json({
            ...project.toObject(),
            members,
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;
