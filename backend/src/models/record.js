import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  metadata: { type: Object },
  shareToken: { type: String },
  shareTokenExpires: { type: Date },
});

const Record = mongoose.model("Record", recordSchema);

export default Record;
