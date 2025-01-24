import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const PeerPage = () => {
  const { ip } = useParams();
  const [peerData, setPeerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // To display validation errors
  const [page, setPage] = useState(1); // Current page number
  const [totalPeers, setTotalPeers] = useState(0); // Total number of peers for pagination
  const [limit] = useState(10); // Number of results per page

  // Function to validate IPv4 addresses
  const isValidIPv4 = (ip) => {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  useEffect(() => {
    // Check if IP is valid before making the request
    if (!isValidIPv4(ip)) {
      setError('Invalid IPv4 address. Please enter a valid IPv4 address.');
      setPeerData([]); // Clear any previous data
      setTotalPeers(0); // Reset pagination
      return;
    }
    setError(''); // Clear previous errors

    const getPeerData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3005/api/peer/${ip}?page=${page}&limit=${limit}`);

        // Set the received data directly since the server handles combining entries
        setPeerData(response.data.peers);
        setTotalPeers(response.data.total); // Set the total number of unique infohashes
      } catch (error) {
        console.error('Error fetching peer data:', error);
        setError('Unable to fetch data for the provided IP.');
      }
      setLoading(false);
    };

    getPeerData();
  }, [ip, page, limit]); // Run this effect when IP or page changes

  // Calculate total pages based on total peers and limit
  const totalPages = totalPeers > 0 ? Math.ceil(totalPeers / limit) : 1; // Ensure totalPages is at least 1

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  // Render nothing if the IP is invalid
  if (!isValidIPv4(ip)) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-6 text-center">Peer Information</h1>
        <p className="text-center text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6 text-center">Peer Information for {ip}</h1>

      {error ? (
        <p className="text-center text-red-500 text-xl">{error}</p>
      ) : loading ? (
        <p className="text-center text-xl">Loading data...</p>
      ) : (
        <div>
          <h2 className="text-2xl mb-4">Downloads:</h2>

          {/* Table Layout */}
          <div className="overflow-x-auto shadow-md rounded-lg mb-4">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Infohash</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ports</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Discovered At</th>
                </tr>
              </thead>
              <tbody>
                {peerData.length > 0 ? (
                  peerData.map((peer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <Link
                          to={`/data-analysis/${peer.infohash}`}
                          className="text-blue-500 hover:underline"
                        >
                          {peer.infohash}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{peer.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {peer.ports.join(', ')} {/* Ports are already combined as an array */}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{peer.latestdiscoveredat}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-sm text-gray-700 text-center">No data available</td>
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

export default PeerPage;
