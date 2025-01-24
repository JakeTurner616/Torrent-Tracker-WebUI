import http from "http";
import { WebSocketServer } from "ws";
import app from "./app.js";
import logger from "./utils/logger.js";
import { startProbeSession, stopProbeSession } from "./services/probeService.js";

// Define the server port
const PORT = 3005;

// Create the HTTP server
const server = http.createServer(app);

// Initialize the WebSocket server and pass it to other modules
const wsServer = new WebSocketServer({ server });

// WebSocket connection handling
wsServer.on("connection", (ws) => {
    logger.info("WebSocket client connected.");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            if (data.action === "start") {
                const { workers = 4, maxListeners = 120 } = data;
                startProbeSession(workers, maxListeners, wsServer);
            } else if (data.action === "stop") {
                stopProbeSession();
            } else {
                ws.send(JSON.stringify({ error: "Invalid action" }));
            }
        } catch (error) {
            logger.error(`Error handling WebSocket message: ${error.message}`);
            ws.send(JSON.stringify({ error: "Invalid message format" }));
        }
    });

    ws.on("close", () => {
        logger.info("WebSocket client disconnected.");
    });
});

// Start the server
server.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown logic
const shutdown = () => {
    logger.info("Graceful shutdown initiated...");
    server.close(() => {
        logger.info("Server stopped successfully.");
        process.exit(0);
    });

    // Force shutdown after 5 seconds if cleanup takes too long
    setTimeout(() => {
        logger.error("Forcing shutdown due to timeout.");
        process.exit(1);
    }, 5000);
};

// Handle termination signals
["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, shutdown);
});

// Handle uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception: ${err.stack || err.message}`);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});
