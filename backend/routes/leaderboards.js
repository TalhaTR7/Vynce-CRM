import express from "express";
import cron from "node-cron";
import authMiddleware from "../middleware/auth.js";
import Membership from "../models/Membership.js";

const router = express.Router();

// Reset every Sunday at 23:59
cron.schedule("59 23 * * 0", async () => {
    await Membership.updateMany({}, { weeklyXP: 0 });
});

// helper function
function formatImage(image) {
  const url = image?.url;
  return { url: `http://localhost:${process.env.PORT}/api${url}` };
}

// GET /api/leaderboards/project/:projectId
router.get("/project/:projectId", authMiddleware, async (req, res) => {
    const { projectId } = req.params;

    try {
        const isMember = await Membership.exists({ projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Not a project member" });

        const top5 = await Membership.find({ projectId })
            .sort({ weeklyXP: -1 })
            .limit(7)
            .populate({ path: "userId", select: "firstname lastname profileImage motivationScore" })
            .lean();

        const response = top5.map((m, i) => ({
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