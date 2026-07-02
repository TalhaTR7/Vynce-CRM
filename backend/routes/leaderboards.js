import express from "express";
import authMiddleware from "../middleware/auth.js";
import Membership from "../models/Membership.js";

const router = express.Router();

// helper function
function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
}

// get the project leaderboard
router.get("/project/:projectId", authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    try {
        const isMember = await Membership.exists({ projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Not a project member" });

        let query = Membership.find({ projectId })
            .sort({ weeklyXP: -1 })
            .populate({ path: "userId", select: "firstname lastname profileImage motivationScore" })
            .lean();

        if (limit) query = query.limit(limit);

        const results = await query;

        const response = results.map((m, i) => ({
            rank: i + 1,
            weeklyXP: m.weeklyXP,
            isMe: m.userId._id.toString() === req.user.id,
            user: {
                _id: m.userId._id,
                firstname: m.userId.firstname,
                lastname: m.userId.lastname,
                profileImage: formatImage(m.userId.profileImage),
            },
        }));

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;