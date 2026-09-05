'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const SIGNALING_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export type WebRTCConnectionState =
  | 'idle'
  | 'connecting'
  | 'waiting-peer'
  | 'connected'
  | 'failed'
  | 'media-denied';

export interface UseWebRTCOptions {
  /** Session id used as the signaling room key. Pass null/undefined to delay signaling (media preview still starts). */
  sessionId: string | null | undefined;
  /** The doctor is the offering side once a peer joins; the patient answers. */
  role: 'doctor' | 'patient';
}

export interface UseWebRTCResult {
  state: WebRTCConnectionState;
  /** Human-readable detail for 'failed' / 'media-denied'. */
  error: string | null;
  /** Attach to the local (self view) <video> element: <video ref={localVideoRef} muted autoPlay playsInline />. */
  localVideoRef: (el: HTMLVideoElement | null) => void;
  /** Attach to the remote (main stage) <video> element. */
  remoteVideoRef: (el: HTMLVideoElement | null) => void;
  isMuted: boolean;
  isCameraOff: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  /** Leave the call: notifies peers, stops media, disconnects signaling. */
  hangup: () => void;
  /** Re-request camera/mic after 'media-denied' (also restarts signaling). */
  retry: () => void;
}

export function useWebRTC({ sessionId, role }: UseWebRTCOptions): UseWebRTCResult {
  const [state, setState] = useState<WebRTCConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localElRef = useRef<HTMLVideoElement | null>(null);
  const remoteElRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const endedRef = useRef(false);

  // Callback refs so streams attach no matter which mounts first (element or stream).
  const localVideoRef = useCallback((el: HTMLVideoElement | null) => {
    localElRef.current = el;
    if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
  }, []);
  const remoteVideoRef = useCallback((el: HTMLVideoElement | null) => {
    remoteElRef.current = el;
    if (el && remoteStreamRef.current) el.srcObject = remoteStreamRef.current;
  }, []);

  const closePeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingIceRef.current = [];
    remoteStreamRef.current = null;
    if (remoteElRef.current) remoteElRef.current.srcObject = null;
  }, []);

  // Effect A: acquire camera + mic (runs even before the session id is known, for previews).
  useEffect(() => {
    endedRef.current = false;
    let cancelled = false;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('media-denied');
      setError('This browser does not support camera/microphone capture.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localElRef.current) localElRef.current.srcObject = stream;
        setMediaReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : '';
        setState('media-denied');
        setError(
          name === 'NotAllowedError'
            ? 'Camera and microphone access was denied. Allow access in your browser and retry.'
            : name === 'NotFoundError'
              ? 'No camera or microphone was found on this device.'
              : 'Could not start your camera/microphone.'
        );
      });
    return () => {
      cancelled = true;
      setMediaReady(false);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (localElRef.current) localElRef.current.srcObject = null;
    };
  }, [attempt]);

  // Effect B: signaling + peer connection, once media and session id are available.
  useEffect(() => {
    if (!sessionId || !mediaReady || endedRef.current) return;
    setState('connecting');
    setError(null);

    let token: string | null = null;
    try {
      token = window.localStorage.getItem('token');
    } catch {
      /* storage unavailable — connect without auth and surface the server's rejection */
    }
    const socket = io(SIGNALING_URL, token ? { auth: { token } } : undefined);
    socketRef.current = socket;

    const createPeer = () => {
      closePeer();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current as MediaStream));
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('webrtc:ice', { sessionId, candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        const stream = e.streams[0] ?? new MediaStream([e.track]);
        remoteStreamRef.current = stream;
        if (remoteElRef.current) remoteElRef.current.srcObject = stream;
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setState('connected');
        else if (pc.connectionState === 'failed') {
          setState('failed');
          setError('The video connection failed. Check your network and retry.');
        }
      };
      return pc;
    };

    const flushPendingIce = (pc: RTCPeerConnection) => {
      pendingIceRef.current.forEach((c) => {
        pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      });
      pendingIceRef.current = [];
    };

    socket.on('connect', () => {
      socket.emit('webrtc:join', { sessionId });
      setState((s) => (s === 'connected' ? s : 'waiting-peer'));
    });
    socket.on('connect_error', (err: Error) => {
      setState('failed');
      setError(
        token
          ? `Could not reach the signaling server: ${err.message}`
          : 'Not signed in — no auth token found, and the signaling server requires one.'
      );
    });

    socket.on('webrtc:peer-joined', async () => {
      if (role !== 'doctor') return; // patient waits for the offer
      const pc = pcRef.current?.connectionState === 'connected' ? null : createPeer();
      if (!pc) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { sessionId, sdp: offer });
      } catch {
        setState('failed');
        setError('Failed to start the call negotiation.');
      }
    });

    socket.on('webrtc:offer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      if (role === 'doctor') return;
      const pc = createPeer();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        flushPendingIce(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { sessionId, sdp: answer });
      } catch {
        setState('failed');
        setError('Failed to answer the incoming call.');
      }
    });

    socket.on('webrtc:answer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        flushPendingIce(pc);
      } catch {
        setState('failed');
        setError('Failed to complete the call negotiation.');
      }
    });

    socket.on('webrtc:ice', ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      else pendingIceRef.current.push(candidate);
    });

    socket.on('webrtc:peer-left', () => {
      closePeer();
      setState('waiting-peer');
    });

    return () => {
      socket.emit('webrtc:leave', { sessionId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      closePeer();
    };
  }, [sessionId, role, mediaReady, attempt, closePeer]);

  const toggleMute = useCallback(() => {
    setIsMuted((muted) => {
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = muted));
      return !muted;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((off) => {
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = off));
      return !off;
    });
  }, []);

  const hangup = useCallback(() => {
    endedRef.current = true;
    if (socketRef.current) {
      socketRef.current.emit('webrtc:leave', { sessionId });
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    closePeer();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localElRef.current) localElRef.current.srcObject = null;
    setState('idle');
  }, [sessionId, closePeer]);

  const retry = useCallback(() => {
    endedRef.current = false;
    setState('idle');
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return {
    state,
    error,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    hangup,
    retry,
  };
}
