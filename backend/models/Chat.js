import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    participants: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        validate: {
            validator: members => members.length === 2,
            message: "Chat must have only 2 participants",
        },
        required: true,
    },
    isActive: {
        type: Map,
        of: Boolean,
        default: {},
    },
},
    { timestamps: true }
);

chatSchema.index(
    { participants: 1 },
    { unique: true }
);

export default mongoose.model("Chat", chatSchema);

