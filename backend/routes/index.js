// routes/index.js

import express from "express";
import peersRoutes from "./peers.js";
import infohashesRoutes from "./infohashes.js";
import statsRoutes from "./stats.js";
import probeRoutes from "./probeRoutes.js";
import { getTopMatchedInfohashes, getTopInfohashes } from "../controllers/infohashesController.js";
import {  getPeers } from "../controllers/peersController.js";
import { validateIp } from "../middlewares/validation.js";
import { getInfohashData } from "../controllers/infohashesController.js";
import adminRoutes from './admin.js';
import authRoutes from './authRoutes.js';

const router = express.Router();
router.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});
// Mount routes
router.use("/probe", probeRoutes);
router.use("/peers", peersRoutes);
router.use("/infohashes", infohashesRoutes);
router.use("/stats", statsRoutes);
router.use("/top-matched-infohashes", getTopMatchedInfohashes);
router.use("/peer/:ip", validateIp, getPeers);
router.use("/infohash-data/:infohash", getInfohashData);
router.use('/admin', adminRoutes);
router.use("/auth", authRoutes); // Mount authentication routes





// Root route for listing and testing API routes
router.get("/", (req, res) => {
    const apiRoutes = [
        { method: "GET", path: "/api/infohashes/top-infohashes", description: "Fetch the top 10 infohashes by peer count" },
        { method: "GET", path: "/api/peers/unique?host=120.155.52.253", description: "Fetch unique peers for a given host (IP)" },
        { method: "GET", path: "/api/peers/:ip", description: "Fetch peers for a specific IP address" },
        { method: "GET", path: "/api/top-matched-infohashes", description: "Fetch top matched infohashes for the top 10 IPs" },
        { method: "GET", path: "/api/peers/neighboring-blocks/:ip", description: "Find neighboring IP blocks for a specific IP" },
        { method: "GET", path: "/api/infohashes", description: "Fetch all infohashes for an IP" },
        { method: "POST", path: "/api/infohashes", description: "Save a new infohash to the database" },
        { method: "DELETE", path: "/api/infohashes", description: "Delete multiple infohashes by their IDs" },
        { method: "GET", path: "/api/stats", description: "Fetch database statistics" },
        { method: "POST", path: "/api/probe/start", description: "Start a probe session for DHT lookups" },
        { method: "POST", path: "/api/probe/stop", description: "Stop the ongoing probe session" },
        { method: "POST", path: "/api/upload-torrent", description: "Upload a .torrent file or magnet link" },
        { method: "DELETE", path: "/admin/tools/prune", description: "Prune the peers table and reset its identity" },
        { method: "POST", path: "/admin/backup", description: "Create and download a backup of database tables as a .zip file" },
        { method: "GET", path: "/en/summary", description: "Fetch a summary of database statistics in the server's timezone" },
        { method: "GET", path: "/api/matched_infohashes/:ip?page=1&limit=10", description: "Fetch matched infohashes for a given IP with pagination (page and limit)" }
    ];

    const htmlResponse = `
        <html>
            <head>
                <title>API Routes</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    ul { list-style: none; padding: 0; }
                    li { margin-bottom: 15px; }
                    form { margin-top: 10px; }
                    input, select, textarea { margin: 5px 0; display: block; }
                    button { margin-top: 5px; }
                </style>
            </head>
            <body>
                <h1>Available API Routes</h1>
                <ul>
                    ${apiRoutes
                        .map(
                            (route) => `
                            <li>
                                <strong>${route.method}</strong> ${route.path} - ${route.description}
                                ${
                                    route.method !== "DELETE" && route.method !== "POST"
                                        ? `<form action="${route.path.replace(/:(\w+)/g, "")}" method="GET" target="_blank">
                                                <label>Path Parameter(s):</label>
                                                ${route.path
                                                    .match(/:(\w+)/g)?.map(
                                                        (param) => `<input type="text" name="${param.slice(1)}" placeholder="${param.slice(1)}" required />`
                                                    ) || ""}
                                                <button type="submit">Test</button>
                                            </form>`
                                        : ""
                                }
                            </li>`
                        )
                        .join("")}
                </ul>
                <h2>Test POST or DELETE Routes</h2>
                <form action="/api/probe/start" method="POST" target="_blank">
                    <label>POST /api/probe/start:</label><br />
                    <textarea name="json" placeholder='{ "workers": 4, "maxListeners": 120 }' required></textarea><br />
                    <button type="submit">Test Start Probe</button>
                </form>
                <form action="/api/probe/stop" method="POST" target="_blank">
                    <label>POST /api/probe/stop:</label><br />
                    <button type="submit">Test Stop Probe</button>
                </form>
            </body>
        </html>
    `;

    res.send(htmlResponse);
});

export default router;