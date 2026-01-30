import mongoose from "mongoose";
import Task from "./Task.js";

const archiveSchema = Task.schema.clone();

archiveSchema.path("boardId").required(false);
archiveSchema.path("assigneeId").required(false);

archiveSchema.add({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", default: null },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  ethereum: {
    assigned: { type: Number, default: 0, min: 0 },
    calculated: { type: Number, default: 0 },
  }
});

archiveSchema.clearIndexes();

export default mongoose.model("Archive", archiveSchema);
