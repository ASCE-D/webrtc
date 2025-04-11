import React, { useEffect, useState } from 'react';
import { useWebRTC } from '../context/WebRTCContext';

interface Stats {
  ping: number;
  packetLoss: number;
  avgPing: number;
  bytesReceived: number;
  bytesSent: number;
  timestamp: number;
}

export const ConnectionStats: React.FC = () => {
  const { peerConnection } = useWebRTC();
  const [stats, setStats] = useState<Stats>({
    ping: 0,
    packetLoss: 0,
    avgPing: 0,
    bytesReceived: 0,
    bytesSent: 0,
    timestamp: Date.now(),
  });

  const [pingHistory, setPingHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!peerConnection) return;

    const updateStats = async () => {
      try {
        const stats = await peerConnection.getStats();
        const newStats: Stats = {
          ping: 0,
          packetLoss: 0,
          avgPing: 0,
          bytesReceived: 0,
          bytesSent: 0,
          timestamp: Date.now(),
        };

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            // Calculate ping (round trip time)
            if (report.currentRoundTripTime) {
              const ping = report.currentRoundTripTime * 1000; // Convert to ms
              newStats.ping = ping;
              setPingHistory(prev => {
                const updated = [...prev, ping].slice(-10); // Keep last 10 pings
                newStats.avgPing = updated.reduce((a, b) => a + b, 0) / updated.length;
                return updated;
              });
            }

            // Calculate packet loss
            if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
              const total = report.packetsLost + report.packetsReceived;
              newStats.packetLoss = total > 0 ? (report.packetsLost / total) * 100 : 0;
            }

            // Get bytes sent/received
            if (report.bytesReceived) {
              newStats.bytesReceived = report.bytesReceived;
            }
            if (report.bytesSent) {
              newStats.bytesSent = report.bytesSent;
            }
          }
        });

        setStats(newStats);
      } catch (error) {
        console.error('Error getting stats:', error);
      }
    };

    const interval = setInterval(updateStats, 1000); // Update every second

    return () => clearInterval(interval);
  }, [peerConnection]);

  if (!peerConnection) return null;

  return (
    <div className="connection-stats">
      <h3>Connection Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Ping:</span>
          <span className="stat-value">{stats.ping.toFixed(2)} ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Ping:</span>
          <span className="stat-value">{stats.avgPing.toFixed(2)} ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Packet Loss:</span>
          <span className="stat-value">{stats.packetLoss.toFixed(2)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data Received:</span>
          <span className="stat-value">{(stats.bytesReceived / 1024).toFixed(2)} KB</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data Sent:</span>
          <span className="stat-value">{(stats.bytesSent / 1024).toFixed(2)} KB</span>
        </div>
      </div>
    </div>
  );
}; 