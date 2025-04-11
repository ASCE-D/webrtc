import React, { useEffect, useRef } from 'react';
import { useWebRTC } from '../context/WebRTCContext';
import { ConnectionStats } from './ConnectionStats';
import '../styles/ConnectionStats.css';

export const VideoCall: React.FC = () => {
  const {
    localStream,
    remoteStream,
    isCallStarted,
    startCall,
    endCall,
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="video-wrapper">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
          <div className="video-label">You</div>
        </div>
        <div className="video-wrapper">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
          <div className="video-label">Remote</div>
        </div>
      </div>
      <div className="controls">
        {!isCallStarted ? (
          <div className="call-buttons">
            <button onClick={() => startCall(true)} className="start-button">
              Start Call as Caller
            </button>
            <button onClick={() => startCall(false)} className="start-button">
              Start Call as Receiver
            </button>
          </div>
        ) : (
          <button onClick={endCall} className="end-button">
            End Call
          </button>
        )}
      </div>
      {isCallStarted && <ConnectionStats />}
    </div>
  );
}; 