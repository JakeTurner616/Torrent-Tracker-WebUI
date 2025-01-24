import React, { useState, useEffect } from "react";
import axios from "axios";
import ZipUploader from "./ZipUploader"; // Import the new ZipUploader component

const InfohashManager = () => {
    const [infohashes, setInfohashes] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [magnetLink, setMagnetLink] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [fileUploadSuccess, setFileUploadSuccess] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    // Fetch infohashes from the server
    useEffect(() => {
        const fetchInfohashes = async () => {
            try {
                const response = await axios.get("http://localhost:3005/api/infohashes/all-infohashes");
                setInfohashes(response.data);
            } catch (err) {
                console.error("Error fetching infohashes:", err);
            }
        };

        fetchInfohashes();
    }, [fileUploadSuccess]); // Re-fetch when a file is uploaded successfully

    // Handle magnet link submission
    const handleMagnetSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!magnetLink) {
            setError("Please enter a valid magnet link.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("http://localhost:3005/api/infohashes/upload-torrent", { magnetLink });
            setSuccess("Magnet link added successfully!");
            setInfohashes((prev) => [response.data, ...prev]);
            setMagnetLink(""); // Clear input after success
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add magnet link.");
        } finally {
            setLoading(false);
        }
    };

    // Handle bulk deletion
    const handleDeleteSelected = async () => {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await axios.delete("http://localhost:3005/api/infohashes", {
                data: { ids: selectedIds },
            });
            setSuccess(`${selectedIds.length} item(s) deleted successfully.`);
            setInfohashes((prev) => prev.filter((infohash) => !selectedIds.includes(infohash.id)));
            setSelectedIds([]);
            setShowDeleteConfirmation(false);
        } catch (err) {
            setError("Failed to delete selected items.");
        } finally {
            setLoading(false);
        }
    };

    // Toggle row selection
    const toggleSelection = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
        );
    };

    // Select all rows
    const toggleSelectAll = () => {
        if (selectedIds.length === infohashes.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(infohashes.map((infohash) => infohash.id));
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            const response = await axios.post(
                "http://localhost:3005/api/admin/infohashesbackup",
                null,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `infohashes_backup_${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting data:", err);
            alert("Failed to export data. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Infohash Manager</h1>

                {/* Alerts */}
                {loading && (
                    <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                        Processing your request, please wait...
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}

                {/* ZipUploader Component */}
                <ZipUploader onSuccess={() => setFileUploadSuccess((prev) => !prev)} />

                {/* Torrent File Uploader */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6">
                    <h2 className="text-lg font-semibold mb-2">Upload Torrent File</h2>
                    <TorrentUploader
                        onSuccess={() => setFileUploadSuccess((prev) => !prev)} // Trigger data refresh
                    />
                </div>

                {/* Magnet Link Input Form */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6">
                    <h2 className="text-lg font-semibold mb-2">Add Magnet Link</h2>
                    <form onSubmit={handleMagnetSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter magnet link"
                            value={magnetLink}
                            onChange={(e) => setMagnetLink(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            disabled={loading}
                        >
                            Add
                        </button>
                    </form>
                </div>

                {/* Contextual Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-lg shadow">
                        <span className="text-gray-700">{selectedIds.length} item(s) selected</span>
                        <button
                            onClick={() => setShowDeleteConfirmation(true)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            disabled={loading}
                        >
                            Delete Selected
                        </button>
                    </div>
                )}

                {/* Infohash Table */}
                <div className="overflow-auto rounded-lg shadow">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                        <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <tr>
                                <th className="py-3 px-6 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === infohashes.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="py-3 px-6 text-left">InfoHash</th>
                                <th className="py-3 px-6 text-left">Title</th>
                                <th className="py-3 px-6 text-left">Discovered At</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {infohashes.map((infohash) => (
                                <tr key={infohash.id} className="border-b hover:bg-gray-100">
                                    <td className="py-3 px-6 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(infohash.id)}
                                            onChange={() => toggleSelection(infohash.id)}
                                        />
                                    </td>
                                    <td className="py-3 px-6">{infohash.infohash}</td>
                                    <td className="py-3 px-6">{decodeURIComponent(infohash.title)}</td>
                                    <td className="py-3 px-6">
                                        {new Date(infohash.discovered_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirmation && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                            <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete {selectedIds.length} item(s)?
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowDeleteConfirmation(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Export Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        Export Infohashes
                    </button>
                </div>
            </div>
        </div>
    );
};

const TorrentUploader = ({ onSuccess }) => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
        setError(null);
    };

    const handleUpload = async () => {
        if (!files.length) {
            setError("Please select one or more .torrent files.");
            return;
        }

        setLoading(true);
        setProgress(0);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append("torrent", file);

                await axios.post("http://localhost:3005/api/infohashes/upload-torrent", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                setProgress(Math.round(((i + 1) / files.length) * 100));
            }

            setError(null);
            setFiles([]);
            onSuccess();
        } catch (err) {
            console.error("Error uploading files:", err);
            setError("Failed to upload some files.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                accept=".torrent"
                multiple
                onChange={handleFileChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={handleUpload}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={loading}
            >
                {loading ? `Uploading... (${progress}%)` : "Upload"}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {progress > 0 && (
                <div className="mt-2 text-gray-700">
                    Upload progress: {progress}%
                </div>
            )}
        </div>
    );
};

export default InfohashManager;
