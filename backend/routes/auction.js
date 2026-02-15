import express, { response } from "express";
import authMiddleware from "../middleware/auth.js";
import Task from "../models/Task.js";
import Auction from "../models/Auction.js";
import Membership from "../models/Membership.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// open bidding for a task
router.post("/task/:taskId/", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { endsAt } = req.body;

    if (!taskId) return res.status(404).json({ msg: "taskId is required" });

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task could not found" });

        if (!task.assigneeId.equals(req.user.id)) return res.status(403).json({ msg: "Unathorized: Only assignee can open bidding" });

        const now = new Date();
        if (endsAt <= now) return res.status(400).json({ msg: "Invalid auction end time" });

        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
        if (task.dueDate.getTime() - endsAt.getTime() < THREE_DAYS)
            return res.status(403).json({ msg: "Auction must end at least 3 days before due date" });

        const exists = await Auction.findOne({ taskId, status: "OPEN" });
        if (exists) return res.status(400).json({ msg: "Auction already open for this task" });


        await Auction.create({
            taskId,
            baseReward: task.ethereum.assigned,
            endsAt,
            status: "OPEN",
            winnerId: req.user.id,
            bids: [{
                userId: req.user.id,
                amount: task.ethereum.assigned
            }]
        });

        res.status(201).json({ msg: "Task place on marketplace" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get auction data
router.get("/task/:taskId/", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    if (!taskId) return res.status(404).json({ msg: "taskId is required" });

    try {
        const task = await Task.findById(taskId).select("projectId");
        if (!task) return res.status(404).json({ msg: "Task could not found" });

        const isMember = await Membership.exists({ projectId: task.projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Unauthorized: Not a member" });

        const auction = await Auction.findOne({ taskId })
            .populate({ path: "taskId", select: "title dueDate ethereum" })
            .populate({ path: "winnerId", select: "firstname lastname profileImage" })
            .populate({ path: "bids.userId", select: "firstname lastname profileImage" })
            .lean();

        if (!auction) return res.status(404).json({ msg: "Auction could not found" });

        if (auction.status === "CLOSED") return res.status(400).json({ msg: "Too late: Task has already been assigned to someone" });
        else if (auction.status === "EXPIRED") return res.status(400).json({ msg: "Too late: Bidding time has expired" });

        const formattedBids = auction.bids.map(bid => ({
            amount: bid.amount,
            createdAt: bid.createdAt,
            user: {
                _id: bid.userId._id,
                firstname: bid.userId.firstname,
                lastname: bid.userId.lastname,
                profileImage: formatImage(bid.userId.profileImage)
            }
        }));

        auction.winnerId.profileImage = formatImage(auction.winnerId.profileImage);

        const response = {
            ...auction,
            task: auction.taskId,
            winner: auction.winnerId,
            bids: formattedBids
        };

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// submit a bid
router.patch("/task/:taskId/", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { amount } = req.body;

    if (!taskId) return res.status(404).json({ msg: "taskId is required" });
    if (!amount || amount <= 0) return res.status(400).json({ msg: "Bid must be greater than 0" });

    try {
        const task = await Task.findById(taskId).select("projectId");
        if (!task) return res.status(404).json({ msg: "Task could not found" });

        const isMember = await Membership.exists({ projectId: task.projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Not a project member" });

        const auction = await Auction.findOne({ taskId });
        if (!auction) return res.status(404).json({ msg: "Auction could not found" });
        if (auction.status !== "OPEN") return res.status(400).json({ msg: "Auction is not active" });

        auction.bids.push({ userId: req.user.id, amount });

        const lowestBid = auction.bids.reduce((min, bid) => bid.amount < min.amount ? bid : min);
        auction.winnerId = lowestBid.userId;

        /*
        We don't have to update the winner following "earliest bidder wins" strategy
        It works as when this api is called and a bid of same amount is there already,
        means someone submitted it earlier than you, so he simply remains the winner

        the only way you could become winner is that you submit a bid with a new low
        so you could be the earliest bidder with this amount, and hope that someone
        doesn't submit with a new low
        */

        await auction.save();
        res.status(200).json("Bid submitted successfully");
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;