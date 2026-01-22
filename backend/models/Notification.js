import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String, enum: [
                "TASK_ASSIGNED",
                "TASK_DUE_IN",
                "ETH_FROM_USER",
                "WEEKLY_MP",
                "TASK_REWARDS",
                "LEVEL_UP",
                "REMOVED_FROM_PROJECT",
                "NEW_TO_PROJECT"
            ], required: true
        },
        icon: {
            type: { type: String, enum: ["PROJECT", "USER", "SVG"], required: true },
            refId: { type: String, required: true }
        },
        title: { type: String, required: true },
        action: {
            type: { type: String, enum: ["NAVIGATE", "MESSAGE"], required: true },
            url: { type: String, default: null }
        },
        read: { type: Boolean, default: false }
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
