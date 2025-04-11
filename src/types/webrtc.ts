export interface PeerConnectionState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isCallStarted: boolean;
  isCallEnded: boolean;
}

export interface WebRTCContextType extends PeerConnectionState {
  startCall: (asCaller: boolean) => Promise<void>;
  endCall: () => void;
  answerCall: (offer: RTCSessionDescriptionInit) => Promise<void>;
  makeOffer: () => Promise<RTCSessionDescriptionInit>;
  handleAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
} 