import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const VideoConsultationScreen = ({ navigation, route }) => {
    const { doctor, patient, consultationId } = route.params || {};
    const [callState, setCallState] = useState('connecting'); // connecting | active | ended
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'doctor', text: 'Hello! I can see your reports. Let\'s discuss.', time: 'Now' },
    ]);
    const [chatInput, setChatInput] = useState('');
    const pulseAnim = useRef(new Animated.Value(0.3)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);

    const personName = doctor?.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : patient?.firstName ? `${patient.firstName} ${patient.lastName}` : 'Dr. Raj Sharma';
    const personSpec = doctor?.specialization || 'General Physician';

    // Timer
    useEffect(() => {
        let timer;
        if (callState === 'active') {
            timer = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [callState]);

    // Simulate connection
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])).start();

        const connectTimer = setTimeout(() => {
            setCallState('active');
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            initWebRTC();
        }, 3000);

        return () => { clearTimeout(connectTimer); cleanup(); };
    }, []);

    // ── WebRTC setup ──────────────────────────────────────────────────────────
    const initWebRTC = async () => {
        if (Platform.OS !== 'web') return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            // In production, connect to signaling server here
            // For demo, we show local camera as both local and "remote"
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            pc.ontrack = (event) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
            };
            pcRef.current = pc;
        } catch (e) {
            console.warn('WebRTC init:', e.message);
        }
    };

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (pcRef.current) pcRef.current.close();
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
        }
    };

    const toggleVideo = () => {
        setIsVideoOff(!isVideoOff);
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
        }
    };

    const endCall = () => {
        cleanup();
        setCallState('ended');
        setTimeout(() => navigation.goBack(), 2000);
    };

    const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const sendChat = () => {
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { id: Date.now(), sender: 'me', text: chatInput.trim(), time: 'Now' }]);
        setChatInput('');
        // Simulate doctor response
        setTimeout(() => {
            setChatMessages(prev => [...prev, { id: Date.now(), sender: 'doctor', text: 'I understand. Let me check your scan results.', time: 'Now' }]);
        }, 2000);
    };

    return (
        <View style={vs.root}>
            {/* Remote video / placeholder */}
            <View style={vs.remoteVideo}>
                {Platform.OS === 'web' && callState === 'active' ? (
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <View style={vs.videoPlaceholder}>
                        <View style={vs.avatarCircle}>
                            <Text style={vs.avatarText}>{personName.charAt(0)}{personName.split(' ').pop()?.charAt(0)}</Text>
                        </View>
                        {callState === 'connecting' && (
                            <View style={{ alignItems: 'center', marginTop: 20 }}>
                                <Animated.View style={[vs.connectingDot, { opacity: pulseAnim }]} />
                                <Text style={vs.connectingText}>Connecting...</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Top bar */}
            <View style={vs.topBar}>
                <View>
                    <Text style={vs.callerName}>{personName}</Text>
                    <Text style={vs.callerSpec}>{personSpec}</Text>
                </View>
                <View style={vs.statusBadge}>
                    {callState === 'active' && <View style={vs.liveDot} />}
                    <Text style={vs.statusText}>
                        {callState === 'connecting' ? 'Connecting...' : callState === 'active' ? formatDuration(duration) : 'Call Ended'}
                    </Text>
                </View>
            </View>

            {/* Local video (PiP) */}
            {callState === 'active' && (
                <View style={vs.localVideo}>
                    {Platform.OS === 'web' ? (
                        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, transform: 'scaleX(-1)' }} />
                    ) : (
                        <View style={{ flex: 1, backgroundColor: COLORS.card, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="person" size={28} color={COLORS.textMuted} />
                            <Text style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>You</Text>
                        </View>
                    )}
                    {isVideoOff && (
                        <View style={vs.videoOffOverlay}>
                            <Ionicons name="videocam-off" size={20} color={COLORS.textMuted} />
                        </View>
                    )}
                </View>
            )}

            {/* Network quality indicator */}
            {callState === 'active' && (
                <View style={vs.networkBadge}>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[12, 16, 20, 24].map((h, i) => (
                            <View key={i} style={{ width: 3, height: h, borderRadius: 1, backgroundColor: i < 3 ? COLORS.success : COLORS.success + '40' }} />
                        ))}
                    </View>
                    <Text style={{ fontSize: 9, color: COLORS.success, ...FONTS.bold }}>HD</Text>
                </View>
            )}

            {/* E-Prescription / Share scan buttons */}
            {callState === 'active' && (
                <View style={vs.extraActions}>
                    <TouchableOpacity style={vs.extraBtn}>
                        <Ionicons name="document-text" size={16} color={COLORS.primary} />
                        <Text style={vs.extraBtnTxt}>E-Prescription</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={vs.extraBtn} onPress={() => navigation.navigate('ReportViewer', { scan: route.params?.scan })}>
                        <Ionicons name="images" size={16} color={COLORS.primary} />
                        <Text style={vs.extraBtnTxt}>Share Scan</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom controls */}
            <View style={vs.controls}>
                <TouchableOpacity style={[vs.ctrlBtn, isMuted && vs.ctrlBtnActive]} onPress={toggleMute}>
                    <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? COLORS.danger : '#fff'} />
                    <Text style={vs.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[vs.ctrlBtn, isVideoOff && vs.ctrlBtnActive]} onPress={toggleVideo}>
                    <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? COLORS.danger : '#fff'} />
                    <Text style={vs.ctrlLabel}>Video</Text>
                </TouchableOpacity>

                <TouchableOpacity style={vs.endBtn} onPress={endCall}>
                    <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={[vs.ctrlBtn, isSpeaker && vs.ctrlBtnActive]} onPress={() => setIsSpeaker(!isSpeaker)}>
                    <Ionicons name={isSpeaker ? 'volume-high' : 'volume-mute'} size={22} color={isSpeaker ? COLORS.primary : '#fff'} />
                    <Text style={vs.ctrlLabel}>Speaker</Text>
                </TouchableOpacity>

                <TouchableOpacity style={vs.ctrlBtn} onPress={() => setShowChat(!showChat)}>
                    <Ionicons name="chatbubble" size={22} color="#fff" />
                    <Text style={vs.ctrlLabel}>Chat</Text>
                </TouchableOpacity>
            </View>

            {/* Chat panel */}
            {showChat && (
                <View style={vs.chatPanel}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: SIZES.md, color: '#fff', ...FONTS.bold }}>Chat</Text>
                        <TouchableOpacity onPress={() => setShowChat(false)}>
                            <Ionicons name="close" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                    {chatMessages.map(m => (
                        <View key={m.id} style={[vs.chatBubble, m.sender === 'me' ? vs.chatMe : vs.chatOther]}>
                            <Text style={{ fontSize: SIZES.sm, color: m.sender === 'me' ? '#fff' : COLORS.textSecondary }}>{m.text}</Text>
                            <Text style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4, textAlign: m.sender === 'me' ? 'right' : 'left' }}>{m.time}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Call ended overlay */}
            {callState === 'ended' && (
                <View style={vs.endedOverlay}>
                    <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                    <Text style={{ fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold, marginTop: 16 }}>Call Ended</Text>
                    <Text style={{ fontSize: SIZES.md, color: COLORS.textMuted, marginTop: 4 }}>Duration: {formatDuration(duration)}</Text>
                </View>
            )}
        </View>
    );
};

