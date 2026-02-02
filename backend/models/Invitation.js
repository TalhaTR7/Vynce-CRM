import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  inviterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  inviteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "DECLINED"],
    default: "PENDING",
    required: true
  }
}, { timestamps: true });

invitationSchema.index(
  { projectId: 1, inviteeId: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } }
);

export default mongoose.model("Invitation", invitationSchema);
