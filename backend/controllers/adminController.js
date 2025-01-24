import { pool } from '../services/databaseService.js';
import archiver from 'archiver';
import { to } from 'pg-copy-streams';

/**
 * Prune the tracker_peers and peers tables.
 */
export const prunePeers = async (req, res) => {
    try {
        const client = await pool.connect();

        // Prune the peers table
        await client.query('TRUNCATE TABLE peers RESTART IDENTITY;');
        console.log('Peers table has been pruned.');

        // Prune the tracker_peers table
        await client.query('TRUNCATE TABLE tracker_peers RESTART IDENTITY;');
        console.log('Tracker peers table has been pruned.');

        client.release();

        res.status(200).json({ message: 'Peers and tracker_peers tables have been successfully pruned.' });
    } catch (err) {
        console.error('Error pruning tables:', err.message);
        res.status(500).json({ error: 'Internal server error while pruning tables.' });
    }
};

/**
 * Create a backup of database tables and return as a downloadable ZIP.
 */
export const backupDatabase = async (req, res) => {
    try {
        const client = await pool.connect();

        // Create an in-memory ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Set response headers
        res.setHeader('Content-Disposition', `attachment; filename=backup_${Date.now()}.zip`);
        res.setHeader('Content-Type', 'application/zip');

        // Pipe the archive directly to the HTTP response
        archive.pipe(res);

        const tables = ['infohashes', 'peers']; // Add more tables if needed

        for (const table of tables) {
            // Determine if escaping is needed based on the table
            const copyCommand =
                table === 'infohashes'
                    ? `COPY ${table} TO STDOUT WITH CSV HEADER QUOTE '"' ESCAPE '"'`
                    : `COPY ${table} TO STDOUT WITH CSV HEADER`;

            // Use pg-copy-streams `to` function
            const queryStream = client.query(to(copyCommand));
            archive.append(queryStream, { name: `${table}.csv` });

            // Wait for each table's stream to finish
            await new Promise((resolve, reject) => {
                queryStream.on('end', resolve);
                queryStream.on('error', reject);
            });
        }

        await archive.finalize(); // Finalize the ZIP archive
        client.release();
    } catch (err) {
        console.error('Error creating database backup:', err.message);
        res.status(500).json({ error: 'Internal server error while creating backup.' });
    }
};

export const backupOnlyInfohashesDatabase = async (req, res) => {
    console.log("Backup endpoint hit");
    try {
        const client = await pool.connect();

        // Create an in-memory ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Set response headers
        res.setHeader('Content-Disposition', `attachment; filename=infohashes_backup_${Date.now()}.zip`);
        res.setHeader('Content-Type', 'application/zip');

        // Pipe the archive directly to the HTTP response
        archive.pipe(res);

        const tables = ['infohashes']; // Add more tables if needed

        for (const table of tables) {
            // Modify the COPY command to use CSV format with quote escaping
            const queryStream = client.query(
                to(`COPY ${table} TO STDOUT WITH CSV HEADER QUOTE '"' ESCAPE '"'`)
            );
            archive.append(queryStream, { name: `${table}.csv` });

            // Wait for each table's stream to finish
            await new Promise((resolve, reject) => {
                queryStream.on('end', resolve);
                queryStream.on('error', reject);
            });
        }

        await archive.finalize(); // Finalize the ZIP archive
        client.release();
    } catch (err) {
        console.error('Error creating database backup:', err.message);
        res.status(500).json({ error: 'Internal server error while creating backup.' });
    }
};