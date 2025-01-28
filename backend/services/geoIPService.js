import { Reader } from "@maxmind/geoip2-node";
import path from "path";
import fs from "fs/promises";
import axios from "axios";
import zlib from "zlib";
import { promisify } from "util";
import logger from "../utils/logger.js";

const GEOIP_CITY_DB = path.resolve("./Geo-ASN-Databases/GeoLite2-City.mmdb");
const GEOIP_ASN_DB = path.resolve("./Geo-ASN-Databases/GeoLite2-ASN.mmdb");
const GEOIP_CITY_URL = "https://cdn.jsdelivr.net/npm/geolite2-city/GeoLite2-City.mmdb.gz";
const GEOIP_ASN_URL = "https://cdn.jsdelivr.net/npm/geolite2-asn/GeoLite2-ASN.mmdb.gz";

const decompress = promisify(zlib.gunzip);

let cityReader = null;
let asnReader = null;

// Utility function to download and extract the ASN and geoIP maximind databases
const downloadAndExtract = async (url, filePath) => {
    try {
        logger.info(`Downloading GeoIP database from ${url}...`);
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const decompressedData = await decompress(response.data);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, decompressedData);
        logger.info(`Database saved to ${filePath}.`);
    } catch (error) {
        logger.error(`Failed to download or extract GeoIP database from ${url}: ${error.message}`);
        throw error;
    }
};

export const ensureGeoIPDatabases = async () => {
    try {
        // Ensure City database exists
        try {
            await fs.access(GEOIP_CITY_DB);
        } catch {
            await downloadAndExtract(GEOIP_CITY_URL, GEOIP_CITY_DB);
        }

        // Ensure ASN database exists
        try {
            await fs.access(GEOIP_ASN_DB);
        } catch {
            await downloadAndExtract(GEOIP_ASN_URL, GEOIP_ASN_DB);
        }

        // Load the databases
        cityReader = await Reader.open(GEOIP_CITY_DB);
        asnReader = await Reader.open(GEOIP_ASN_DB);
        logger.info("GeoIP databases loaded successfully.");
    } catch (error) {
        logger.error(`Failed to ensure GeoIP databases: ${error.message}`);
        process.exit(1); // Exit the process if databases cannot be loaded
    }
};

export const getCityReader = () => {
    if (!cityReader) {
        throw new Error("CityReader is not initialized. Call ensureGeoIPDatabases first.");
    }
    return cityReader;
};

export const getASNReader = () => {
    if (!asnReader) {
        throw new Error("ASNReader is not initialized. Call ensureGeoIPDatabases first.");
    }
    return asnReader;
};