const vs = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    remoteVideo: { ...StyleSheet.absoluteFillObject },
    videoPlaceholder: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.primary },
    avatarText: { fontSize: 36, color: COLORS.primary, ...FONTS.bold },
    connectingDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary },
    connectingText: { color: COLORS.textMuted, fontSize: SIZES.md, marginTop: 12 },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
    callerName: { fontSize: SIZES.lg, color: '#fff', ...FONTS.bold },
    callerSpec: { fontSize: SIZES.sm, color: COLORS.textMuted },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
    statusText: { fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold },
    localVideo: { position: 'absolute', top: 110, right: 16, width: 110, height: 150, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.card },
    videoOffOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
    networkBadge: { position: 'absolute', top: 270, right: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    extraActions: { position: 'absolute', bottom: 140, left: 20, right: 20, flexDirection: 'row', gap: 10 },
    extraBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.primary + '40' },
    extraBtnTxt: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semiBold },
    controls: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 20, paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.7)' },
    ctrlBtn: { alignItems: 'center', gap: 4 },
    ctrlBtnActive: { opacity: 0.9 },
    ctrlLabel: { fontSize: 10, color: COLORS.textMuted },
    endBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
    chatPanel: { position: 'absolute', bottom: 120, left: 16, right: 16, maxHeight: 280, backgroundColor: COLORS.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    chatBubble: { borderRadius: 12, padding: 10, marginBottom: 6, maxWidth: '80%' },
    chatMe: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
    chatOther: { backgroundColor: COLORS.background, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
    endedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
});

export default VideoConsultationScreen;
