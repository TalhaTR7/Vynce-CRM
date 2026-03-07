import mongoose from "mongoose";

const roleChangeSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    currentRole: { type: String, enum: ["OWNER", "ADMIN", "MEMBER"], required: true },
    newRole: { type: String, enum: ["OWNER", "ADMIN", "MEMBER"], required: true },
    action: { type: String, enum: ["PROMOTION", "DEMOTION"], required: true },
    status: { type: String, enum: ["COMPLETED", "CANCELLED"], default: "COMPLETED", required: true }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model("RoleChange", roleChangeSchema);
