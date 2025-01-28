// services/databaseService.js

import pg from "pg";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { getASNReader, getCityReader, ensureGeoIPDatabases } from "./geoIPService.js"

await ensureGeoIPDatabases();
// Use the shared GeoIP readers
const cityReader = getCityReader();
const asnReader = getASNReader();



// Load environment variables from .env
dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10), // Port should be a number
});

/**
 * Acquire matched infohashes for a given IP address. 
 * @param {*} ip 
 * @param {*} limit 
 * @param {*} offset 
 * @returns 
 */
export const queryPeers = async (ip, limit, offset) => {
    try {
        const query = `
            SELECT 
                infoHash, 
                title, 
                ARRAY_AGG(DISTINCT port) AS ports, 
                MAX(discovered_at) AS latestDiscoveredAt
            FROM peers
            WHERE host = $1
            GROUP BY infoHash, title
            ORDER BY latestDiscoveredAt DESC
            LIMIT $2 OFFSET $3;
        `;
        console.log("Executing query:", query);
        console.log("Query parameters:", [ip, limit, offset]);

        const result = await pool.query(query, [ip, limit, offset]);
        console.log("Query result:", result.rows);

        return result.rows;
    } catch (err) {
        console.error("Error querying peers:", err.message);
        throw new Error("Database query failed.");
    }
};

/**
 * Query unique peers for a given host.
 * @param {string} host - The host to query.
 * @returns {Promise<Array>} - List of unique peers for the host.
 */
export const queryUniquePeers = async (host) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT infoHash, title, MAX(discovered_at) AS last_seen
            FROM peers
            WHERE host = $1
            GROUP BY infoHash, title
            ORDER BY last_seen DESC;
        `;
        const result = await client.query(query, [host]);
        return result.rows;
    } finally {
        client.release();
    }
};

/**
 * Query neighboring IP blocks for a given IP.
 * @param {string} ip - The IP address to query.
 * @returns {Promise<Array>} - List of neighboring IPs.
 */
export const queryNeighboringBlocks = async (ip) => {
    const client = await pool.connect();
    try {
        const query = `
            WITH input_block AS (
                SELECT
                    split_part($1, '.', 1) || '.' || 
                    split_part($1, '.', 2) || '.' || 
                    split_part($1, '.', 3) AS ip_block
            )
            SELECT DISTINCT host
            FROM peers
            WHERE host LIKE (SELECT ip_block || '.%' FROM input_block)
            AND host != $1
            ORDER BY host;
        `;
        const result = await client.query(query, [ip]);
        return result.rows;
    } finally {
        client.release();
    }
};

/**
 * Query all infohashes.
 * @returns {Promise<Array>} - List of all infohashes.
 */
export const queryInfohashes = async () => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT infohash AS "infoHash", title
            FROM infohashes
            ORDER BY discovered_at DESC;
        `;
        const result = await client.query(query);

        if (result.rows.length === 0) {
            logger.warn("No infohashes found in the database.");
        } else {
            logger.info(`QueryInfohashes Result: ${JSON.stringify(result.rows)}`);
        }

        return result.rows;
    } catch (error) {
        logger.error(`Error in queryInfohashes: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Save a new infohash into the database.
 * @param {string} infoHash - The infohash to save.
 * @param {string} title - The title of the infohash.
 * @returns {Promise<Object>} - The saved infohash record.
 */
export const saveInfohash = async (infoHash, title) => {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO infohashes (infoHash, title)
            VALUES ($1, $2)
            ON CONFLICT (infoHash) DO NOTHING
            RETURNING id, infoHash, title, discovered_at;
        `;
        const result = await client.query(query, [infoHash, title]);
        return result.rows[0];
    } finally {
        client.release();
    }
};

/**
 * Delete multiple infohashes from the database.
 * @param {Array<number>} ids - Array of infohash IDs to delete.
 * @returns {Promise<void>}
 */
