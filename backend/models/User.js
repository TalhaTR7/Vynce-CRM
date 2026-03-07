import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profileImage: {
    url: { type: String, default: "/assets/profile.png" },
  },
  mood: {
    value: { type: String, enum: ["ANGRY", "CRYING", "SAD", "NORMAL", "OKAY", "HAPPY", "ECSTATIC"], default: "NORMAL" },
    updatedAt: { type: Date, default: Date.now }
  },
  motivationScore: { type: Number, default: 0 },
  motivationLevel: { type: Number, default: 0 },
  ethereum: { type: Number, default: 0 },
  worktime: { type: Number, default: 0 },
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.model("User", userSchema);
