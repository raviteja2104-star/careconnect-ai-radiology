'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Pusher, { type PresenceChannel } from 'pusher-js';

const SIGNALING_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY ?? '';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'mt1';
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export type WebRTCConnectionState =
  | 'idle'
  | 'connecting'
  | 'waiting-peer'
  | 'connected'
  | 'failed'
  | 'media-denied';

export interface UseWebRTCOptions {
  /** Session id used as the Pusher presence channel key. Pass null/undefined to delay signaling (media preview still starts). */
  sessionId: string | null | undefined;
  /** The doctor is the offering side once a peer joins; the patient answers. */
  role: 'doctor' | 'patient';
}

export interface UseWebRTCResult {
  state: WebRTCConnectionState;
  error: string | null;
  localVideoRef: (el: HTMLVideoElement | null) => void;
  remoteVideoRef: (el: HTMLVideoElement | null) => void;
  isMuted: boolean;
  isCameraOff: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  hangup: () => void;
  retry: () => void;
}

function getAuthHeaders(): Record<string, string> {
  try {
    const token = window.localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
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
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<PresenceChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const endedRef = useRef(false);

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

  // Effect A: acquire camera + mic (runs even before sessionId is known, for pre-join previews)
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
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
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
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      if (localElRef.current) localElRef.current.srcObject = null;
    };
  }, [attempt]);

  // Effect B: Pusher presence channel + WebRTC peer connection
  useEffect(() => {
    if (!sessionId || !mediaReady || endedRef.current) return;

    if (!PUSHER_KEY) {
      setState('failed');
      setError('Real-time service is not configured. Set NEXT_PUBLIC_PUSHER_KEY.');
      return;
    }

    setState('connecting');
    setError(null);

    const pusherClient = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      channelAuthorization: {
        endpoint: `${SIGNALING_URL}/api/pusher/auth`,
        transport: 'ajax',
        headers: getAuthHeaders(),
      },
    });
    pusherRef.current = pusherClient;

    const channel = pusherClient.subscribe(`presence-webrtc-${sessionId}`) as PresenceChannel;
    channelRef.current = channel;

    // ── Peer connection factory ─────────────────────────────────────────────
    const createPeer = () => {
      closePeer();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current as MediaStream));
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          channel.trigger('client-webrtc:ice', { candidate: e.candidate.toJSON() });
        }
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
      pendingIceRef.current.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));
      pendingIceRef.current = [];
    };

    const sendOffer = async () => {
      const pc = createPeer();
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.trigger('client-webrtc:offer', { sdp: offer });
      } catch {
        setState('failed');
        setError('Failed to start the call negotiation.');
      }
    };

    // ── Presence channel events ─────────────────────────────────────────────
    channel.bind('pusher:subscription_succeeded', () => {
      setState('waiting-peer');
      // If a peer is already in the room, doctor creates the offer immediately
      if (role === 'doctor' && channel.members.count > 1) {
        sendOffer();
      }
    });

    channel.bind('pusher:subscription_error', (err: unknown) => {
      setState('failed');
      setError(`Could not join the signaling room: ${String(err)}`);
    });

    // New peer joined after us — doctor sends the offer
    channel.bind('pusher:member_added', () => {
      if (role !== 'doctor') return;
      if (pcRef.current?.connectionState === 'connected') return;
      sendOffer();
    });

    // Peer left — reset for re-join
    channel.bind('pusher:member_removed', () => {
      closePeer();
      setState('waiting-peer');
    });

    // ── WebRTC signaling via Pusher client events ──────────────────────────
    channel.bind('client-webrtc:offer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      if (role === 'doctor') return; // only patient answers
      const pc = createPeer();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        flushPendingIce(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.trigger('client-webrtc:answer', { sdp: answer });
      } catch {
        setState('failed');
        setError('Failed to answer the incoming call.');
      }
    });

    channel.bind('client-webrtc:answer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
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

    channel.bind('client-webrtc:ice', ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingIceRef.current.push(candidate);
      }
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`presence-webrtc-${sessionId}`);
      pusherClient.disconnect();
      pusherRef.current = null;
      channelRef.current = null;
      closePeer();
    };
  }, [sessionId, role, mediaReady, attempt, closePeer]);

  const toggleMute = useCallback(() => {
    setIsMuted(muted => {
      localStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = muted));
      return !muted;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraOff(off => {
      localStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = off));
      return !off;
    });
  }, []);

  const hangup = useCallback(() => {
    endedRef.current = true;
    if (channelRef.current) {
      channelRef.current.unbind_all();
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
    channelRef.current = null;
    closePeer();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (localElRef.current) localElRef.current.srcObject = null;
    setState('idle');
  }, [closePeer]);

  const retry = useCallback(() => {
    endedRef.current = false;
    setState('idle');
    setError(null);
    setAttempt(a => a + 1);
  }, []);

  return { state, error, localVideoRef, remoteVideoRef, isMuted, isCameraOff, toggleMute, toggleCamera, hangup, retry };
}
