import logger from "../utils/logger.js";
import DHT from "bittorrent-dht";
import { performance } from "perf_hooks";
import fs from "fs";
import { promises as fsPromises } from "fs";

import axios from "axios";
import path from "path";

import { pool, queryInfohashes, saveTrackerData, savePeerData } from "./databaseService.js";
import Client from "bittorrent-tracker";
import https from "https";
import { stats } from "../routes/probeRoutes.js";
import WebTorrent from "webtorrent";
import { getASNReader, getCityReader, ensureGeoIPDatabases } from "./geoIPService.js"
let dhtInstances = [];

await ensureGeoIPDatabases();
// Use the shared GeoIP readers
const cityReader = getCityReader();
const asnReader = getASNReader();




const fetchMetadata = (infoHash, trackers) => {
    return new Promise((resolve, reject) => {
        const client = new WebTorrent();

        const magnetURI = `magnet:?xt=urn:btih:${infoHash}&${trackers
            .map((tracker) => `tr=${encodeURIComponent(tracker)}`)
            .join("&")}`;

        client.add(magnetURI, { announce: trackers }, (torrent) => {
            const metadata = {
                name: torrent.name,
                files: torrent.files.map((file) => file.name),
            };
            client.destroy(); // Clean up the WebTorrent client
            resolve(metadata);
        });

        client.on("error", (err) => {
            logger.error(`[METADATA ERROR] Error fetching metadata for ${infoHash}: ${err.message}`);
            reject(err);
        });
    });
};




// Fetch public tracker list dynamically
const fetchTrackers = async () => {
    return new Promise((resolve, reject) => {
        https.get("https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt", (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                const fetchedTrackers = data.split("\n").filter((line) => line.trim());
                const additionalTrackers = [
                    "udp://glotorrents.pw:6969/announce",
                    "udp://torrent.gresille.org:80/announce",
                    "udp://tracker.openbittorrent.com:80",
                    "udp://tracker.coppersurfer.tk:6969",
                    "udp://tracker.leechers-paradise.org:6969",
                    "udp://p4p.arenabg.ch:1337",
                    "udp://tracker.internetwarriors.net:1337"
                ];

                // Combine fetched trackers with the additional ones
                const allTrackers = [...new Set([...fetchedTrackers, ...additionalTrackers])];

                resolve(allTrackers);
            });
            res.on("error", reject);
        });
    });
};

// Query trackers
const queryTrackers = async (infoHash) => {
    if (!infoHash) {
        logger.error("queryTrackers called with invalid infoHash.");
        throw new Error("Invalid infoHash received for tracker query.");
    }

    const announce = await fetchTrackers();
    const peerId = Buffer.from(`-TH0100-${Math.random().toString(36).slice(2, 14).padStart(12, "0")}`);
    const port = 6881;

    return new Promise((resolve, reject) => {
        const client = new Client({ infoHash: Buffer.from(infoHash, "hex"), peerId, announce, port });
        const trackerResponses = {};

        client.on("update", (data) => {
            trackerResponses[data.announce] = { seeders: data.complete, leechers: data.incomplete, peers: [] };
        });

        client.on("peer", (addr) => {
            for (const tracker in trackerResponses) {
                trackerResponses[tracker].peers.push(addr);
            }
        });

        client.on("error", (err) => {
            logger.error(`Tracker client error for infoHash ${infoHash}: ${err.message}`);
            reject(err);
        });

        client.start();

        setTimeout(() => {
            client.stop();
            resolve(trackerResponses);
        }, 15000);
    });
};
export const startProbeSession = async (workers = 4, maxListeners = 60, pipelines = []) => {
    if (stats.running) {
        logger.warn("Probe session is already running.");
        return;
    }

    stats.running = true;
    stats.sessionStartTime = performance.now();
    stats.hashesProcessed = 0; // Reset stats
    stats.matchesFound = 0;

    const restartProbes = async () => {
        logger.info("Waiting 10 minutes before restarting probes...");
        await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000)); // 10-minute delay

        if (stats.running) {
            logger.info("Restarting probes...");
            await startProbeSession(workers, maxListeners, pipelines);
        }
    };

    if (pipelines.includes("DHT Crawl")) {
        dhtInstances = Array.from({ length: workers }, () => {
            const dht = new DHT();
            dht.setMaxListeners(maxListeners);
            dht.listen();
            return dht;
        });

        await performDHTLookups();
        if (stats.running) await restartProbes();
    }

    if (pipelines.includes("Query Trackers")) {
        await performTrackerQueries();
        if (stats.running) await restartProbes();
    }
};

