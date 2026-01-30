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
    isSubmitted: { type: Boolean, default: false },
    isRewarded: { type: Boolean, default: false },
    activity: [{
        type: { type: String, enum: ["ACTION", "COMMENT"], required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        time: { type: Date, default: Date.now },
        content: { type: String, default: "" },
        action: {
            type: String, enum: [
                "CREATED_TASK", // on task creation; creator
                "CHANGED_TITLE", // on title edit; admin, owner
                "CHANGED_ASSIGNEE", // on assignee change; admin, owner
                "CHANGED_DESCRIPTION", // on description edit; admin, owner
                "CHANGED_DUE_DATE", // on due date edit; admin, owner
                "STARTED_TIMER", // on timer start; assignee
                "STOPPED_TIMER", // on timer stop; assignee
                "CHANGED_STATUS", // on board move/change; assignee, admin, owner
                "UPDATED_REWARD", // on bounty edit; admin, owner
                "CHANGED_DIFFICULTY", // on difficulty change; admin, owner
                "TASK_DELETED", // on task deletion; creator
                "TASK_CLOSED", // on task closure and assignee reward; creator
                "TASK_RESTORED", // on task restoration; admin, owner
                "TASK_SUBMITTED", // on task submission; assignee
                "TASK_REASSIGNED" // on task reassignment; creator
            ], default: null
        },
    }],
    closed: { type: Boolean, default: false }
},
    { timestamps: true }
);

taskSchema.index({ projectId: 1, boardId: 1 });
taskSchema.index({ assigneeId: 1 });
taskSchema.index({ "activity.userId": 1 });

export default mongoose.model("Task", taskSchema);