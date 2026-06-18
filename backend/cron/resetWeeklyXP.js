import cron from "node-cron";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";


// Every Sunday at 23:59 — pay leaderboard winners then reset weeklyXP
cron.schedule("59 23 * * 0", async () => {
    try {
        // Get all distinct projects that have at least one member with XP this week
        const activeProjects = await Membership.distinct("projectId", { weeklyXP: { $gt: 0 } });

        const rewards = [20, 15, 10];
        const consolation = 5;

        for (const projectId of activeProjects) {
            const members = await Membership.find({ projectId, weeklyXP: { $gt: 0 } })
                .sort({ weeklyXP: -1 })
                .select("userId weeklyXP");

            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                const reward = i < rewards.length ? rewards[i] : consolation;

                await User.findByIdAndUpdate(member.userId, {
                    $inc: { ethereum: reward }
                });

                await Notification.create({
                    users: [{ _id: member.userId }],
                    type: "WEEKLY_MP",
                    icon: { type: "PROJECT", refId: projectId },
                    title: i === 0
                        ? `🏆 You finished #1 this week and earned ${reward} ETH!`
                        : `You finished #${i + 1} this week and earned ${reward} ETH`,
                    action: {
                        type: "NAVIGATE",
                        url: `/settings/project/${projectId}/leaderboards`
                    }
                });
            }
        }

        // Reset after paying out
        await Membership.updateMany({}, { weeklyXP: 0 });

    } catch (err) {
        console.error("[CRON] resetWeeklyXP:", err);
    }
});