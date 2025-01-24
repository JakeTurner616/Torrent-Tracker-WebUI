import { queryPeers , saveInfohash, deleteInfohashes, queryTopMatchedInfohashes, queryTopInfohashes  } from "../services/databaseService.js";
import { pool } from "../services/databaseService.js";
import { parseMagnetLink } from "../utils/magnetUtils.js"; // Assume you have a utility function to parse magnet links
import multer from "multer";
import parseTorrent from "parse-torrent";
import csvParser from 'csv-parser'; // for parsing CSV files duh
import AdmZip from 'adm-zip'; // for creating ZIP archives in memory obviously
import { Readable } from 'stream';

const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory


export const getInfohashes = async (req, res) => {
    const { ip } = req.query; // Use query parameter for IP
    if (!ip) {
        return res.status(400).json({ error: "IP address is required as a query parameter." });
    }

    try {
        const infohashes = await queryPeers(ip); // Fetch infohashes for the given IP
        if (!infohashes || infohashes.length === 0) {
            return res.status(404).json({ error: "No infohashes found for the provided IP address." });
        }
        res.json(infohashes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addInfohash = async (req, res) => {
    try {
        const { infoHash, title } = req.body;
        if (!infoHash || !title) {
            return res.status(400).json({ error: "infoHash and title are required." });
        }

        const savedInfohash = await saveInfohash(infoHash, title);
        if (!savedInfohash) {
            return res.status(400).json({ error: "Infohash could not be saved or already exists." });
        }
        res.status(201).json(savedInfohash);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const removeInfohashes = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "An array of IDs is required to delete infohashes." });
        }

        await deleteInfohashes(ids);
        res.json({ message: "Infohashes deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getTopMatchedInfohashes = async (req, res) => {
    try {
        const topMatchedInfohashes = await queryTopMatchedInfohashes();
        if (!topMatchedInfohashes || topMatchedInfohashes.length === 0) {
            return res.status(404).json({ error: "No matched infohashes found." });
        }
        res.json(topMatchedInfohashes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTopInfohashes = async (req, res) => {
    try {
        const topInfohashes = await queryTopInfohashes();
        if (!topInfohashes || topInfohashes.length === 0) {
            return res.status(404).json({ error: "No top infohashes found." });
        }
        res.json(topInfohashes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getInfohashData = async (req, res) => {
    const { infohash } = req.params;
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided

    // Validate page and limit
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ message: "Invalid page or limit parameters." });
    }

    const offset = (pageNum - 1) * limitNum;

    try {
        const client = await pool.connect();

        // Query the title associated with the infohash
        const titleQuery = `
            SELECT title
            FROM infohashes
            WHERE infoHash = $1;
        `;
        const titleResult = await client.query(titleQuery, [infohash]);

        if (titleResult.rowCount === 0) {
            client.release();
            return res.status(404).json({ message: "Infohash not found." });
        }

        const title = titleResult.rows[0].title;

        // Query peers associated with the infohash with pagination
        const peersQuery = `
            SELECT host, port, discovered_at
            FROM peers
            WHERE infoHash = $1
            ORDER BY discovered_at DESC
            LIMIT $2 OFFSET $3;
        `;
        const peersResult = await client.query(peersQuery, [infohash, limitNum, offset]);

        // Query the total number of peers for pagination
        const totalPeersQuery = `
            SELECT COUNT(*) AS count
            FROM peers
            WHERE infoHash = $1;
        `;
        const totalPeersResult = await client.query(totalPeersQuery, [infohash]);

        client.release();

        // Calculate total pages
        const totalPeers = parseInt(totalPeersResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalPeers / limitNum);

        // Send the response
        res.json({
            title,
            peers: peersResult.rows,
            pagination: {
                totalPeers,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
            },
        });
    } catch (err) {
        console.error("Error fetching infohash data:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// Fetch all infohashes
export const getAllInfohashes = async (req, res) => {
    try {
        const client = await pool.connect();
        const query = `
            SELECT id, infoHash, title, discovered_at
            FROM infohashes
            ORDER BY discovered_at DESC;
        `;
        const result = await client.query(query);
        client.release();

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching infohashes:", err.message);
        res.status(500).json({ error: "Failed to fetch infohashes." });
    }
};

// Endpoint to handle .torrent file and magnet link submissions
// Endpoint to handle .torrent file and magnet link submissions

export const uploadTorrent = async (req, res) => {
    try {
        let infoHash, title;

        // Handle .torrent file upload
        if (req.file && req.file.buffer) {
            try {
                console.log("Uploaded file buffer:", req.file.buffer);

                // Parse the .torrent file buffer
                const torrentData = await parseTorrent(req.file.buffer); // Await is necessary here
                console.log("Parsed torrent data:", torrentData);

                infoHash = torrentData.infoHash;
                title = torrentData.name || `Torrent (${infoHash.slice(0, 10)}...)`;

                if (!infoHash || !title) {
                    throw new Error("Invalid .torrent file data.");
                }
            } catch (err) {
                console.error("Error parsing .torrent file:", err.message);
                return res.status(400).json({ error: "Invalid .torrent file." });
            }
        }

        // Handle magnet link submission
        if (req.body.magnetLink) {
            try {
                console.log("Parsing magnet link:", req.body.magnetLink);

                // Parse the magnet link asynchronously
                const magnetData = await parseTorrent(req.body.magnetLink); // Await here as well
                console.log("Parsed magnet link data:", magnetData);

                infoHash = magnetData.infoHash;
                title = magnetData.name || `Magnet (${infoHash.slice(0, 10)}...)`;

                if (!infoHash || !title) {
                    throw new Error("Invalid magnet link data.");
                }
            } catch (err) {
                console.error("Error parsing magnet link:", err.message);
                return res.status(400).json({ error: "Invalid magnet link." });
            }
        }

        // Ensure either a file or a magnet link was processed
        if (!infoHash || !title) {
            return res.status(400).json({ error: "No valid .torrent file or magnet link provided." });
        }

        // Save to the database
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO infohashes (infoHash, title)
                VALUES ($1, $2)
                ON CONFLICT (infoHash) DO NOTHING
                RETURNING id, infoHash, title, discovered_at;
            `;
            const result = await client.query(query, [infoHash, title]);
            const savedInfohash = result.rows[0] || { infoHash, title }; // Handle "no insert" cases
            res.status(200).json(savedInfohash);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error processing upload:", err.message);
        res.status(500).json({ error: err.message });
    }
};
export const uploadCsvToDatabase = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { table } = req.params;
        if (!table || !['infohashes', 'peers'].includes(table)) {
            return res.status(400).json({ error: 'Invalid or missing table name' });
        }

        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();
        const csvFile = zipEntries.find((entry) => entry.entryName.endsWith('.csv'));

        if (!csvFile) {
            return res.status(400).json({ error: 'No CSV file found in the uploaded ZIP archive' });
        }

        const csvContent = csvFile.getData().toString('utf-8');
        const csvStream = Readable.from(csvContent);

        const rows = [];
        csvStream
            .pipe(
                csvParser({
                    headers: ['id', 'infoHash', 'title', 'discovered_at'], // Explicitly define headers
                    skipLines: 1, // Skip the header line in the file
                })
            )
            .on('data', (row) => {
                console.log('Parsed Row:', row);

                // Validate required fields
                if (
                    (table === 'infohashes' && (!row.infoHash || !row.title || !row.discovered_at)) ||
                    (table === 'peers' && (!row.peer_id || !row.host || !row.port || !row.discovered_at))
                ) {
                    console.warn('Skipping invalid row:', row);
                    return;
                }

                rows.push(row);
            })
            .on('end', async () => {
                const client = await pool.connect();

                try {
                    const insertQuery =
                        table === 'infohashes'
                            ? `INSERT INTO infohashes (infoHash, title, discovered_at) VALUES ($1, $2, $3) ON CONFLICT (infoHash) DO NOTHING`
                            : `INSERT INTO peers (peer_id, host, port, discovered_at) VALUES ($1, $2, $3, $4) ON CONFLICT (peer_id) DO NOTHING`;

                    const insertPromises = rows.map((row) => {
                        const values =
                            table === 'infohashes'
                                ? [row.infoHash, row.title, row.discovered_at]
                                : [row.peer_id, row.host, row.port, row.discovered_at];
                        return client.query(insertQuery, values);
                    });

                    await Promise.all(insertPromises);
                    res.status(200).json({ message: `Successfully imported ${rows.length} rows into ${table}` });
                } catch (err) {
                    console.error('Error inserting data:', err.message);
                    res.status(500).json({ error: 'Failed to import data into the database' });
                } finally {
                    client.release();
                }
            })
            .on('error', (err) => {
                console.error('Error parsing CSV:', err.message);
                res.status(400).json({ error: 'Invalid CSV format' });
            });
    } catch (err) {
        console.error('Error handling CSV upload:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
