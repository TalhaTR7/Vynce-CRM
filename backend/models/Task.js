import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
    difficulty: { type: Number, default: 1, min: 1, max: 5 },
    ethereum: {
        assigned: { type: Number, default: 1, min: 1 },
        calculated: { type: Number, default: 0 },
    },
    timerStartedAt: { type: Date, default: null },
    worktime: { type: Number, default: 0 },
    motivation: { type: Number, default: 0 },
    isTimerRunning: { type: Boolean, default: false },
    activity: [{
        type: { type: String, enum: ["ACTION", "COMMENT"], required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        time: { type: Date, default: Date.now },
        content: { type: String, default: "" },
        action: {
            type: String, enum: [
                "CREATED_TASK",
                "CHANGED_TITLE",
                "CHANGED_DESCRIPTION",
                "CHANGED_DUE_DATE",
                "STARTED_TIMER",
                "STOPPED_TIMER",
                "CHANGED_STATUS",
                "UPDATED_REWARD",
                "CHANGED_DIFFICULTY"
            ], default: null
        },
        old_date: { type: Date, default: null },
        new_date: { type: Date, default: null },
        old_status: { type: mongoose.Schema.Types.ObjectId, ref: "Board", default: null },
        new_status: { type: mongoose.Schema.Types.ObjectId, ref: "Board", default: null },
        old_reward: { type: Number, default: 0 },
        new_reward: { type: Number, default: 0 }
    }]
},
    { timestamps: true }
);

taskSchema.index({ projectId: 1, boardId: 1 });
taskSchema.index({ assigneeId: 1 });
taskSchema.index({ "activity.userId": 1 });

export default mongoose.model("Task", taskSchema);
