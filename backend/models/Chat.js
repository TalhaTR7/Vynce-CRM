import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    participants: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
        validate: {
            validator: (members) => members.length === 2,
            message: "Chat must have exactly 2 participants",
        },
        required: true,
    },
    hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

}, { timestamps: true });

chatSchema.index({ "participants.0": 1, "participants.1": 1 }, { unique: true });

export default mongoose.model("Chat", chatSchema);

