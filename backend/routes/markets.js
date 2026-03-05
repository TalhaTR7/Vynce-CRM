import express, { response } from "express";
import authMiddleware from "../middleware/auth.js";
import Task from "../models/Task.js";
import Auction from "../models/Auction.js";
import Membership from "../models/Membership.js";
import Project from "../models/Project.js";

const router = express.Router();

function formatImage(image) {
    const url = image?.url;
    return { url: `http://localhost:${process.env.PORT}/api${url}` };
}


// open bidding for a task
router.post("/task/:taskId/", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const endsAt = new Date(req.body.endsAt);

    if (!taskId) return res.status(404).json({ msg: "taskId is required" });

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task could not found" });

        if (!task.assigneeId.equals(req.user.id))
            return res.status(403).json({ msg: "Unathorized: Only assignee can open bidding" });

        if (isNaN(endsAt)) return res.status(400).json({ msg: "Invalid ending date" });
        const now = new Date();
        if (endsAt <= now) return res.status(400).json({ msg: "Invalid auction end time" });

        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
        if (task.dueDate.getTime() - endsAt.getTime() < THREE_DAYS)
            return res.status(403).json({ msg: "Auction must end at least 3 days before due date" });

        const exists = await Auction.findOne({ taskId, status: "OPEN" });
        if (exists) return res.status(400).json({ msg: "Auction already open for this task" });


        task.onAuction = true;
        await task.save();

        await Auction.create({
            taskId,
            baseReward: task.ethereum.assigned,
            endsAt,
            status: "OPEN",
            winnerId: null,
            bids: []
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
        if (auction.status === "EXPIRED") return res.status(400).json({ msg: "Too late: Bidding time has expired" });

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

        if (auction.winnerId) auction.winnerId.profileImage = formatImage(auction.winnerId.profileImage);

        const { taskId: taskData, winnerId: winnerData, bids: _bids, ...rest } = auction;
        const response = { ...rest, task: taskData, winner: winnerData, bids: formattedBids };

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// get market tasks of a project
router.get("/project/:projectId/", authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    if (!projectId) return res.status(404).json({ msg: "projectId is required" });

    try {
        const exists = await Project.exists({ _id: projectId });
        if (!exists) return res.status(404).json({ msg: "Project could not be found" });

        const isMember = await Membership.exists({ projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Unauthorized: Not a member" });

        const tasks = await Task.find({ projectId, onAuction: true })
            .populate({ path: "projectId", select: "name projectImage" })
            .populate({ path: "creatorId", select: "firstname lastname profileImage" })
            .populate({ path: "assigneeId", select: "firstname lastname profileImage" })
            .lean();

        const response = tasks.map(task => ({
            ...task,
            creatorId: {
                ...task.creatorId,
                profileImage: formatImage(task.creatorId?.profileImage)
            },
            assigneeId: {
                ...task.assigneeId,
                profileImage: formatImage(task.assigneeId?.profileImage)
            }
        }));

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

        if (task.assigneeId.equals(req.user.id))
            return res.status(403).json({ msg: "Cannot bid on your own auction" });

        const isMember = await Membership.exists({ projectId: task.projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Not a project member" });

        const auction = await Auction.findOne({ taskId });
        if (!auction) return res.status(404).json({ msg: "Auction could not found" });
        if (auction.status !== "OPEN") return res.status(400).json({ msg: "Auction is not active" });

        auction.bids.push({ userId: req.user.id, amount });

        /*
        We don't have to update the winner following "earliest bidder wins" strategy
        It works as when this api is called and a bid of same amount is there already,
        means someone submitted it earlier than you, so he simply remains the winner

        the only way you could become winner is that you submit a bid with a new low
        so you could be the earliest bidder with this amount, and hope that someone
        doesn't submit with a new low
        */

        const lowestBid = auction.bids.reduce((min, bid) => bid.amount < min.amount ? bid : min);
        auction.winnerId = lowestBid.userId;

        await auction.save();
        res.status(200).json("Bid submitted successfully");
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;