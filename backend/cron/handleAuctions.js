import cron from "node-cron";
import Auction from "../models/Auction.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";


// every 15 minutes
cron.schedule("*/15 * * * *", async () => {
    try {
        const now = new Date();

        const expiredAuctions = await Auction.find({
            status: "OPEN",
            endsAt: { $lte: now }
        });

        for (const auction of expiredAuctions) {
            const task = await Task.findById(auction.taskId);
            if (!task) continue;

            if (auction.bids.length === 0) {
                // no bids — expire it, task stays with original assignee
                auction.status = "EXPIRED";
                task.onAuction = false;

                await Notification.create({
                    users: [{ _id: task.assigneeId }],
                    type: "BID_CREATED",
                    icon: { type: "PROJECT", refId: task.projectId },
                    title: `Your auction for "${task.title}" ended with no bids — task remains yours`,
                    action: { type: "NAVIGATE", url: `/task/${task._id}` },
                });
            }
            else {
                // auto-assign top bidder (lowest amount, earliest if tied)
                const topBid = auction.bids.reduce((winner, bid) => {
                    if (bid.amount < winner.amount) return bid;
                    if (bid.amount === winner.amount && new Date(bid.createdAt) < new Date(winner.createdAt)) return bid;
                    return winner;
                }, auction.bids[0]);

                auction.status = "CLOSED";
                auction.winnerId = topBid.userId;
                task.assigneeId = topBid.userId;
                task.onAuction = false;

                // Notify winner
                await Notification.create({
                    users: [{ _id: topBid.userId }],
                    type: "TASK_ASSIGNED",
                    icon: { type: "PROJECT", refId: task.projectId },
                    title: `You were automatically assigned "${task.title}" after winning the auction`,
                    action: { type: "NAVIGATE", url: `/task/${task._id}` },
                });

                // Notify assignee their task was auto-reassigned
                await Notification.create({
                    users: [{ _id: task.assigneeId }],
                    type: "TASK_REASSIGNED",
                    icon: { type: "PROJECT", refId: task.projectId },
                    title: `Your auction for "${task.title}" ended — top bidder was automatically assigned`,
                    action: { type: "NAVIGATE", url: `/settings/project/${task.projectId}/markets` },
                });
            }

            await auction.save();
            await task.save();
        }
    } catch (err) {
        console.error("[CRON] handleAuctions:", err);
    }
});