const performTrackerQueries = async () => {
    try {
        const infoHashes = await queryInfohashes();

        if (!infoHashes || infoHashes.length === 0) {
            logger.warn("No infoHashes found for tracker queries.");
            return;
        }

        logger.info(`Starting tracker queries for ${infoHashes.length} infoHashes...`);

        const taskQueue = infoHashes.map(async (infoHashEntry) => {
            const { infoHash, title } = infoHashEntry;

            if (!infoHash || typeof infoHash !== "string" || infoHash.trim().length === 0) {
                logger.warn(`Invalid infoHash detected. Title: ${title}, infoHash: ${infoHash}`);
                return;
            }

            try {
                logger.info(`Querying trackers for infoHash: ${infoHash}`);

                const trackerData = await queryTrackers(infoHash);

                const trackers = Object.keys(trackerData);

                let metadata = null;
                if (trackers.length > 0) {
                    try {
                        metadata = await fetchMetadata(infoHash, trackers);
                        logger.info(`Metadata fetched for infoHash ${infoHash}: ${metadata.name}`);
                    } catch (metadataError) {
                        logger.warn(`Failed to fetch metadata for infoHash ${infoHash}: ${metadataError.message}`);
                    }
                }

                await saveTrackerData(infoHash, trackerData, metadata);
                logger.info(`Tracker data saved for infoHash ${infoHash}`);
            } catch (queryError) {
                logger.error(`Error querying trackers for infoHash ${infoHash}: ${queryError.message}`);
            }
        });

        await Promise.all(taskQueue);

        logger.info("Tracker queries completed.");
    } catch (error) {
        logger.error(`Error during tracker queries: ${error.message}`);
    }
};

const performDHTLookups = async () => {
    try {
        const { rows: infoHashes } = await pool.query(`
            SELECT infohash AS "infoHash", title FROM infohashes ORDER BY discovered_at DESC;
        `);

        if (!infoHashes || infoHashes.length === 0) {
            logger.warn("No infoHashes found for DHT lookups.");
            return;
        }

        logger.info(`Starting DHT lookups for ${infoHashes.length} infoHashes...`);

        const taskQueue = infoHashes.map(({ infoHash, title }) => {
            if (!infoHash || typeof infoHash !== "string") {
                logger.warn(`Invalid infoHash detected. Title: ${title}, infoHash: ${infoHash}`);
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                const dhtInstance = dhtInstances[Math.floor(Math.random() * dhtInstances.length)];
                const buffer = Buffer.from(infoHash, "hex");

                const onPeer = async (peer) => {
                    try {
                        const { host, port } = peer;
                        if (!host || !port) return;
                
                        let geoData = { city: null, country: null, asn: null };
                
                        // Lookup city and country data
                        try {
                            const cityData = cityReader.city(host);
                            geoData.city = cityData.city?.names?.en || null;
                            geoData.country = cityData.country?.names?.en || null;
                        } catch (error) {
                            logger.warn(`City lookup failed for IP ${host}: ${error.message}`);
                        }
                
                        // Lookup ASN data
                        try {
                            const asnData = asnReader.asn(host);
                            geoData.asn = asnData.autonomous_system_organization || null;
                        } catch (error) {
                            logger.warn(`ASN lookup failed for IP ${host}: ${error.message}`);
                        }
                
                        // Save peer data with GeoIP information
                        await savePeerData({
                            host,
                            port,
                            infoHash,
                            title,
                            city: geoData.city,
                            country: geoData.country,
                            asn: geoData.asn,
                        });
                
                        stats.matchesFound++;
                    } catch (error) {
                        logger.error(`Error saving peer for infoHash ${infoHash}: ${error.message}`);
                    }
                };

                dhtInstance.on("peer", onPeer);
                dhtInstance.lookup(buffer, () => {
                    dhtInstance.removeListener("peer", onPeer);
                    stats.hashesProcessed++;
                    resolve();
                });
            });
        });

        await Promise.all(taskQueue);
        logger.info("DHT lookups completed.");
    } catch (error) {
        logger.error(`Error during DHT lookups: ${error.message}`);
    }
};

export const stopProbeSession = () => {
    stats.running = false;
    stats.sessionStartTime = null;
    dhtInstances.forEach((dht) => dht.destroy());
    dhtInstances = [];
    logger.info("Probe session stopped.");
};