import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-tooltip/dist/react-tooltip.css"; // Import tooltip styles

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DHTManager = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [workers, setWorkers] = useState(4);
    const [maxListeners, setMaxListeners] = useState(120);
    const [selectedPipelines, setSelectedPipelines] = useState(["DHT Crawl"]);
    const pipelineOptions = [
        { name: "DHT Crawl", description: "Crawls the distributed hash table for peers." },
        { name: "Query Trackers", description: "Queries torrent trackers for peers." },
    ];

    const [stats, setStats] = useState({
        hashesPerSecond: 0,
        elapsedTime: 0,
        matches: 0,
    });
    const [hashrateData, setHashrateData] = useState({ labels: [], datasets: [] });
    const [matchesData, setMatchesData] = useState({ labels: [], datasets: [] });
    const [errorMessage, setErrorMessage] = useState("");

    const fetchStats = async () => {
        try {
            const response = await axios.get("http://localhost:3005/api/probe/status");
            const data = response.data;

            if (data.running) {
                const { hashesPerSecond, elapsedTime, matches } = data;

                setStats({
                    hashesPerSecond: parseFloat(hashesPerSecond).toFixed(2),
                    elapsedTime: parseFloat(elapsedTime).toFixed(2),
                    matches,
                });

                setHashrateData((prev) => ({
                    labels: [...prev.labels, new Date().toLocaleTimeString()].slice(-20),
                    datasets: [
                        {
                            label: "Hashrate (Hashes/Second)",
                            data: [...(prev.datasets[0]?.data || []), hashesPerSecond].slice(-20),
                            borderColor: "rgba(75,192,192,1)",
                            backgroundColor: "rgba(75,192,192,0.2)",
                        },
                    ],
                }));

                setMatchesData((prev) => ({
                    labels: [...prev.labels, new Date().toLocaleTimeString()].slice(-20),
                    datasets: [
                        {
                            label: "Matches",
                            data: [...(prev.datasets[0]?.data || []), matches].slice(-20),
                            borderColor: "rgba(255,99,132,1)",
                            backgroundColor: "rgba(255,99,132,0.2)",
                        },
                    ],
                }));
            }
        } catch (error) {
            console.error("[GET] Error fetching stats:", error);
            setErrorMessage("Error fetching stats. Check server connection.");
        }
    };

    const startSession = async () => {
        try {
            const response = await axios.post("http://localhost:3005/api/probe/start", {
                workers,
                maxListeners,
                pipelines: selectedPipelines,
            });
            setIsRunning(true);
            toast.success(response.data.message);
        } catch (error) {
            console.error("[POST] Failed to start session:", error);
            toast.error("Failed to start session. Check server connection.");
        }
    };

    const stopSession = async () => {
        try {
            const response = await axios.post("http://localhost:3005/api/probe/stop");
            setIsRunning(false);
            setStats({ hashesPerSecond: 0, elapsedTime: 0, matches: 0 });
            setHashrateData({ labels: [], datasets: [] });
            setMatchesData({ labels: [], datasets: [] });
            toast.success(response.data.message);
        } catch (error) {
            console.error("[POST] Failed to stop session:", error);
            toast.error("Failed to stop session. Check server connection.");
        }
    };

    const togglePipeline = (pipeline) => {
        setSelectedPipelines((prev) => {
            if (prev.includes(pipeline)) {
                return prev.filter((item) => item !== pipeline);
            } else {
                return [...prev, pipeline];
            }
        });
    };

    useEffect(() => {
        if (isRunning) {
            const intervalId = setInterval(fetchStats, 2500);
            return () => clearInterval(intervalId);
        }
    }, [isRunning]);

    return (
        <div style={styles.container}>
            <h1>DHT Manager</h1>
            {errorMessage && <p style={styles.errorMessage}>{errorMessage}</p>}

            <div style={styles.controls}>
                <div style={styles.controlGroup}>
                    <label style={styles.label}>
                        DHT Workers:
                        <input
                            type="number"
                            value={workers}
                            onChange={(e) => setWorkers(Number(e.target.value))}
                            disabled={isRunning}
                            style={styles.input}
                        />
                    </label>
                    <label style={styles.label}>
                        DHT Max Listeners:
                        <input
                            type="number"
                            value={maxListeners}
                            onChange={(e) => setMaxListeners(Number(e.target.value))}
                            disabled={isRunning}
                            style={styles.input}
                        />
                    </label>
                </div>

                <div style={styles.pipelineSelector}>
                    <label style={styles.label}>Select Probe Pipelines:</label>
                    {pipelineOptions.map((option) => (
                        <label key={option.name} style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={selectedPipelines.includes(option.name)}
                                onChange={() => togglePipeline(option.name)}
                                disabled={isRunning}
                                style={styles.checkbox}
                            />
                            <span
                                title={option.description}
                                style={styles.tooltip}
                            >
                                {option.name}
                            </span>
                        </label>
                    ))}
                </div>

                <button
                    onClick={isRunning ? stopSession : startSession}
                    style={isRunning ? styles.stopButton : styles.startButton}
                >
                    {isRunning ? "Stop Session" : "Start Session"}
                </button>
            </div>

            <div style={styles.statsAndChartsContainer}>
                <div style={styles.stats}>
                    <h2>Statistics</h2>
                    <p>Hashes/Second: {stats.hashesPerSecond}</p>
                    <p>Elapsed Time: {stats.elapsedTime} seconds</p>
                    <p>Matches: {stats.matches}</p>
                </div>

                <div style={styles.chartsContainer}>
                    <div style={styles.chart}>
                        <Line
                            data={hashrateData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: true },
                                    title: { display: true, text: "Hashrate Over Time" },
                                },
                                scales: {
                                    x: { title: { display: true, text: "Time" } },
                                    y: { title: { display: true, text: "Hashes/Second" } },
                                },
                            }}
                        />
                    </div>
                    <div style={styles.chart}>
                        <Line
                            data={matchesData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: true },
                                    title: { display: true, text: "Matches Over Time" },
                                },
                                scales: {
                                    x: { title: { display: true, text: "Time" } },
                                    y: { title: { display: true, text: "Matches" } },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        margin: "20px auto",
        maxWidth: "900px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "#f9f9f9",
    },
    errorMessage: { color: "red", fontWeight: "bold" },
    controls: { marginBottom: "20px" },
    controlGroup: { display: "flex", justifyContent: "space-between", gap: "20px" },
    label: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
    input: { marginTop: "5px", padding: "5px", borderRadius: "4px", border: "1px solid #ccc", width: "150px" },
    pipelineSelector: { marginTop: "15px", textAlign: "left" },
    checkboxLabel: { marginRight: "15px", display: "flex", alignItems: "center" },
    startButton: { backgroundColor: "#4caf50", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "5px" },
    stopButton: { backgroundColor: "#f44336", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "5px" },
    statsAndChartsContainer: { display: "flex", justifyContent: "space-between", gap: "20px", marginTop: "20px" },
    stats: { flex: "1" },
    chartsContainer: { flex: "2", display: "flex", flexDirection: "column", gap: "20px" },
    chart: { flex: "1" },
};

export default DHTManager;
