import cron from "node-cron";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

cron.schedule("0 9 * * *", async () => {
    try {
        const now = new Date();

        // Target tasks due within the next 24–48 hours (tomorrow only)
        // This way the cron only catches a task once since each run
        // advances by exactly 24 hours
        const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const windowEnd   = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const tasks = await Task.find({
            dueDate: { $gt: windowStart, $lte: windowEnd },
            isSubmitted: false,
            closed: false
        });

        for (const task of tasks) {
            // Dedup: check by taskId stored in action.url (schema-safe)
            const exists = await Notification.findOne({
                "users._id": task.assigneeId,
                type: "TASK_DUE_IN",
                "action.url": `/task/${task._id}`
            });

            if (exists) continue;

            await Notification.create({
                users: [{ _id: task.assigneeId }],
                type: "TASK_DUE_IN",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `Task due soon: "${task.title}"`,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                }
            });
        }
    } catch (err) {
        console.error("[CRON] taskDueNotifications:", err);
    }
});