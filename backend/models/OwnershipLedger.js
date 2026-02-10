import mongoose from "mongoose";

const ownershipLedgerSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "DECLINED"], default: "PENDING", required: true }
}, { timestamps: true });

ownershipLedgerSchema.index(
    { projectId: 1 },
    { unique: true, partialFilterExpression: { status: "PENDING" } }
);

export default mongoose.model("OwnershipLedger", ownershipLedgerSchema);
