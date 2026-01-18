import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    userId1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userId2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
},
    { timestamps: true }
);

chatSchema.index({ userId1: 1, userId2: 1 }, { unique: true });

export default mongoose.model("Chat", chatSchema);
