import { queryDatabaseStats } from "../services/databaseService.js";

export const getStats = async (req, res) => {
    try {
        const stats = await queryDatabaseStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
