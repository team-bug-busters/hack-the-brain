import Record from "../models/record.js";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /api/upload
export const uploadRecord = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // TEMP: Hardcode a user ID for testing
  const testUserId = new mongoose.Types.ObjectId("64b7f6c2e4b0f2a1c8e4d123");
  const record = new Record({
    user: testUserId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    uploadDate: new Date(),
    metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
  });

  await record.save();
  res.status(201).json(record);
};

// GET /api/records
export const listRecords = async (req, res) => {
  const records = await Record.find({ user: req.user._id });
  res.json(records);
};

// GET /api/records/:id
export const getRecord = async (req, res) => {
  const record = await Record.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!record) return res.status(404).json({ error: "Record not found" });
  res.download(
    path.join(__dirname, "../../uploads", record.filename),
    record.originalName
  );
};

// DELETE /api/records/:id
export const deleteRecord = async (req, res) => {
  const record = await Record.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!record) return res.status(404).json({ error: "Record not found" });
  res.json({ message: "Record deleted" });
};

// GET /api/share/:token
export const getSharedRecord = async (req, res) => {
  const record = await Record.findOne({
    shareToken: req.params.token,
    shareTokenExpires: { $gt: new Date() },
  });
  if (!record)
    return res.status(404).json({ error: "Invalid or expired token" });
  res.download(
    path.join(__dirname, "../../uploads", record.filename),
    record.originalName
  );
};

// POST /api/records/:id/share
export const createShareToken = async (req, res) => {
  const record = await Record.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!record) return res.status(404).json({ error: "Record not found" });
  record.shareToken = crypto.randomBytes(16).toString("hex");
  record.shareTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await record.save();
  res.json({ token: record.shareToken });
};
