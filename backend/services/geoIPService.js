import { Reader } from "@maxmind/geoip2-node";
import path from "path";
import logger from "../utils/logger.js";

const GEOIP_CITY_DB = path.resolve("./Geo-ASN-Databases/GeoLite2-City.mmdb");
const GEOIP_ASN_DB = path.resolve("./Geo-ASN-Databases/GeoLite2-ASN.mmdb");

let cityReader = null;
let asnReader = null;

export const ensureGeoIPDatabases = async () => {
    try {
        cityReader = await Reader.open(GEOIP_CITY_DB);
        asnReader = await Reader.open(GEOIP_ASN_DB);
        logger.info("GeoIP databases loaded successfully.");
    } catch (error) {
        logger.error(`Failed to load GeoIP databases: ${error.message}`);
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