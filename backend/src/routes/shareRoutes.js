import express from "express";
import * as recordController from "../controllers/recordController.js";

const router = express.Router();

router.get("/share/:token", recordController.getSharedRecord);

export default router;
