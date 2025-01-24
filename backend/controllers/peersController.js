import { queryPeers, queryUniquePeers, queryNeighboringBlocks, getTotalPeers, queryDatabaseTotalPeers} from "../services/databaseService.js";

export const getPeers = async (req, res) => {
    const ip = req.params.ip; // Get the IP from the URL
    const { page = 1, limit = 10 } = req.query; // Pagination parameters
    const offset = (page - 1) * limit; // Calculate offset for pagination

    console.log(`Fetching peers for IP: ${ip}, Page: ${page}, Limit: ${limit}`);

    try {
        // Fetch peers and corrected total count
        const [peers, total] = await Promise.all([
            queryPeers(ip, limit, offset), // Fetch peers with pagination
            queryDatabaseTotalPeers(ip),  // Correct total count query
        ]);

        if (!peers || peers.length === 0) {
            return res.status(200).json({
                message: "No peers found for the provided IP address.",
                peers: [],
                total: 0,
                pageCount: 0,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
            });
        }

        const pageCount = Math.ceil(total / limit);

        res.json({
            peers,
            total,
            pageCount,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });
    } catch (err) {
        console.error("Error fetching peers:", err.message);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Controller to fetch unique peers for the given IP
export const getUniquePeers = async (req, res) => {
    const ip = req.query.host;  // Use query parameter for IP
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!ip) {
        return res.status(400).json({ error: "IP address is required as a query parameter." });
    }

    try {
        const client = await pool.connect();

        // Query to fetch peers matching the IP
        const peersQuery = `
            SELECT 
                infoHash, 
                title, 
                ARRAY_AGG(port) AS ports, 
                MAX(discovered_at) AS latestDiscoveredAt
            FROM peers
            WHERE host = $1
            GROUP BY infoHash, title
            ORDER BY latestDiscoveredAt DESC
            LIMIT $2 OFFSET $3;
        `;
        const peersResult = await client.query(peersQuery, [ip, limit, offset]);

        console.log('Peers query result:', peersResult.rows);  // Log the result

        // Query to count total matches for pagination
        const totalPeersQuery = `
            SELECT COUNT(DISTINCT infoHash) AS count
            FROM peers
            WHERE host = $1;
        `;
        const totalPeersResult = await client.query(totalPeersQuery, [ip]);

        console.log('Total peers result:', totalPeersResult.rows);  // Log the result

        client.release();

        if (peersResult.rows.length === 0) {
            return res.status(404).json({ message: "No matching data found for the provided IP." });
        }

        res.json({
            peers: peersResult.rows.map(peer => ({
                infoHash: peer.infohash,
                title: peer.title || "Unknown",  // Default to 'Unknown' if title is null
                ports: peer.ports,
                latestDiscoveredAt: peer.latestdiscoveredat,
            })),
            total: totalPeersResult.rows[0].count,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });
    } catch (err) {
        console.error("Error fetching peer data:", err.message);
        res.status(500).json({ error: "Internal server error." });
    }
};

export const getNeighboringBlocks = async (req, res) => {
    try {
        const neighbors = await queryNeighboringBlocks(req.params.ip);
        res.json(neighbors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// New controller function for fetching matched infohashes
export const getPeersByIp = async (req, res) => {
    const ip = req.params.ip;  // Get the IP from the URL params
    const { page = 1, limit = 10 } = req.query;  // Pagination parameters
    const offset = (page - 1) * limit;  // Calculate the offset for pagination

    if (!ip) {
        return res.status(400).json({ error: "IP address is required." });
    }

    try {
        const client = await pool.connect();

        // Query to fetch peers matching the IP with pagination
        const peersQuery = `
            SELECT 
                infoHash, 
                title, 
                ARRAY_AGG(port) AS ports, 
                MAX(discovered_at) AS latestDiscoveredAt
            FROM peers
            WHERE host = $1
            GROUP BY infoHash, title
            ORDER BY latestDiscoveredAt DESC
            LIMIT $2 OFFSET $3;
        `;
        const peersResult = await client.query(peersQuery, [ip, limit, offset]);

        // Query to count total matches for pagination
        const totalPeersQuery = `
            SELECT COUNT(DISTINCT infoHash) AS count
            FROM peers
            WHERE host = $1;
        `;
        const totalPeersResult = await client.query(totalPeersQuery, [ip]);

        client.release();  // Release the client back to the pool

        if (peersResult.rows.length === 0) {
            return res.status(404).json({ message: "No matching data found for the provided IP." });
        }

        // Return the data along with pagination details
        res.json({
            peers: peersResult.rows.map(peer => ({
                infoHash: peer.infohash,
                title: peer.title || "Unknown",  // Default to 'Unknown' if title is null
                ports: peer.ports,
                latestDiscoveredAt: peer.latestdiscoveredat,
            })),
            total: totalPeersResult.rows[0].count,  // Total number of peers matching the IP
            page: parseInt(page, 10),  // Current page
            limit: parseInt(limit, 10),  // Items per page
        });

    } catch (err) {
        console.error("Error fetching peer data:", err.message);
        res.status(500).json({ error: "Internal server error." });
    }
};