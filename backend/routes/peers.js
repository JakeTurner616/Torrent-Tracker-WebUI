import express from "express";
import { getPeers, getUniquePeers, getNeighboringBlocks, getPeersByIp } from "../controllers/peersController.js";
import { validateIp } from "../middlewares/validation.js";

const router = express.Router();

router.get("/en/peer/:ip", validateIp, getPeers);

router.get("/:ip", (req, res, next) => {
    console.log("Reached the /:ip route with IP:", req.params.ip);
    next();
}, validateIp, getPeers);
router.get("/unique", validateIp, getUniquePeers);
router.get("/neighboring-blocks/:ip", validateIp, getNeighboringBlocks);
// New route for fetching peers by IP with pagination
router.get("/matched_infohashes/:ip", getPeersByIp);  // This is the new route
export default router;
