import React, { useEffect, useState } from "react";
import axiosInstance from "./axiosInstance";
import moment from "moment-timezone";
import DHTManager from "./DHTManager";
import { Tooltip } from "react-tooltip";

const DatabaseStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminPassword, setAdminPassword] = useState(""); // Admin password input
    const [adminToken, setAdminToken] = useState(null); // Temporary admin session token
    const [showPasswordModal, setShowPasswordModal] = useState(false); // Show password modal
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isPruning, setIsPruning] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axiosInstance.get("/api/stats");
                setStats(response.data);
                setError(null);
            } catch (err) {
                setError("Failed to fetch statistics. Please try again later.");
                setStats(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "Unknown";
        return moment.utc(timestamp).local().format("YYYY-MM-DD hh:mm:ss A");
    };

    const handleAdminAuthentication = async () => {
        setIsAuthenticating(true);
        try {
            const response = await axiosInstance.post("/api/auth/validate-admin", {
                adminPassword,
            });
            setAdminToken(response.data.adminToken);
            setShowPasswordModal(false);
            alert("Authentication successful. You can now perform sensitive operations.");
        } catch (err) {
            console.error("Authentication failed:", err);
            alert("Invalid password. Please try again.");
        } finally {
            setIsAuthenticating(false);
        }
    };
    const handlePruneDatabase = async () => {
        if (!adminToken) {
            setShowConfirmation(false); // Close confirmation modal
            setTimeout(() => setShowPasswordModal(true), 0); // Open password modal after confirmation modal is closed
            return;
        }
    
        setIsPruning(true);
        try {
            console.log("Sending admin token in header:", adminToken);
            await axiosInstance.delete("/api/admin/tools/prune", {
                headers: {
                    "X-Admin-Token": `Bearer ${adminToken}`, // Admin token
                },
            });
            setIsPruning(false);
            setShowConfirmation(false);
            alert("Peers table has been successfully pruned.");
        } catch (err) {
            console.error("Error pruning database:", err);
            setIsPruning(false);
            alert("An error occurred while pruning the database. Please try again.");
        }
    };
    
    const handleDownloadBackup = async () => {
        if (!adminToken) {
            setShowPasswordModal(true);
            return;
        }
    
        try {
            console.log("Sending admin token in header:", adminToken);
            const response = await axiosInstance.post(
                "/api/admin/backup",
                null,
                {
                    responseType: "blob",
                    headers: {
                        "X-Admin-Token": `Bearer ${adminToken}`, // Admin token
                    },
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `backup_${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error generating backup:", err);
            alert("Failed to generate the backup. Please try again.");
        }
    };

    if (loading) {
        return <p className="text-center text-xl">Loading statistics...</p>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Database Management</h1>
            {error ? (
                <p className="text-lg font-semibold text-red-500 text-center">{error}</p>
            ) : (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Total Infohashes Section */}
                        <div className="bg-blue-500 text-white rounded-lg p-4 shadow-md relative">
                            <h2 className="text-lg font-semibold">Total Infohashes Tracked</h2>
                            <p className="text-2xl font-bold">{stats?.totalInfohashes?.toLocaleString()}</p>
                            <span
                                data-tooltip-id="infohash-tooltip"
                                className="absolute top-2 right-2 cursor-pointer bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-50"
                            >
                                ?
                            </span>
                            <Tooltip
                                id="infohash-tooltip"
                                content="The total number of unique infohashes being tracked by the system."
                                style={{ zIndex: 1001 }}
                            />
                        </div>

                        {/* Total Peers Section */}
                        <div className="bg-green-500 text-white rounded-lg p-4 shadow-md relative">
                            <h2 className="text-lg font-semibold">Total Peers Tracked</h2>
                            <p className="text-2xl font-bold">{stats?.totalPeers?.toLocaleString()}</p>
                            <span
                                data-tooltip-id="peers-tooltip"
                                className="absolute top-2 right-2 cursor-pointer bg-white text-green-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-50"
                            >
                                ?
                            </span>
                            <Tooltip
                                id="peers-tooltip"
                                content="The total number of peers across DHT and tracker-based systems."
                                style={{ zIndex: 1001 }}
                            />
                        </div>

                        {/* Most Recent Peer Section */}
                        <div className="bg-yellow-500 text-white rounded-lg p-4 shadow-md relative">
                            <h2 className="text-lg font-semibold">Most Recent Peer</h2>
                            <p className="text-sm">{formatTimestamp(stats?.mostRecentPeer)}</p>
                            <span
                                data-tooltip-id="recent-peer-tooltip"
                                className="absolute top-2 right-2 cursor-pointer bg-white text-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-50"
                            >
                                ?
                            </span>
                            <Tooltip
                                id="recent-peer-tooltip"
                                content="The timestamp of the most recently discovered peer."
                                style={{ zIndex: 1001 }}
                            />
                        </div>

                        {/* Database Size Section */}
                        <div className="bg-purple-500 text-white rounded-lg p-4 shadow-md relative">
                            <h2 className="text-lg font-semibold">Database Size</h2>
                            <p className="text-2xl font-bold">{stats?.databaseSize}</p>
                            <span
                                data-tooltip-id="database-size-tooltip"
                                className="absolute top-2 right-2 cursor-pointer bg-white text-purple-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-50"
                            >
                                ?
                            </span>
                            <Tooltip
                                id="database-size-tooltip"
                                content="The total size of the database used for tracking infohashes and peers."
                                style={{ zIndex: 1001 }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Management Buttons */}
            <div className="text-center mt-8 space-y-4">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={handleDownloadBackup}
                >
                    Download Backup
                </button>

                <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setShowConfirmation(true)}
                >
                    Prune Database
                </button>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Enter Admin Password</h2>
                        <input
                            type="password"
                            className="border rounded px-4 py-2 mb-4 w-full"
                            placeholder="Admin Password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                        />
                        <div className="flex justify-end space-x-4">
                            <button
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => setShowPasswordModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                onClick={handleAdminAuthentication}
                                disabled={isAuthenticating}
                            >
                                {isAuthenticating ? "Authenticating..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Are you sure?</h2>
                        <p className="mb-4">This action will remove all data from the peers table and cannot be undone.</p>
                        <div className="flex justify-around">
                            <button
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => setShowConfirmation(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                onClick={handlePruneDatabase}
                                disabled={isPruning}
                            >
                                {isPruning ? "Pruning..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DHT Manager Section */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold text-center mb-4">DHT Manager</h2>
                <DHTManager />
            </div>
        </div>
    );
};

export default DatabaseStats;
