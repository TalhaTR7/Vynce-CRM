import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true },
    position: { type: Number, default: 0, min: 0 },
    color: { type: String, default: "#CCCCCC" },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, {
    timestamps: true
});

boardSchema.index({ projectId: 1, position: 1 }, { unique: true });
boardSchema.index({ projectId: 1, name: 1 }, { unique: true });

export default mongoose.model("Board", boardSchema);
