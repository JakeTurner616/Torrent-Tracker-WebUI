import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const InfohashDetails = () => {
    const { infohash } = useParams();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [title, setTitle] = useState('');
    const [page, setPage] = useState(1);
    const [totalPeers, setTotalPeers] = useState(0);
    const [limit] = useState(10);

    useEffect(() => {
        const fetchPeerCount = async () => {
            try {
                const response = await axios.get(`http://localhost:3005/api/infohashes/top-infohashes`);
                const matchedInfohash = response.data.find(item => item.infohash === infohash);
                if (matchedInfohash) {
                    setTitle(matchedInfohash.title);
                    setTotalPeers(Number(matchedInfohash.peer_count));
                } else {
                    setError('Infohash not found in the top infohashes.');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'An error occurred while fetching peer count.');
            }
        };

        fetchPeerCount();
    }, [infohash]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:3005/api/infohash-data/${infohash}?page=${page}&limit=${limit}`);
                setData(response.data.peers || []);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'An error occurred while fetching the data.');
                setData([]);
            }
            setLoading(false);
        };

        if (totalPeers > 0) {
            fetchData();
        }
    }, [infohash, page, limit, totalPeers]);

    const totalPages = Math.max(1, Math.ceil(totalPeers / limit));

    const handlePreviousPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    if (loading) {
        return <p className="text-center text-xl">Loading data...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-semibold mb-4 text-center">Details for Infohash</h1>
            <p className="text-lg text-center mb-6"><strong>Infohash:</strong> {infohash}</p>
            <p className="text-lg text-center mb-6"><strong>Title:</strong> {title || 'Unknown Title'}</p>

            {data.length > 0 ? (
                <div>
                    <div className="overflow-x-auto shadow-md rounded-lg mb-4">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Host</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Port</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((peer, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <a
                                                href={`/en/peer/${peer.host}`}
                                                className="text-blue-500 hover:underline"
                                            >
                                                {peer.host}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{peer.port}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(peer.discovered_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handlePreviousPage}
                            disabled={page === 1}
                            className="px-6 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 hover:bg-blue-600 transition-colors duration-200"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                        <button
                            onClick={handleNextPage}
                            disabled={page === totalPages}
                            className="px-6 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 hover:bg-blue-600 transition-colors duration-200"
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-600">No peers found for this infohash.</p>
            )}
        </div>
    );
};

export default InfohashDetails;
