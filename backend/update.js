import mongoose from "mongoose";
import Task from "./models/Task.js";
import dotenv from "dotenv";


dotenv.config();

const update = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await mongoose.connection.db
      .collection("tasks")
      .updateMany(
        { closed: { $exists: false } },
        {
          $set: {
            closed: false
          }
        }
      );

    console.log("Operation complete:", result.modifiedCount, "documents updated");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

update();
