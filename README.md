# Torrent Tracker WebUI
<center>*a Bittorrent data collection project for infosec and highly active torrent peers*</center>

## Overview 🌐

This project is designed to track torrents across the Bittorrent Distributed Hash Table (DHT) network and identify associations between peers (hosts) participating in the same torrent. The application logs metadata and peer information as part of a probe, either via torrent trackers or through DHT crawling.

By leveraging DHT and tracker data, this tool allows for the analysis of torrent activity, metadata relationships, and peer geographical or network associations. 🤓

---

## Features 🛠️

### 1. **Torrent Metadata Tracking** 📁🗂️

- Collects and stores torrent metadata (e.g., title, file list) using the `infoHash` as the unique identifier.
- Updates metadata dynamically when new information becomes available.

### 2. **Peer Data Collection** 👥

- Gathers information about peers participating in torrents, including:
  - **IP address**
  - **Port number**
  - **GeoIP data** (city, country, ASN, organization)
- Associates peers with specific torrents and trackers. 

### 3. **Tracker Probes** 📡

- Periodically queries torrent trackers to:
  - Retrieve peer lists.
  - Count seeders and leechers.

### 4. **DHT Crawling** 🧭

- Crawls the DHT network to:
  - Discover peers for specific torrents.
  - Log associations between peers and torrents. 

### 5. **Efficient Database Storage** 📦

- Metadata is stored in the `infohashes` table.
- Peer and tracker-specific data are logged in separate tables for optimized querying and reduced redundancy. 

### 6. **Logging and Error Handling** ❗

- Tracks errors during metadata fetch, GeoIP resolution, or database operations.
- Logs successful operations for analysis and debugging.

---

## Database Table Structure 🗄️

### 1. `infohashes` 📁🔑

Stores metadata about torrents.

| Column          | Type        | Description                     |
| --------------- | ----------- | ------------------------------- |
| `id`            | `SERIAL`    | Primary key.                    |
| `infoHash`      | `TEXT`      | Unique torrent identifier.      |
| `title`         | `TEXT`      | Torrent title.                  |
| `files`         | `JSONB`     | List of files in the torrent.   |
| `discovered_at` | `TIMESTAMP` | Time the metadata was recorded. |

### 2. `peers` 🌍📍👤

Stores information about individual peers.

| Column            | Type        | Description                     |
| ----------------- | ----------- | ------------------------------- |
| `id`              | `SERIAL`    | Primary key.                    |
| `host`            | `TEXT`      | Peer IP address.                |
| `port`            | `INTEGER`   | Peer port number.               |
| `infoHash`        | `TEXT`      | Associated torrent infoHash.    |
| `asn`             | `INTEGER`   | Autonomous System Number (ASN). |
| `as_organization` | `TEXT`      | ASN organization name.          |
| `country`         | `TEXT`      | Country ISO code.               |
| `city`            | `TEXT`      | City name.                      |
| `discovered_at`   | `TIMESTAMP` | Time the peer was recorded.     |

### 3. `tracker_peers` 📡🔗📊

Logs tracker and torrent-specific data.

| Column            | Type        | Description                     |
| ----------------- | ----------- | ------------------------------- |
| `infoHash`        | `TEXT`      | Associated torrent infoHash.    |
| `host`            | `TEXT`      | Peer IP address.                |
| `asn`             | `INTEGER`   | Autonomous System Number (ASN). |
| `as_organization` | `TEXT`      | ASN organization name.          |
| `country`         | `TEXT`      | Country ISO code.               |
| `city`            | `TEXT`      | City name.                      |
| `tracker`         | `TEXT`      | Tracker URL.                    |
| `seeders`         | `INTEGER`   | Seeder count.                   |
| `leechers`        | `INTEGER`   | Leecher count.                  |
| `discovered_at`   | `TIMESTAMP` | Time the data was recorded.     |

---

## Setup 🛠️⚙️💾

### Install Prerequisites 🔧

- Docker
- Shell

### Installation 🐳🔧📦

#### Docker Installation 

1. Clone this repository:

   ```bash
   git clone https://github.com/https://github.com/JakeTurner616/Torrent-Tracker-WebUI
   cd torrent-tracker-dht-analyzer
   ```
2. Set admin password and auth secret via the compose file:

   ```docker-compose
      AUTH_TOKEN: your-secret-token-for-authentication
      DB_USER: your_user
      DB_HOST: database # Docker network
      DB_DATABASE: dht_nodes # Docker network
      DB_PASSWORD: your_password
   ```

3. Build and run the Docker container:

   ```bash
   docker-compose up --build -d
   ```

4. The webUI will be available at:

   ```
   http://localhost:80
   ```

5. Stop the container when done:

   ```bash
   docker-compose down
   ```

---

## License ⚖️

This project is licensed under the GNU GPL 3.0 [LICENSE](https://github.com/https://github.com/JakeTurner616/Torrent-Tracker-WebUI/LICENSE).

---

