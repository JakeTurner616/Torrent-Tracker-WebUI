import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// Load environment variables from .env
dotenv.config();

const AUTH_TOKEN = process.env.AUTH_TOKEN; // Secret used for signing tokens

// Global authentication middleware
export const authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header missing." });
    }

    const token = authHeader.split(" ")[1];
    if (token === AUTH_TOKEN) {
        console.log("Global token is valid!");
        next();
    } else {
        console.warn("Invalid global token.");
        res.status(403).json({ message: "Forbidden: Invalid global token." });
    }
};

// Admin authentication middleware
export const adminAuthenticate = (req, res, next) => {
    const adminTokenHeader = req.headers["x-admin-token"];
    if (!adminTokenHeader) {
        console.error("Admin token header missing.");
        return res.status(401).json({ message: "Admin token header missing." });
    }

    const token = adminTokenHeader.split(" ")[1];
    console.log("Received admin token:", token);

    try {
        const decoded = jwt.verify(token, AUTH_TOKEN); // Verify adminToken as JWT
        console.log("Decoded admin token:", decoded);

        if (decoded.role === "admin") {
            console.log("Admin token is valid!");
            next();
        } else {
            console.warn("Invalid admin role in token.");
            res.status(403).json({ message: "Forbidden: Invalid admin role." });
        }
    } catch (err) {
        console.error("Error verifying admin token:", err.message);
        res.status(403).json({ message: "Forbidden: Invalid or expired admin token." });
    }
};