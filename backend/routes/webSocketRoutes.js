import { performance } from "perf_hooks";
import logger from "../utils/logger.js";
import { startSession, stopSession } from "../middlewares/sessionManager.js";

export const handleWebSocketMessage = (ws, message, stats) => {
    try {
        const data = JSON.parse(message);

        switch (data.action) {
            case "start":
                const { workers = 4, maxListeners = 120 } = data;
                startSession(workers, maxListeners).then(() => {
                    ws.send(JSON.stringify({ action: "start", message: "DHT session started." }));
                });
                break;

            case "stop":
                stopSession();
                ws.send(JSON.stringify({ action: "stop", message: "DHT session stopped." }));
                break;

            case "status":
                const elapsed = stats.running
                    ? ((performance.now() - stats.sessionStartTime) / 1000).toFixed(2)
                    : 0;

                ws.send(
                    JSON.stringify({
                        action: "status",
                        stats: {
                            running: stats.running,
                            hashesPerSecond: stats.running ? (stats.hashesProcessed / elapsed).toFixed(2) : 0,
                            elapsedTime: parseFloat(elapsed).toFixed(2),
                            matches: stats.matchesFound,
                        },
                    })
                );
                break;

            default:
                ws.send(JSON.stringify({ error: "Unknown action" }));
        }
    } catch (error) {
        logger.error(`WebSocket message error: ${error.message}`);
        ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
};

