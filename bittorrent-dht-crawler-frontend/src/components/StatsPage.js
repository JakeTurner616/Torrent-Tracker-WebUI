import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const StatsPage = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get("http://localhost:3005/api/top-matched-infohashes");
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
            setLoading(false);
        };

        fetchStats();
    }, []);

    const getMedal = (index) => {
        switch (index) {
            case 0:
                return "🥇";
            case 1:
                return "🥈";
            case 2:
                return "🥉";
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-center mb-8">
                <h1 className="text-3xl font-semibold text-center">Top 10 IPs by Unique Infohashes</h1>
                <span
                    data-tooltip-id="unique-infohash-tooltip"
                    className="ml-3 cursor-pointer bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                >
                    ?
                </span>
                <Tooltip
                    id="unique-infohash-tooltip"
                    content="This Page ranks the top hosts found on any given infohash(s) tracked with the probe service."
                    style={{ zIndex: 1001, fontSize: "14px", padding: "8px" }}
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                    <span className="text-xl">Loading stats...</span>
                </div>
            ) : (
                <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">IP Address</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Unique Infohashes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.length > 0 ? (
                                stats.map((stat, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <Link to={`/en/peer/${stat.host}`} className="text-blue-500 hover:text-blue-700">
                                                {stat.host}
                                            </Link>
                                            {getMedal(index) && (
                                                <span className="ml-2" style={{ fontSize: "1.2rem" }}>
                                                    {getMedal(index)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{stat.unique_infohashes}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-sm text-gray-700 text-center">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StatsPage;