export const deleteInfohashes = async (ids) => {
    const client = await pool.connect();
    try {
        // Start a transaction
        await client.query('BEGIN');

        // Fetch the infohashes associated with the given IDs
        const infohashResult = await client.query(
            'SELECT infoHash FROM infohashes WHERE id = ANY($1)',
            [ids]
        );
        const infohashes = infohashResult.rows.map((row) => row.infohash);

        if (infohashes.length > 0) {
            // Delete associated rows in the tracker_peers table
            await client.query('DELETE FROM tracker_peers WHERE infohash = ANY($1)', [infohashes]);

            // Delete associated rows in the peers table (if applicable)
            await client.query('DELETE FROM peers WHERE infohash = ANY($1)', [infohashes]);
        }

        // Delete the infohashes
        await client.query('DELETE FROM infohashes WHERE id = ANY($1)', [ids]);

        // Commit the transaction
        await client.query('COMMIT');
    } catch (error) {
        // Roll back the transaction in case of an error
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Query database statistics (infohashes, peers, etc.).
 * @returns {Promise<Object>} - Database statistics.
 */
export const queryDatabaseStats = async () => {
    const totalInfohashesQuery = `SELECT COUNT(*) AS total_infohashes FROM infohashes;`;
    const totalPeersQuery = `
        SELECT 
            (SELECT COUNT(*) FROM peers) + 
            (SELECT COUNT(*) FROM tracker_peers) AS total_peers;
    `;
    const mostRecentPeerQuery = `
        SELECT MAX(discovered_at) AS most_recent_peer 
        FROM (
            SELECT discovered_at FROM peers
            UNION ALL
            SELECT discovered_at FROM tracker_peers
        ) AS combined;
    `;
    const databaseSizeQuery = `SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;`;

    const client = await pool.connect();
    try {
        const [totalInfohashesResult, totalPeersResult, mostRecentPeerResult, databaseSizeResult] = await Promise.all([
            client.query(totalInfohashesQuery),
            client.query(totalPeersQuery),
            client.query(mostRecentPeerQuery),
            client.query(databaseSizeQuery),
        ]);

        return {
            totalInfohashes: parseInt(totalInfohashesResult.rows[0].total_infohashes, 10),
            totalPeers: parseInt(totalPeersResult.rows[0].total_peers, 10),
            mostRecentPeer: mostRecentPeerResult.rows[0].most_recent_peer,
            databaseSize: databaseSizeResult.rows[0].database_size,
        };
    } finally {
        client.release();
    }
};

/**
 * 
 * Query top matched infohashes for a given IP for the /en/stats page on the frontend
 * @param {*} ip 
 * @returns 
 */

export const queryTopMatchedInfohashes = async () => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT host, COUNT(DISTINCT infoHash) AS unique_infohashes
            FROM peers
            GROUP BY host
            ORDER BY unique_infohashes DESC
            LIMIT 10;
        `;
        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
    }
};


export const queryTopInfohashes = async () => {
    const query = `
        SELECT infoHash, title, COUNT(*) AS peer_count
        FROM peers
        GROUP BY infoHash, title
        ORDER BY peer_count DESC
        LIMIT 10;
    `;
    const client = await pool.connect();
    try {
        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
    }
};

/**
 * Save tracker-based peer data to the tracker_peers table and update infohashes table.
 * @param {string} infoHash - InfoHash of the torrent.
 * @param {Object} trackerData - Tracker data with seeders, leechers, and peers.
 * @param {Object} metadata - Torrent metadata (name and files).
 */
export const saveTrackerData = async (infoHash, trackerData, metadata) => {
    const client = await pool.connect();

    try {
        // Save or update the infohashes table
        const updateInfohashQuery = `
            INSERT INTO infohashes (infoHash, title, files, discovered_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (infoHash)
            DO UPDATE SET 
                files = COALESCE(infohashes.files, EXCLUDED.files),
                title = COALESCE(infohashes.title, EXCLUDED.title),
                discovered_at = CURRENT_TIMESTAMP;
        `;
        await client.query(updateInfohashQuery, [
            infoHash,
            metadata?.name || null, // Torrent title
            JSON.stringify(metadata?.files || []), // Torrent files
        ]);

        const queries = [];

        // Iterate over each tracker and its associated data
        for (const [trackerUrl, data] of Object.entries(trackerData)) {
            const { peers = [], seeders = 0, leechers = 0 } = data;

            for (const peer of peers) {
                const [host, port] = peer.split(":");

                // Resolve GeoIP and ASN data
                let city = null,
                    country = null,
                    asn = null,
                    asOrganization = null,
                    latitude = null,
                    longitude = null;

                try {
                    const geoCity = cityReader.city(host);
                    city = geoCity.city?.names?.en || null;
                    country = geoCity.country?.isoCode || null;
                    latitude = geoCity.location?.latitude || null;
                    longitude = geoCity.location?.longitude || null;
                } catch (error) {
                    logger.warn(`GeoIP City lookup failed for ${host}: ${error.message}`);
                }

                try {
                    const geoAsn = asnReader.asn(host);
                    asn = geoAsn.autonomousSystemNumber || null;
                    asOrganization = geoAsn.autonomousSystemOrganization || null;
                } catch (error) {
                    logger.warn(`GeoIP ASN lookup failed for ${host}: ${error.message}`);
                }

                // Prepare the query for tracker_peers
                const query = `
                    INSERT INTO tracker_peers (
                        infoHash, host, asn, as_organization, country, city, latitude, longitude, tracker, seeders, leechers, discovered_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
                    ON CONFLICT (infoHash, host, tracker) DO NOTHING;
                `;
                queries.push(
                    client.query(query, [
                        infoHash,       // Torrent infoHash
                        host,           // Peer host
                        asn,            // ASN number
                        asOrganization, // ASN organization name
                        country,        // Country ISO code
                        city,           // City name
                        latitude,       // Latitude
                        longitude,      // Longitude
                        trackerUrl,     // Tracker URL
                        seeders,        // Number of seeders
                        leechers,       // Number of leechers
                    ])
                );
            }
        }

        // Execute all queries
        await Promise.all(queries);
        logger.info(`Tracker data successfully saved for infoHash ${infoHash}`);
    } catch (error) {
        logger.error(`Error saving tracker data for infoHash ${infoHash}: ${error.message}`);
    } finally {
        client.release();
    }
};

/**
 * Save peer data to the peers table.
 * @param {Object} param0 - Peer data object.
 */
export const savePeerData = async ({ host, port, infoHash, title }) => {
    const client = await pool.connect();
    try {
        // Initialize variables for GeoIP data
        let city = null,
            country = null,
            asn = null,
            asOrganization = null,
            latitude = null,
            longitude = null;

        // Resolve GeoIP City data
        try {
            const geoCity = cityReader.city(host);
            city = geoCity.city?.names?.en || null; // Get city name in English
            country = geoCity.country?.isoCode || null; // Get country ISO code
            latitude = geoCity.location?.latitude || null; // Get latitude
            longitude = geoCity.location?.longitude || null; // Get longitude
        } catch (error) {
            logger.warn(`GeoIP City lookup failed for ${host}: ${error.message}`);
        }

        // Resolve GeoIP ASN data
        try {
            const geoAsn = asnReader.asn(host);
            asn = geoAsn.autonomousSystemNumber || null; // Get ASN number
            asOrganization = geoAsn.autonomousSystemOrganization || null; // Get ASN organization
        } catch (error) {
            logger.warn(`GeoIP ASN lookup failed for ${host}: ${error.message}`);
        }

        // Insert peer data into the `peers` table
        const query = `
            INSERT INTO peers (host, port, infoHash, title, asn, as_organization, country, city, latitude, longitude, discovered_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        `;
        await client.query(query, [
            host,           // Peer IP address
            port,           // Peer port number
            infoHash,       // Torrent infoHash
            title,          // Torrent title
            asn,            // ASN number
            asOrganization, // ASN organization name
            country,        // Country ISO code
            city,           // City name
            latitude,       // Latitude
            longitude,      // Longitude
        ]);

        logger.info(`Saved peer: ${host}:${port} for infoHash ${infoHash}`);
    } catch (error) {
        logger.error(`Error saving peer to database: ${error.message}`);
    } finally {
        // Release the database connection back to the pool
        client.release();
    }
};
/**
 * Get the total number of peers for a given IP.
 * @param {string} ip - The IP address to query.
 * @returns {Promise<number>} - Total number of peers for the IP.
 */
export const getTotalPeers = async (ip) => {
    try {
        const query = `
            SELECT COUNT(*) AS total
            FROM peers
            WHERE host = $1;
        `;
        const result = await pool.query(query, [ip]);
        return parseInt(result.rows[0]?.total || 0, 10);
    } catch (err) {
        console.error("Error querying total peers:", err.message);
        throw new Error("Database query failed.");
    }
};

/**
 * Query the total number of peers for a given IP with grouping logic.
 * @param {string} ip - The IP address to filter peers.
 * @returns {Promise<number>} - Total number of grouped peers.
 */
export const queryDatabaseTotalPeers = async (ip) => {
    const totalPeersQuery = `
        SELECT COUNT(*) AS total
        FROM (
            SELECT infoHash
            FROM peers
            WHERE host = $1
            GROUP BY infoHash, title
        ) AS subquery;
    `;

    const client = await pool.connect();
    try {
        const result = await client.query(totalPeersQuery, [ip]);
        return parseInt(result.rows[0].total, 10) || 0; // Return the total or 0 if undefined
    } finally {
        client.release();
    }
};