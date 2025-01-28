-- Drop existing tables if necessary (optional, for clean slate)
DROP TABLE IF EXISTS tracker_peers;
DROP TABLE IF EXISTS peers;
DROP TABLE IF EXISTS infohashes;

-- Create the 'infohashes' table with the 'files' field
CREATE TABLE IF NOT EXISTS infohashes (
    id SERIAL PRIMARY KEY,
    infoHash TEXT NOT NULL UNIQUE,
    title TEXT,
    files JSONB, -- Store file metadata here
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the 'peers' table
CREATE TABLE IF NOT EXISTS peers (
    id SERIAL PRIMARY KEY,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    infoHash TEXT NOT NULL,
    title TEXT,
    asn INTEGER,
    as_organization TEXT,
    country TEXT,
    city TEXT,
    latitude DOUBLE PRECISION, -- New field for latitude
    longitude DOUBLE PRECISION, -- New field for longitude
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (infoHash) REFERENCES infohashes(infoHash)
);

-- Create the 'tracker_peers' table
CREATE TABLE IF NOT EXISTS tracker_peers (
    infoHash TEXT NOT NULL,
    host TEXT NOT NULL,
    asn INTEGER,
    as_organization TEXT,
    country TEXT,
    city TEXT,
    latitude DOUBLE PRECISION, -- Host latitude
    longitude DOUBLE PRECISION, -- Host longitude
    tracker TEXT NOT NULL,
    seeders INTEGER,
    leechers INTEGER,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (infoHash, host, tracker),
    FOREIGN KEY (infoHash) REFERENCES infohashes(infoHash)
);

-- Indexes for optimization
CREATE INDEX idx_peers_host ON peers(host);
CREATE INDEX idx_peers_infohash ON peers(infoHash);
CREATE INDEX idx_peers_discovered_at ON peers(discovered_at);
CREATE INDEX idx_tracker_peers_infohash ON tracker_peers(infoHash);
CREATE INDEX idx_tracker_peers_discovered_at ON tracker_peers(discovered_at);