import React, { useState } from "react";
import axios from "axios";

const ZipUploader = ({ onSuccess }) => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleZipUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith(".zip")) {
            setError("Please upload a valid .zip file containing the CSV.");
            return;
        }

        const formData = new FormData();
        formData.append("zipFile", file);

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                "http://localhost:3005/api/infohashes/upload-csv/infohashes", // Adjust the endpoint if necessary
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            alert(response.data.message);
            onSuccess(); // Trigger success callback to refresh data
        } catch (err) {
            console.error("Error uploading ZIP file:", err);
            setError("Failed to upload ZIP file. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6">
            <h2 className="text-lg font-semibold mb-2">Upload CSV as ZIP</h2>
            <input
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
            />
            {loading && <p className="text-blue-500 mt-2">Uploading...</p>}
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default ZipUploader;