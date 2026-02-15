import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, unique: true },
    baseReward: { type: Number, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ["OPEN", "CLOSED", "EXPIRED"], default: "OPEN" },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    bids: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model("Auction", auctionSchema);

