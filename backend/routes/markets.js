import express from "express";
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
    if (!req.body.endsAt) return res.status(400).json({ msg: "endsAt is required" });
    if (Number.isNaN(endsAt.getTime())) return res.status(400).json({ msg: "Invalid ending date" });

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (!task.assigneeId.equals(req.user.id))
            return res.status(403).json({ msg: "Unauthorized: Only the assignee can open bidding" });

        if (!task.dueDate) return res.status(400).json({ msg: "Task must have a due date to be auctioned" });

        const now = new Date();
        if (endsAt <= now) return res.status(400).json({ msg: "Auction end time must be in the future" });

        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
        if (task.dueDate.getTime() - endsAt.getTime() < THREE_DAYS)
            return res.status(400).json({ msg: "Auction must end at least 3 days before the due date" });

        if (task.onAuction)
            return res.status(400).json({ msg: "Task is already on the marketplace" });

        task.onAuction = true;
        await task.save();

        await Auction.create({
            taskId,
            baseReward: task.ethereum.assigned,
            endsAt,
            status: "OPEN",
            winnerId: null,
            bids: [],
        });

        res.status(201).json({ msg: "Task placed on marketplace" });
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
        if (!task) return res.status(404).json({ msg: "Task not found" });

        const isMember = await Membership.exists({ projectId: task.projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Not a project member" });

        const auction = await Auction.findOne({ taskId })
            .populate({
                path: "taskId",
                select: "title difficulty description creatorId assigneeId dueDate ethereum",
                populate: [
                    { path: "creatorId", select: "firstname lastname profileImage" },
                    { path: "assigneeId", select: "firstname lastname profileImage" }
                ]
            })
            .populate({ path: "winnerId", select: "firstname lastname profileImage" })
            .populate({ path: "bids.userId", select: "firstname lastname profileImage" })
            .lean();

        if (!auction) return res.status(404).json({ msg: "Auction not found" });
        if (auction.status === "CLOSED") return res.status(400).json({ msg: "Too late: Task has already been assigned" });
        if (auction.status === "EXPIRED") return res.status(400).json({ msg: "Too late: Bidding time has expired" });

        const project = await Project.findById(task.projectId).select("name projectImage");
        project.projectImage = formatImage(project.projectImage);

        const taskData = auction.taskId;
        taskData.creatorId.profileImage = formatImage(taskData.creatorId.profileImage);
        taskData.assigneeId.profileImage = formatImage(taskData.assigneeId.profileImage);
        taskData.creator = taskData.creatorId;
        taskData.assignee = taskData.assigneeId;
        delete taskData.creatorId;
        delete taskData.assigneeId;

        const formattedBids = auction.bids.map(bid => ({
            _id: bid._id,
            amount: bid.amount,
            createdAt: bid.createdAt,
            bidder: {
                _id: bid.userId._id,
                firstname: bid.userId.firstname,
                lastname: bid.userId.lastname,
                profileImage: formatImage(bid.userId.profileImage)
            }
        }));

        if (auction.winnerId) {
            auction.winnerId.profileImage = formatImage(auction.winnerId.profileImage);
        }

        const { taskId: _t, winnerId: winnerData, bids: _b, ...rest } = auction;
        res.status(200).json({
            ...rest,
            project,
            task: taskData,
            winner: winnerData ?? null,
            bids: formattedBids,
        });

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
        if (!exists) return res.status(404).json({ msg: "Project not found" });

        const isMember = await Membership.exists({ projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Unauthorized: Not a member" });

        const tasks = await Task.find({ projectId, onAuction: true })
            .select("title difficulty dueDate ethereum projectId")
            .populate({ path: "projectId", select: "name projectImage" })
            .lean();

        const taskIds = tasks.map(t => t._id);
        const auctions = await Auction.find({ taskId: { $in: taskIds }, status: "OPEN" })
            .select("taskId baseReward endsAt status bids")
            .lean();

        const auctionMap = {};
        auctions.forEach(a => { auctionMap[a.taskId.toString()] = a; });

        const response = tasks
            .filter(task => auctionMap[task._id.toString()])
            .map(task => {
                const auction = auctionMap[task._id.toString()];
                return {
                    task: {
                        _id: task._id,
                        title: task.title,
                        difficulty: task.difficulty,
                        dueDate: task.dueDate,
                        ethereum: task.ethereum,
                        project: {
                            _id: task.projectId._id,
                            name: task.projectId.name,
                            projectImage: formatImage(task.projectId.projectImage),
                        },
                    },
                    auction: {
                        _id: auction._id,
                        baseReward: auction.baseReward,
                        endsAt: auction.endsAt,
                        status: auction.status,
                        bidCount: auction.bids.length,
                        minBid: auction.bids.length > 0
                            ? Math.min(...auction.bids.map(b => b.amount))
                            : auction.baseReward,
                    },
                };
            });

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
        const task = await Task.findById(taskId).select("projectId assigneeId");
        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (task.assigneeId.equals(req.user.id))
            return res.status(403).json({ msg: "Cannot bid on your own task" });

        const isMember = await Membership.exists({ projectId: task.projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Not a project member" });

        const auction = await Auction.findOne({ taskId });
        if (!auction) return res.status(404).json({ msg: "Auction not found" });
        if (auction.status !== "OPEN") return res.status(400).json({ msg: "Auction is not active" });

        const existingBid = auction.bids.find(b => b.userId.equals(req.user.id));
        if (existingBid) {
            if (existingBid.amount !== amount) {
                existingBid.amount = amount;
                existingBid.createdAt = new Date();
            }
        }
        else auction.bids.push({ userId: req.user.id, amount });

        /*
            We don't have to update the winner following "earliest bidder wins" strategy
            It works as when this api is called and a bid of same amount is there already,
            means someone submitted it earlier than you, so he simply remains the winner

            the only way you could become winner is that you submit a bid with a new low
            so you could be the earliest bidder with this amount, and hope that someone
            doesn't submit with an even lower bid
        */

        const lowestBid = auction.bids.reduce((winner, bid) => {
            if (bid.amount < winner.amount) return bid;
            if (bid.amount === winner.amount && new Date(bid.createdAt) < new Date(winner.createdAt)) return bid;
            return winner;
        }, auction.bids[0]);

        auction.winnerId = lowestBid.userId;

        await auction.save();
        res.status(200).json({ msg: "Bid submitted successfully" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// manually choose a winner
router.patch("/task/:taskId/close", authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { winnerId } = req.body;

    if (!winnerId) return res.status(400).json({ msg: "winnerId is required" });

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (!task.assigneeId.equals(req.user.id))
            return res.status(403).json({ msg: "Only the assignee can close the auction" });

        const auction = await Auction.findOne({ taskId });
        if (!auction) return res.status(404).json({ msg: "Auction not found" });
        if (auction.status !== "OPEN") return res.status(400).json({ msg: "Auction is not active" });

        const winningBid = auction.bids.find(b => b.userId.equals(winnerId));
        if (!winningBid) return res.status(400).json({ msg: "Selected winner has not placed a bid" });

        auction.status = "CLOSED";
        auction.winnerId = winningBid.userId;
        await auction.save();

        task.assigneeId = winningBid.userId;
        task.onAuction = false;
        await task.save();

        res.status(200).json({ msg: "Auction closed, task assigned successfully" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// take the task off the market
router.delete("/task/:taskId/", authMiddleware, async (req, res) => {
    const { taskId } = req.params;

    if (!taskId) return res.status(404).json({ msg: "taskId is required" });

    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        if (!task.assigneeId.equals(req.user.id))
            return res.status(403).json({ msg: "Unuthorized to take off the marketplace" });

        const isMember = await Membership.exists({ projectId: task.projectId, userId: req.user.id });
        if (!isMember) return res.status(403).json({ msg: "Not a project member" });

        const auction = await Auction.findOne({ taskId });
        if (!auction) return res.status(404).json({ msg: "Auction not found" });
        if (auction.status !== "OPEN") return res.status(400).json({ msg: "Auction has expired" });

        await Auction.deleteOne({ _id: auction._id });

        task.onAuction = false;
        await task.save();

        res.status(200).json({ msg: "Bidding closed successfully" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;