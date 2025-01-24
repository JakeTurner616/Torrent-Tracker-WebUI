import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const GlobePeerCount = () => {
    const globeContainerRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/globe-peer-data');
                const data = await response.json();

                const globe = Globe()(globeContainerRef.current)
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
                    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
                    .pointsData(data)
                    .pointLat('latitude')
                    .pointLng('longitude')
                    .pointAltitude(d => d.weight * 0.2) // Scaled altitude
                    .pointRadius(d => Math.max(0.1, d.weight * 1.5)) // Scaled size
                    .pointColor(() => 'rgba(255, 100, 100, 0.8)')
                    .onPointHover((point) => {
                        if (point) {
                            const { country, peerCount } = point;
                            setTooltip({
                                visible: true,
                                content: `<b>${country}</b><br />Peer Count: ${peerCount}`,
                                x: tooltip.x,
                                y: tooltip.y,
                            });
                        } else {
                            setTooltip({ ...tooltip, visible: false });
                        }
                    });

                return () => globe.controls().dispose(); // Cleanup
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };

        fetchData();

        // Track mouse movements for tooltip
        const handleMouseMove = (e) => {
            setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [tooltip]);

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <div ref={globeContainerRef} style={{ width: '100%', height: '100%' }} />
            {tooltip.visible && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${tooltip.x + 10}px`,
                        top: `${tooltip.y + 10}px`,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '5px',
                        borderRadius: '5px',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                    dangerouslySetInnerHTML={{ __html: tooltip.content }}
                />
            )}
        </div>
    );
};

export default GlobePeerCount;
