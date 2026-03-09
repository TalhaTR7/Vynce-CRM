import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const update = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const members = await mongoose.connection.db
      .collection("members")
      .find({ weeklyXP: { $exists: false } })
      .toArray();

    for (const member of members) {
      const newDoc = {
        _id: member._id,
        projectId: member.projectId,
        userId: member.userId,
        role: member.role,
        weeklyXP: 0,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      };

      await mongoose.connection.db
        .collection("members")
        .replaceOne({ _id: member._id }, newDoc);
    }

    console.log(`✅ Weekly XP added to ${members.length} documents`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

update();