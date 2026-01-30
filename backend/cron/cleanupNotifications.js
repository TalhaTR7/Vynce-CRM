import cron from "node-cron";
import Notification from "../models/Notification.js";

cron.schedule("0 3 * * *", async () => {
    try {
        const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const result = await Notification.deleteMany({
            read: true,
            createdAt: { $lte: cutoff }
        });
        console.log(`[CRON] Deleted ${result.deletedCount} old notifications`);
    } catch (err) {
        console.error("[CRON] ", err);
    }
});
