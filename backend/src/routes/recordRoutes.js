import express from "express";
import clerkAuth from "../middleware/clerkAuth.js";
import upload from "../middleware/upload.js";
import * as recordController from "../controllers/recordController.js";

const router = express.Router();

// router.post(
//   "/upload",
//   clerkAuth,
//   upload.single("file"),
//   recordController.uploadRecord
// );

// router.get("/records", clerkAuth, recordController.listRecords);
// router.get("/records/:id", clerkAuth, recordController.getRecord);
// router.delete("/records/:id", clerkAuth, recordController.deleteRecord);
// router.post("/records/:id/share", clerkAuth, recordController.createShareToken);

router.post("/upload", upload.single("file"), recordController.uploadRecord);
router.get("/records", recordController.listRecords);
router.get("/records/:id", recordController.getRecord);
router.delete("/records/:id", recordController.deleteRecord);
router.post("/records/:id/share", recordController.createShareToken);
export default router;
