import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Tooltip, Cell, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const DataAnalysisPage = () => {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null); // To track errors
    const [loading, setLoading] = useState(true); // To track loading state
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FEA', '#FF6384', '#36A2EB', '#4BC0C0', '#FF9F40', '#9966FF'];
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch data from the backend
        axios.get('http://localhost:3005/api/infohashes/top-infohashes?')
            .then((response) => {
                if (response.data && response.data.length > 0) {
                    const aggregatedData = response.data.reduce((acc, item) => {
                        const existing = acc.find((entry) => entry.name === (item.title || 'Unknown Title'));
                        if (existing) {
                            existing.value += parseInt(item.peer_count, 10);
                        } else {
                            acc.push({
                                name: item.title || 'Unknown Title',
                                value: parseInt(item.peer_count, 10),
                                infohash: item.infohash, // Include the infohash for linking
                            });
                        }
                        return acc;
                    }, []);
                    setData(aggregatedData);
                    setError(null); // Clear any previous errors
                } else {
                    setError("No top infohashes found."); // Handle empty data case
                }
            })
            .catch((error) => {
                // Handle server or network errors
                console.error("Error fetching data for analysis:", error);
                if (error.response && error.response.data?.error) {
                    setError(error.response.data.error); // Error from server
                } else {
                    setError("Unable to fetch data. Please try again later."); // General error
                }
            })
            .finally(() => {
                setLoading(false); // Ensure loading is stopped
            });
    }, []);

    const handleClick = (data) => {
        if (data.infohash) {
            navigate(`/data-analysis/${data.infohash}`);
        }
    };

    return (
        <div style={{ width: '100vw', height: '80vh', padding: '20px' }}>
            {/* Title Section */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 className="text-3xl font-semibold text-center mb-8">Top tracked Infohashes</h1>
            </div>
            
            {/* Chart Section */}
            <div style={{ width: '100%', height: '100%' }}>
                {loading ? (
                    <p>Loading data...</p>
                ) : error ? (
                    <p style={{ color: 'red', textAlign: 'center' }}>
                        {error}
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius="50%"
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name }) => name} // Only display the name
                                onClick={(_, index) => handleClick(data[index])} // Add onClick handler
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} Peers`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default DataAnalysisPage;
