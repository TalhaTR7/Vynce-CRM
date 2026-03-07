import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["OWNER", "ADMIN", "MEMBER"], default: "MEMBER" },
}, {
    timestamps: true,
    versionKey: false
});

memberSchema.index(
    { projectId: 1, userId: 1 },
    { unique: true }
);

export default mongoose.model("Member", memberSchema);
