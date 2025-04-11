import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WebRTCContextType, PeerConnectionState } from '../types/webrtc';
import { signalingService } from '../services/SignalingService';

const WebRTCContext = createContext<WebRTCContextType | null>(null);

const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PeerConnectionState>({
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isCallStarted: false,
    isCallEnded: false,
  });

  const [isCaller, setIsCaller] = useState<boolean>(false);
  const [pendingCandidates, setPendingCandidates] = useState<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      try {
        if (!isCaller) {
          await answerCall(offer);
        }
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
      try {
        if (isCaller && state.peerConnection) {
          await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          // Add any pending ICE candidates
          pendingCandidates.forEach(candidate => {
            state.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
          });
          setPendingCandidates([]);
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      try {
        if (state.peerConnection) {
          await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          setPendingCandidates(prev => [...prev, candidate]);
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    };

    signalingService.onSignal('offer', handleOffer);
    signalingService.onSignal('answer', handleAnswer);
    signalingService.onSignal('ice-candidate', handleIceCandidate);

    return () => {
      signalingService.removeSignal('offer', handleOffer);
      signalingService.removeSignal('answer', handleAnswer);
      signalingService.removeSignal('ice-candidate', handleIceCandidate);
    };
  }, [state.peerConnection, isCaller, pendingCandidates]);

  const startCall = useCallback(async (asCaller: boolean) => {
    try {
      setIsCaller(asCaller);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const peerConnection = new RTCPeerConnection(configuration);

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        setState(prev => ({ ...prev, remoteStream: event.streams[0] }));
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          signalingService.sendSignal('ice-candidate', event.candidate);
        }
      };

      setState(prev => ({
        ...prev,
        localStream: stream,
        peerConnection,
        isCallStarted: true,
        isCallEnded: false,
      }));

      if (asCaller) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        signalingService.sendSignal('offer', offer);
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, []);

  const endCall = useCallback(() => {
    state.localStream?.getTracks().forEach(track => track.stop());
    state.peerConnection?.close();
    setState({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isCallStarted: false,
      isCallEnded: true,
    });
    setIsCaller(false);
    setPendingCandidates([]);
  }, [state]);

  const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const peerConnection = new RTCPeerConnection(configuration);

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        setState(prev => ({ ...prev, remoteStream: event.streams[0] }));
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          signalingService.sendSignal('ice-candidate', event.candidate);
        }
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      setState(prev => ({
        ...prev,
        localStream: stream,
        peerConnection,
        isCallStarted: true,
        isCallEnded: false,
      }));

      signalingService.sendSignal('answer', answer);
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }, []);

  return (
    <WebRTCContext.Provider
      value={{
        ...state,
        startCall,
        endCall,
        answerCall,
        makeOffer: async () => {
          if (!state.peerConnection) throw new Error('No peer connection');
          const offer = await state.peerConnection.createOffer();
          await state.peerConnection.setLocalDescription(offer);
          return offer;
        },
        handleAnswer: async (answer: RTCSessionDescriptionInit) => {
          if (!state.peerConnection) throw new Error('No peer connection');
          await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        },
        handleIceCandidate: async (candidate: RTCIceCandidateInit) => {
          if (!state.peerConnection) throw new Error('No peer connection');
          await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        },
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
}; 