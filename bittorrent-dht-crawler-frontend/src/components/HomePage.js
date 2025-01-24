import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HomePage = () => {
  const [ip, setIp] = useState('');
  const [torrents, setTorrents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // Current page number
  const [totalTorrents, setTotalTorrents] = useState(0); // Total number of torrents
  const [limit] = useState(10); // Number of results per page

  useEffect(() => {
    const getIpAndTorrents = async () => {
      setLoading(true);
      try {
        // Fetch user's IP
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const clientIp = ipResponse.data.ip;
        setIp(clientIp);

        // Fetch torrents data for the client's IP
        const torrentsResponse = await axios.get(
          `http://localhost:3005/api/peer/${clientIp}?page=${page}&limit=${limit}`
        );
        setTorrents(torrentsResponse.data.peers || []);
        setTotalTorrents(torrentsResponse.data.total || 0);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('No matching data found for this IP');
          setTorrents([]);
        } else {
          console.error('Error fetching data:', error);
        }
      }
      setLoading(false);
    };

    getIpAndTorrents();
  }, [page, limit]);

  const totalPages = Math.ceil(totalTorrents / limit);

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6 text-center">Torrents Downloaded by Peer</h1>
      <p className="text-center text-lg mb-4">Your IP Address: <strong>{ip}</strong></p>

      {loading ? (
        <p className="text-center text-xl">Loading data...</p>
      ) : (
        <div>
          <h2 className="text-2xl mb-4">Torrent List:</h2>

          {/* Table Layout */}
          <div className="overflow-x-auto shadow-md rounded-lg mb-4">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Infohash</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Discovered At</th>
                </tr>
              </thead>
              <tbody>
                {torrents.length > 0 ? (
                  torrents.map((torrent, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{torrent.infohash}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{torrent.title || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(torrent.latestdiscoveredat).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-sm text-gray-700 text-center">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
      )}
    </div>
  );
};

export default HomePage;