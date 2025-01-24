// /controllers/probeController.js
import { startProbeSession, stopProbeSession } from "../services/probeService.js";

export const startProbe = async (req, res) => {
    try {
        const { workers = 4, maxListeners = 120, pipelines = ["DHT Crawl"] } = req.body;

        // Validate pipelines
        const validPipelines = ["DHT Crawl", "Query Trackers"];
        const invalidPipelines = pipelines.filter((p) => !validPipelines.includes(p));
        if (invalidPipelines.length > 0) {
            return res.status(400).json({ error: `Invalid pipelines: ${invalidPipelines.join(", ")}` });
        }

        await startProbeSession(workers, maxListeners, pipelines);
        res.json({ message: "Probe session started with pipelines.", pipelines });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const stopProbe = (req, res) => {
    try {
        stopProbeSession();
        res.json({ message: "Probe session stopped." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
