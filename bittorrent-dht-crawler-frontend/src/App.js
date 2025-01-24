import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import PeerPage from './components/PeerPage';
import StatsPage from './components/StatsPage';
import DataAnalysisPage from './components/DataAnalysisPage';
import InfohashDetails from './components/InfohashDetails';
import DatabaseStats from './components/DatabaseStats';
import Navbar from './components/Navbar';
import GlobePeerCount from './components/GlobePeerCount';
import WebSocketTest from './components/WebSocketTest';
import Uploader from './components/Uploader';

import './styles.css';

function App() {
    return (
        <Router>
            <div>
                <Navbar />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/en/peer/:ip" element={<PeerPage />} />
                    <Route path="/en/stats" element={<StatsPage />} />
                    <Route path="/data-analysis" element={<DataAnalysisPage />} />
                    <Route path="/data-analysis/:infohash" element={<InfohashDetails />} />
                    <Route path="/data-analysis/database" element={<DatabaseStats />} />
                    <Route path="/data-analysis/GlobePeerCount" element={<GlobePeerCount />} />
                    <Route path="/uploader" element={<Uploader />} />

                    <Route path="/websocket-test" element={<WebSocketTest />} />

                </Routes>
            </div>
        </Router>
    );
}

export default App;
