import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// Load environment variables from .env
dotenv.config();

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is not set in the environment variables.");
} else {
    console.log("ADMIN_PASSWORD is loaded.");
}

if (!AUTH_TOKEN) {
    console.error("Error: AUTH_TOKEN is not defined.");
} else {
    console.log("AUTH_TOKEN is loaded.");
}

router.post("/validate-admin", (req, res) => {
    const { adminPassword } = req.body;

    console.log("Received admin password from client:", adminPassword);

    if (!adminPassword) {
        console.error("Admin password missing in request.");
        return res.status(400).json({ message: "Admin password is required." });
    }

    if (adminPassword !== ADMIN_PASSWORD) {
        console.warn("Invalid admin password received.");
        return res.status(403).json({ message: "Invalid admin password." });
    }

    try {
        // Generate a JWT for admin authentication
        const adminToken = jwt.sign({ role: "admin" }, AUTH_TOKEN, { expiresIn: "10m" }); // 10-minute expiration
        console.log("Admin token generated successfully:", adminToken);
        res.json({ adminToken });
    } catch (err) {
        console.error("Error generating admin token:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

export default router;