import DHT from "bittorrent-dht";
import logger from "../utils/logger.js";
import { probeStats } from "../routes/stats.js";

let dhtInstances = [];
let statsInterval = null;
export const startSession = async (workers, maxListeners) => {
    if (probeStats.running) {
        logger.warn("Session is already running.");
        return;
    }

    probeStats.running = true;
    probeStats.sessionStartTime = performance.now();
    probeStats.hashesProcessed = 0;
    probeStats.matchesFound = 0;

    logger.info(`Starting session with ${workers} workers and maxListeners ${maxListeners}...`);

    try {
        dhtInstances = Array.from({ length: workers }, (_, index) => {
            logger.info(`Initializing DHT instance ${index + 1}...`);
            const dht = new DHT({ concurrency: 128 });
            dht.setMaxListeners(maxListeners);
            dht.listen(() => {
                logger.info(`DHT instance ${index + 1} listening.`);
            });
            return dht;
        });

        statsInterval = setInterval(() => {
            logger.info(`Stats: ${JSON.stringify(probeStats)}`);
        }, 1000);

        logger.info("Session started successfully.");
    } catch (error) {
        logger.error(`Error during startSession: ${error.message}`);
        throw error; // Let the caller know something went wrong
    }
};

export const stopSession = () => {
    if (!probeStats.running) {
        logger.warn("No session running to stop.");
        return;
    }

    probeStats.running = false;

    dhtInstances.forEach((dht) => dht.destroy());
    dhtInstances = [];
    clearInterval(statsInterval);

    logger.info("Session stopped.");
};