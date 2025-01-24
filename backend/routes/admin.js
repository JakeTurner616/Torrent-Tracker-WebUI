import express from "express";
import { prunePeers, backupDatabase } from "../controllers/adminController.js";
import { authenticate, adminAuthenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply global authentication first
router.use(authenticate);

// Apply admin authentication to sensitive routes
router.delete("/tools/prune", adminAuthenticate, prunePeers);
router.post("/backup", adminAuthenticate, backupDatabase);

export default router;
