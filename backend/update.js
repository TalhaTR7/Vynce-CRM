import mongoose from "mongoose";
import Task from "./models/Task.js";
import dotenv from "dotenv";


dotenv.config();

const update = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await Task.updateMany(
      { difficulty: { $exists: false } },
      { $set: { difficulty: 1 } }
    );

    console.log("Migration complete:", result.modifiedCount, "documents updated");

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

update();
