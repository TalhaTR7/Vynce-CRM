import cron from "node-cron";
import Membership from "../models/Membership.js";

// Reset weeklyXP for all members every Sunday at 23:59
cron.schedule("59 23 * * 0", async () => {
    try {
        await Membership.updateMany({}, { weeklyXP: 0 });
    } catch (err) {
        console.error("[CRON] resetWeeklyXP:", err);
    }
});