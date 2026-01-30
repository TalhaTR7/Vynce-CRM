import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    user1: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        isActive: { type: Boolean, default: false }
    },
    user2: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        isActive: { type: Boolean, default: false }
    },
},
    { timestamps: true }
);

chatSchema.index({ userId1: 1, userId2: 1 }, { unique: true });

export default mongoose.model("Chat", chatSchema);
