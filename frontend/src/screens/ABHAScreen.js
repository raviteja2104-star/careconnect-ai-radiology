import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { COLORS, SIZES, FONTS } from '../utils/theme';

// ── ABHA API helpers ───────────────────────────────────────────────────────
const abdmAPI = {
    generateOtp: (data) => api.post('/abdm/generate-otp', data),
    verifyOtp: (data) => api.post('/abdm/verify-otp', data),
    getProfile: () => api.get('/abdm/profile'),
    getConsents: () => api.get('/abdm/consents'),
    approveConsent: (id) => api.post(`/abdm/consents/${id}/approve`),
    denyConsent: (id) => api.post(`/abdm/consents/${id}/deny`),
    revokeConsent: (id) => api.post(`/abdm/consents/${id}/revoke`),
};

const STATUS_COLOR = {
    REQUESTED: COLORS.warning,
    GRANTED: COLORS.success,
    DENIED: COLORS.danger,
    EXPIRED: COLORS.textMuted,
    REVOKED: COLORS.textMuted,
};

const ABHAScreen = ({ navigation }) => {
    // Enrollment state machine
    const [step, setStep] = useState('idle'); // idle | method | otp | verifying | done
    const [method, setMethod] = useState('aadhaar');
    const [input, setInput] = useState('');
    const [txnId, setTxnId] = useState('');
    const [otp, setOtp] = useState('');
    const [enrolledAbha, setEnrolledAbha] = useState(null);
    const [enrollError, setEnrollError] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Consent state
    const [consents, setConsents] = useState([]);
    const [consentsLoading, setConsentsLoading] = useState(false);
    const [consentTab, setConsentTab] = useState('pending');
    const [consentError, setConsentError] = useState('');
    const [actionInFlight, setActionInFlight] = useState(null);

    const loadConsents = useCallback(async () => {
        setConsentsLoading(true);
        setConsentError('');
        try {
            const res = await abdmAPI.getConsents();
            setConsents(res.data || []);
        } catch {
            setConsentError('Could not load consent requests.');
        } finally {
            setConsentsLoading(false);
        }
    }, []);

    React.useEffect(() => { loadConsents(); }, [loadConsents]);

    const sendOtp = async () => {
        if (input.length < 10) {
            setEnrollError('Enter a valid ' + (method === 'aadhaar' ? '12-digit Aadhaar' : '10-digit mobile') + ' number.');
            return;
        }
        setSendingOtp(true);
        setEnrollError('');
        try {
            const payload = method === 'aadhaar' ? { aadhaar: input, method } : { mobile: input, method };
            const res = await abdmAPI.generateOtp(payload);
            setTxnId(res.data?.txnId || '');
            setStep('otp');
        } catch (e) {
            setEnrollError(e?.message || 'Failed to send OTP. Try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    const verifyOtp = async () => {
        if (otp.length !== 6) { setEnrollError('Enter 6-digit OTP.'); return; }
        setVerifying(true);
        setEnrollError('');
        try {
            const res = await abdmAPI.verifyOtp({ txnId, otp });
            const data = res.data || {};
            setEnrolledAbha(data);
            await AsyncStorage.mergeItem('user', JSON.stringify({ abhaAddress: data.abhaAddress, abhaNumber: data.abhaNumber }));
            setStep('done');
            await loadConsents();
        } catch (e) {
            setEnrollError(e?.message || 'OTP verification failed. Try again.');
        } finally {
            setVerifying(false);
        }
    };

    const doConsentAction = async (id, action) => {
        setActionInFlight(id + action);
        try {
            if (action === 'approve') await abdmAPI.approveConsent(id);
            else if (action === 'deny') await abdmAPI.denyConsent(id);
            else if (action === 'revoke') await abdmAPI.revokeConsent(id);
            await loadConsents();
        } catch {
            Alert.alert('Error', 'Action failed — please try again.');
        } finally {
            setActionInFlight(null);
        }
    };

    const pendingConsents = consents.filter(c => c.status === 'REQUESTED');
    const historyConsents = consents.filter(c => c.status !== 'REQUESTED');

    return (
        <View style={s.root}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>ABHA Health ID</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* ABHA Card */}
                <View style={s.abhaCard}>
                    <View style={s.abhaGlow} />
                    <View style={s.abhaTopRow}>
                        <View style={s.abhaIconWrap}>
                            <Ionicons name="finger-print" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={s.abhaLabel}>ABHA HEALTH ID</Text>
                        {(step === 'done' || enrolledAbha) && (
                            <View style={s.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                                <Text style={s.verifiedTxt}>Enrolled</Text>
                            </View>
                        )}
                    </View>

                    {/* ── idle: show enroll button ── */}
                    {step === 'idle' && !enrolledAbha && (
                        <TouchableOpacity style={s.enrollBtn} onPress={() => setStep('method')}>
                            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
                            <Text style={s.enrollTxt}>Enroll ABHA</Text>
                            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}

                    {/* ── method: choose Aadhaar / Mobile + enter input ── */}
                    {step === 'method' && (
                        <View style={{ gap: 12, marginTop: 8 }}>
                            <View style={s.methodRow}>
                                {['aadhaar', 'mobile'].map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[s.methodBtn, method === m && s.methodActive]}
                                        onPress={() => setMethod(m)}
                                    >
                                        <Ionicons
                                            name={m === 'aadhaar' ? 'card' : 'phone-portrait'}
                                            size={14}
                                            color={method === m ? '#fff' : COLORS.textMuted}
                                        />
                                        <Text style={[s.methodTxt, method === m && { color: '#fff' }]}>
                                            {m === 'aadhaar' ? 'Aadhaar' : 'Mobile'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={s.inputField}
                                placeholder={method === 'aadhaar' ? 'Aadhaar number' : 'Mobile number'}
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="number-pad"
                                maxLength={method === 'aadhaar' ? 12 : 10}
                                value={input}
                                onChangeText={setInput}
                            />
                            {enrollError ? <Text style={s.errorTxt}>{enrollError}</Text> : null}
                            <View style={s.rowGap}>
                                <TouchableOpacity style={s.sendOtpBtn} onPress={sendOtp} disabled={sendingOtp}>
                                    {sendingOtp
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={s.sendOtpTxt}>Send OTP</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={s.cancelBtn} onPress={() => { setStep('idle'); setInput(''); setEnrollError(''); }}>
                                    <Text style={s.cancelTxt}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ── otp: verify ── */}
                    {step === 'otp' && (
                        <View style={{ gap: 12, marginTop: 8 }}>
                            <Text style={s.otpHint}>Enter the OTP sent to your {method}</Text>
                            <TextInput
                                style={s.inputField}
                                placeholder="6-digit OTP"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={setOtp}
                                autoFocus
                            />
                            {enrollError ? <Text style={s.errorTxt}>{enrollError}</Text> : null}
                            <View style={s.rowGap}>
                                <TouchableOpacity style={s.sendOtpBtn} onPress={verifyOtp} disabled={verifying}>
                                    {verifying
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={s.sendOtpTxt}>Verify</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={s.cancelBtn} onPress={() => { setStep('method'); setOtp(''); }}>
                                    <Text style={s.cancelTxt}>Back</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ── done ── */}
                    {step === 'done' && enrolledAbha && (
                        <View style={{ marginTop: 8, gap: 4 }}>
                            <Text style={s.abhaAddr}>{enrolledAbha.abhaAddress}</Text>
                            <Text style={s.abhaNum}>{enrolledAbha.abhaNumber}</Text>
                            <Text style={s.abhaDemoNote}>Demo mode — connect ABDM sandbox for live registration</Text>
                        </View>
                    )}
                </View>

                {/* ABHA explainer */}
                <View style={s.infoCard}>
                    <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={s.infoTitle}>Your data, your control</Text>
                        <Text style={s.infoBody}>
                            Under India's ABDM framework, healthcare institutions (HIUs) must request your consent before accessing your health records. You can approve, deny, or revoke any request at any time.
                        </Text>
                    </View>
                </View>

                {/* Consent tabs */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Data Consent Requests</Text>
                    <TouchableOpacity onPress={loadConsents}>
                        <Ionicons name="refresh" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <View style={s.tabs}>
                    {['pending', 'history'].map(t => (
                        <TouchableOpacity key={t} style={[s.tab, consentTab === t && s.tabActive]} onPress={() => setConsentTab(t)}>
                            <Text style={[s.tabTxt, consentTab === t && { color: '#fff' }]}>
                                {t === 'pending' ? `Pending${pendingConsents.length ? ` · ${pendingConsents.length}` : ''}` : 'History'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {consentsLoading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />}
                {consentError ? <Text style={[s.errorTxt, { textAlign: 'center', marginTop: 16 }]}>{consentError}</Text> : null}

                {!consentsLoading && consentTab === 'pending' && (
                    pendingConsents.length === 0
                        ? <Text style={s.emptyTxt}>No pending consent requests</Text>
                        : pendingConsents.map(cr => (
                            <ConsentCard
                                key={cr._id || cr.consentRequestId}
                                cr={cr}
                                mode="pending"
                                actionInFlight={actionInFlight}
                                onApprove={() => doConsentAction(cr._id, 'approve')}
                                onDeny={() => doConsentAction(cr._id, 'deny')}
                            />
                        ))
                )}

                {!consentsLoading && consentTab === 'history' && (
                    historyConsents.length === 0
                        ? <Text style={s.emptyTxt}>No consent history</Text>
                        : historyConsents.map(cr => (
                            <ConsentCard
                                key={cr._id || cr.consentRequestId}
                                cr={cr}
                                mode="history"
                                actionInFlight={actionInFlight}
                                onRevoke={() => doConsentAction(cr._id, 'revoke')}
                            />
                        ))
                )}
            </ScrollView>
        </View>
    );
};

const ConsentCard = ({ cr, mode, actionInFlight, onApprove, onDeny, onRevoke }) => {
    const busy = actionInFlight?.startsWith(cr._id);
    return (
        <View style={s.consentCard}>
            <View style={s.consentTopRow}>
                <Text style={s.requesterName}>{cr.requesterName || 'Healthcare Provider'}</Text>
                <View style={[s.statusBadge, { backgroundColor: (STATUS_COLOR[cr.status] || COLORS.textMuted) + '25' }]}>
                    <Text style={[s.statusTxt, { color: STATUS_COLOR[cr.status] || COLORS.textMuted }]}>{cr.status}</Text>
                </View>
            </View>
            <Text style={s.consentPurpose}>{cr.purposeText || cr.purpose}</Text>
            {cr.hiTypes?.length > 0 && (
                <View style={s.hiTypeRow}>
                    {cr.hiTypes.map((h, i) => (
                        <View key={i} style={s.hiTypeBadge}><Text style={s.hiTypeTxt}>{h}</Text></View>
                    ))}
                </View>
            )}
            {(cr.dateFrom || cr.dateTo) && (
                <Text style={s.dateRange}>
                    {cr.dateFrom ? new Date(cr.dateFrom).toLocaleDateString('en-IN') : '?'} —{' '}
                    {cr.dateTo ? new Date(cr.dateTo).toLocaleDateString('en-IN') : '?'}
                </Text>
            )}
            {cr.demo && <Text style={s.demoTag}>Demo</Text>}

            {mode === 'pending' && (
                <View style={s.actionRow}>
                    <TouchableOpacity
                        style={[s.denyBtn, busy && { opacity: 0.5 }]}
                        onPress={onDeny}
                        disabled={!!busy}
                    >
                        {busy && actionInFlight === cr._id + 'deny'
                            ? <ActivityIndicator size="small" color={COLORS.danger} />
                            : <Text style={s.denyTxt}>Deny</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.approveBtn, busy && { opacity: 0.5 }]}
                        onPress={onApprove}
                        disabled={!!busy}
                    >
                        {busy && actionInFlight === cr._id + 'approve'
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={s.approveTxt}>Approve</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {mode === 'history' && cr.status === 'GRANTED' && (
                <TouchableOpacity
                    style={[s.revokeBtn, busy && { opacity: 0.5 }]}
                    onPress={onRevoke}
                    disabled={!!busy}
                >
                    {busy ? <ActivityIndicator size="small" color={COLORS.danger} /> : <Text style={s.revokeTxt}>Revoke Access</Text>}
                </TouchableOpacity>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },

    abhaCard: { margin: 24, marginTop: 0, backgroundColor: COLORS.primaryDark, borderRadius: SIZES.radiusXl, padding: 24, overflow: 'hidden' },
    abhaGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.primary + '25', top: -70, right: -50 },
    abhaTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    abhaIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,191,166,0.2)', alignItems: 'center', justifyContent: 'center' },
    abhaLabel: { flex: 1, fontSize: SIZES.xs, color: 'rgba(255,255,255,0.7)', ...FONTS.semiBold, letterSpacing: 1, textTransform: 'uppercase' },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    verifiedTxt: { fontSize: SIZES.xs, color: COLORS.success, ...FONTS.semiBold },

    enrollBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,191,166,0.15)', borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.primary + '60', paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start' },
    enrollTxt: { color: COLORS.primary, ...FONTS.semiBold, fontSize: SIZES.sm },

    methodRow: { flexDirection: 'row', gap: 8 },
    methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: SIZES.radius, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    methodActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    methodTxt: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.medium },

    inputField: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: SIZES.radius, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, fontSize: SIZES.base },
    rowGap: { flexDirection: 'row', gap: 10 },
    sendOtpBtn: { flex: 2, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    sendOtpTxt: { color: '#fff', ...FONTS.bold, fontSize: SIZES.sm },
    cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: SIZES.radius, paddingVertical: 12, alignItems: 'center' },
    cancelTxt: { color: COLORS.textMuted, ...FONTS.medium, fontSize: SIZES.sm },
    otpHint: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)' },
    errorTxt: { fontSize: SIZES.sm, color: COLORS.danger },

    abhaAddr: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    abhaNum: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    abhaDemoNote: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontStyle: 'italic' },

    infoCard: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.primaryGlow, borderRadius: SIZES.radiusLg, padding: 16, marginHorizontal: 24, marginBottom: 24, borderWidth: 1, borderColor: COLORS.primary + '30' },
    infoTitle: { fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold, marginBottom: 4 },
    infoBody: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12 },
    sectionTitle: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },

    tabs: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: SIZES.radius, backgroundColor: COLORS.card, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabTxt: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.semiBold },

    emptyTxt: { textAlign: 'center', color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 24, paddingHorizontal: 24 },

    consentCard: { marginHorizontal: 24, marginBottom: 12, backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    consentTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    requesterName: { flex: 1, fontSize: SIZES.base, color: '#fff', ...FONTS.semiBold, marginRight: 8 },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusTxt: { fontSize: SIZES.xs, ...FONTS.bold, textTransform: 'uppercase' },
    consentPurpose: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 8 },
    hiTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    hiTypeBadge: { backgroundColor: COLORS.primaryGlow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    hiTypeTxt: { fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.medium },
    dateRange: { fontSize: SIZES.xs, color: COLORS.textMuted, marginBottom: 8 },
    demoTag: { fontSize: SIZES.xs, color: COLORS.warning, ...FONTS.bold, marginBottom: 8, textTransform: 'uppercase' },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    denyBtn: { flex: 1, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.danger + '60', paddingVertical: 10, alignItems: 'center' },
    denyTxt: { color: COLORS.danger, ...FONTS.semiBold, fontSize: SIZES.sm },
    approveBtn: { flex: 2, borderRadius: SIZES.radius, backgroundColor: COLORS.primary, paddingVertical: 10, alignItems: 'center' },
    approveTxt: { color: '#fff', ...FONTS.bold, fontSize: SIZES.sm },

    revokeBtn: { marginTop: 8, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.danger + '50', paddingVertical: 10, alignItems: 'center' },
    revokeTxt: { color: COLORS.danger, ...FONTS.semiBold, fontSize: SIZES.sm },
});

export default ABHAScreen;
