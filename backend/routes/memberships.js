import express from "express";
import authMiddleware from "../middleware/auth.js";
import Project from "../models/Project.js";
import Membership from "../models/Membership.js";

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


// make a membership
router.post("/create", authMiddleware, async (req, res) => {
    const { projectId, role } = req.body;
    const userId = req.user.id;

    if (!projectId || !role)
        return res.status(400).json({ msg: "All fields are required" });

    if (role != "OWNER" && role != "ADMIN" && role != "MEMBER")
        return res.status(400).json({ msg: "Invalid role" });

    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ msg: "Project not found" });

        const userExists = await Membership.findOne({ projectId, userId });
        if (userExists) return res.status(400).json({ msg: "User is already a member of this project" });

        const newMember = new Membership({
            projectId,
            userId,
            role
        });
        await newMember.save();

        res.status(201).json(newMember);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;
