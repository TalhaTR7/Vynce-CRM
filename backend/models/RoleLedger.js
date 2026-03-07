import mongoose from "mongoose";

const roleLedgerSchema = new mongoose.Schema({
    membershipId: { type: mongoose.Schema.Types.ObjectId, ref: "Membership", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["PROMOTION", "DEMOTION"], required: true },
    oldRole: { type: String, enum: ["ADMIN", "MEMBER"], required: true },
    newRole: { type: String, enum: ["ADMIN", "MEMBER"], required: true }
}, {
    timestamps: true,
    versionKey: false
});

roleLedgerSchema.index({ membershipId: 1 });

export default mongoose.model("RoleLedger", roleLedgerSchema);
