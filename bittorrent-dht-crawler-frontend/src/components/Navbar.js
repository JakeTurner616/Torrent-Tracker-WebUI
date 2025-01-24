import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="bg-gray-800">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-white text-xl font-bold">
                            DHT Tracker
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        <Link
                            to="/"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Home
                        </Link>
                        <Link
                            to="/en/stats"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Top IPs
                        </Link>
                        <Link
                            to="/data-analysis"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Top Torrents
                        </Link>
                        <Link
                            to="/data-analysis/database"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Database Stats
                        </Link>
                        <Link
                            to="uploader"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Add Torrents
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
