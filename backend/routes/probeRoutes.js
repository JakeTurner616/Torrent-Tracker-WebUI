import express from "express";
import { stopProbeSession, startProbeSession } from "../services/probeService.js";

const router = express.Router();

// Start the probe session
router.post("/start", (req, res) => {
    const { workers, maxListeners, pipelines } = req.body; // Extract pipelines from the request body
    if (!pipelines || !Array.isArray(pipelines) || pipelines.length === 0) {
        return res.status(400).json({ error: "No valid pipelines specified. Please select at least one pipeline." });
    }

    startProbeSession(workers, maxListeners, pipelines); // Pass pipelines to startProbeSession
    res.json({ message: "Probe session started." });
});

// Stop the probe session
router.post("/stop", (req, res) => {
    stopProbeSession();
    res.json({ message: "Probe session stopped." });
});

// Stats object to track session data
export const stats = {
    running: false,
    sessionStartTime: null,
    hashesProcessed: 0,
    matchesFound: 0,
};

// Get the probe session status
router.get("/status", (req, res) => {
    const elapsedTime = stats.running
        ? ((performance.now() - stats.sessionStartTime) / 1000).toFixed(2)
        : 0;

    res.json({
        running: stats.running,
        hashesPerSecond: stats.running ? (stats.hashesProcessed / elapsedTime).toFixed(2) : 0,
        elapsedTime: parseFloat(elapsedTime).toFixed(2),
        matches: stats.matchesFound,
    });
});

export default router;