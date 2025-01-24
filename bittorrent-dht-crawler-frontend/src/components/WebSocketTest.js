import React, { useState, useEffect } from 'react';

const WebSocketTest = () => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:3005");

        ws.onopen = () => {
            console.log("WebSocket connection established.");
            setConnectionStatus('Connected');
        };

        ws.onmessage = (event) => {
            console.log("Message received from server:", event.data);
            setMessages((prevMessages) => [...prevMessages, event.data]);
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setError('WebSocket error occurred. Check the console for details.');
        };

        ws.onclose = (event) => {
            console.warn("WebSocket connection closed:", event);
            setConnectionStatus('Disconnected');
        };

        // Cleanup WebSocket connection on component unmount
        return () => {
            console.log("Closing WebSocket connection...");
            ws.close();
        };
    }, []); // Empty dependency array ensures this runs once on mount

    return (
        <div style={styles.container}>
            <h1>WebSocket Test</h1>
            <p>Status: <strong>{connectionStatus}</strong></p>
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.messagesContainer}>
                <h2>Messages:</h2>
                {messages.length > 0 ? (
                    <ul style={styles.messagesList}>
                        {messages.map((message, index) => (
                            <li key={index} style={styles.messageItem}>{message}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No messages received yet.</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        margin: '20px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    error: {
        color: 'red',
        fontWeight: 'bold',
    },
    messagesContainer: {
        marginTop: '20px',
    },
    messagesList: {
        listStyleType: 'none',
        padding: 0,
    },
    messageItem: {
        backgroundColor: '#e8f4f8',
        margin: '5px 0',
        padding: '10px',
        borderRadius: '4px',
    },
};

export default WebSocketTest;