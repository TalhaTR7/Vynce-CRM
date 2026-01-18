import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profileImage: {
    url: { type: String, default: "/assets/profile.png" },
  },
  currentMood: { type: String, enum: ["ANGRY", "SICK", "DIZZY", "SAD", "NORMAL", "OKAY", "VIBING", "HAPPY", "GLASSES"], default: "NORMAL" },
  motivationScore: { type: Number, default: 0 },
  motivationLevel: { type: Number, default: 0 },
  etherium: { type: Number, default: 0 },
  systemRole: { type: String, enum: ["PLATFORM_OWNER", "USER"], default: "USER" },
  worktime: { type: Number, default: 0 },
},
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
