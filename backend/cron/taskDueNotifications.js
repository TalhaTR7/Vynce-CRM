import cron from "node-cron";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

cron.schedule("0 9 * * *", async () => {
    try {
        const now = new Date();
        const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        const tasks = await Task.find({
            dueDate: { $lte: in2Days, $gt: now },
            isSubmitted: false,
            closed: false
        });

        for (const task of tasks) {
            const exists = await Notification.findOne({
                taskId: task._id,
                type: "TASK_DUE_IN"
            });

            if (exists) continue;

            await Notification.create({
                userIds: [task.assigneeId],
                taskId: task._id,
                type: "TASK_DUE_IN",
                icon: {
                    type: "PROJECT",
                    refId: task.projectId
                },
                title: `Task due soon: "${task.title}" `,
                action: {
                    type: "NAVIGATE",
                    url: `/task/${task._id}`
                }
            });
        }
    } catch (err) {
        console.error("[CRON] ", err);
    }
});