import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const UPCOMING = [
    { id: 1, doctor: 'Dr. Raj Sharma', spec: 'General Physician', date: 'Today, 3:00 PM', status: 'confirmed', type: 'In-Person', fee: 300 },
    { id: 2, doctor: 'Dr. Anita Desai', spec: 'Orthopedic Surgeon', date: 'Tomorrow, 11:00 AM', status: 'pending', type: 'Video', fee: 500 },
    { id: 3, doctor: 'Dr. Vikram Patel', spec: 'Cardiologist', date: '28 Apr, 9:30 AM', status: 'confirmed', type: 'In-Person', fee: 800 },
];

const SCANS = [
    { id: 1, type: 'CT', bodyPart: 'Chest', date: '20 Apr 2026', status: 'approved', risk: 'low', finding: 'Normal Study' },
    { id: 2, type: 'MRI', bodyPart: 'Spine', date: '15 Apr 2026', status: 'approved', risk: 'medium', finding: 'Disc Herniation L4-L5' },
    { id: 3, type: 'X-Ray', bodyPart: 'Hand', date: '02 Apr 2026', status: 'approved', risk: 'low', finding: 'No Fracture Detected' },
];

const VITALS = [
    { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', icon: 'heart', color: COLORS.success, trend: '↓ Normal' },
    { label: 'Heart Rate', value: '72', unit: 'bpm', icon: 'pulse', color: COLORS.primary, trend: '→ Stable' },
    { label: 'SpO2', value: '98', unit: '%', icon: 'water', color: COLORS.info, trend: '↑ Good' },
    { label: 'Blood Sugar', value: '94', unit: 'mg/dL', icon: 'flask', color: COLORS.warning, trend: '→ Normal' },
];

const RC = r => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger }[r] || COLORS.textMuted);
const SC = s => ({ confirmed: COLORS.success, pending: COLORS.warning, cancelled: COLORS.danger }[s] || COLORS.textMuted);

const PatientHomeScreen = ({ navigation, route }) => {
    const user = route?.params?.user || { firstName: 'Ravi', lastName: 'Teja', bloodGroup: 'O+', allergies: ['Penicillin'] };
    const [activeTab, setActiveTab] = useState('overview');
    const [sosModal, setSosModal] = useState(false);

    return (
        <View style={ph.root}>
            {/* Header */}
            <View style={ph.header}>
                <View style={ph.headerGlow} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={ph.greeting}>Good Morning,</Text>
                        <Text style={ph.name}>{user.firstName} {user.lastName} 👋</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={ph.iconBtn} onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications" size={20} color={COLORS.primary} />
                            <View style={ph.badge}><Text style={ph.badgeTxt}>3</Text></View>
                        </TouchableOpacity>
                        <TouchableOpacity style={ph.iconBtn} onPress={() => setSosModal(true)}>
                            <Ionicons name="flash" size={20} color={COLORS.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Health ID card */}
                <View style={ph.idCard}>
                    <View>
                        <Text style={ph.idLabel}>ABHA Health ID</Text>
                        <Text style={ph.idValue}>91-1234-5678-9012</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={ph.idLabel}>Blood Group</Text>
                        <Text style={[ph.idValue, { color: COLORS.danger }]}>{user.bloodGroup || 'O+'}</Text>
                    </View>
                    <View style={[ph.idChip]}>
                        <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
                        <Text style={{ fontSize: 10, color: COLORS.success, ...FONTS.bold }}>Verified</Text>
                    </View>
                </View>
            </View>

            {/* Tab bar */}
            <View style={ph.tabBar}>
                {['overview', 'scans', 'appointments', 'history'].map(t => (
                    <TouchableOpacity key={t} style={[ph.tab, activeTab === t && ph.tabActive]} onPress={() => setActiveTab(t)}>
                        <Text style={[ph.tabTxt, activeTab === t && { color: COLORS.primary }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={ph.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {activeTab === 'overview' && <>
                    {/* Quick actions */}
                    <Text style={ph.sectionTitle}>Quick Actions</Text>
                    <View style={ph.qaGrid}>
                        {[
                            { icon: 'scan', label: 'Upload Scan', color: COLORS.primary, screen: 'UploadScan' },
                            { icon: 'medical', label: 'Symptom Check', color: COLORS.secondary, screen: 'SymptomChecker' },
                            { icon: 'document-text', label: 'My Reports', color: COLORS.success, screen: 'Reports' },
                            { icon: 'people', label: '2nd Opinion', color: COLORS.warning, screen: 'Marketplace' },
                            { icon: 'wallet', label: 'Wallet', color: '#AB47BC', screen: 'Wallet' },
                            { icon: 'flash', label: 'Emergency', color: COLORS.danger, screen: 'Emergency' },
                        ].map((q, i) => (
                            <TouchableOpacity key={i} style={[ph.qaCard, { borderColor: q.color + '30' }]} onPress={() => navigation.navigate(q.screen)}>
                                <View style={[ph.qaIcon, { backgroundColor: q.color + '20' }]}>
                                    <Ionicons name={q.icon} size={22} color={q.color} />
                                </View>
                                <Text style={ph.qaLabel}>{q.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Vitals */}
                    <Text style={ph.sectionTitle}>Today's Vitals</Text>
                    <View style={ph.vitalsGrid}>
                        {VITALS.map((v, i) => (
                            <View key={i} style={[ph.vitalCard, { borderColor: v.color + '30' }]}>
                                <View style={[ph.vitalIcon, { backgroundColor: v.color + '20' }]}>
                                    <Ionicons name={v.icon} size={16} color={v.color} />
                                </View>
                                <Text style={[ph.vitalVal, { color: v.color }]}>{v.value}<Text style={ph.vitalUnit}> {v.unit}</Text></Text>
                                <Text style={ph.vitalLabel}>{v.label}</Text>
                                <Text style={[ph.vitalTrend, { color: v.color }]}>{v.trend}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Upcoming appointment */}
                    <Text style={ph.sectionTitle}>Next Appointment</Text>
                    {UPCOMING[0] && (
                        <View style={ph.apptCard}>
                            <View style={[ph.apptStripe, { backgroundColor: SC(UPCOMING[0].status) }]} />
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={ph.apptDoc}>{UPCOMING[0].doctor}</Text>
                                    <View style={{ backgroundColor: SC(UPCOMING[0].status) + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: SC(UPCOMING[0].status) + '50' }}>
                                        <Text style={{ fontSize: 9, color: SC(UPCOMING[0].status), ...FONTS.bold }}>{UPCOMING[0].status.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <Text style={ph.apptSpec}>{UPCOMING[0].spec}</Text>
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="calendar" size={12} color={COLORS.textMuted} /><Text style={ph.apptMeta}>{UPCOMING[0].date}</Text></View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="videocam" size={12} color={COLORS.textMuted} /><Text style={ph.apptMeta}>{UPCOMING[0].type}</Text></View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="cash" size={12} color={COLORS.textMuted} /><Text style={ph.apptMeta}>₹{UPCOMING[0].fee}</Text></View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* AI Health summary */}
                    <View style={ph.aiCard}>
                        <View style={ph.aiCardGlow} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                            </View>
                            <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.bold }}>AI Health Summary</Text>
                            <View style={{ marginLeft: 'auto', backgroundColor: COLORS.success + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                                <Text style={{ fontSize: 9, color: COLORS.success, ...FONTS.bold }}>LOW RISK</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 }}>All vitals are within normal range. Last scan (20 Apr) showed no significant findings. Your spine follow-up is recommended within 3 months per your last MRI.</Text>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }} onPress={() => navigation.navigate('SymptomChecker')}>
                            <Text style={{ fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semiBold }}>Start AI Symptom Check</Text>
                            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </>}

                {activeTab === 'scans' && <>
                    <Text style={ph.sectionTitle}>Radiology Reports</Text>
                    {SCANS.map(s => (
                        <TouchableOpacity key={s.id} style={ph.scanCard} onPress={() => navigation.navigate('ReportViewer', { scan: s })}>
                            <View style={[ph.scanType, { backgroundColor: COLORS.primary + '20' }]}>
                                <Ionicons name="scan" size={20} color={COLORS.primary} />
                                <Text style={{ fontSize: 10, color: COLORS.primary, ...FONTS.bold, marginTop: 2 }}>{s.type}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.bold }}>{s.bodyPart}</Text>
                                <Text style={{ fontSize: SIZES.sm, color: RC(s.risk) }}>{s.finding}</Text>
                                <Text style={{ fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 3 }}>{s.date}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                <View style={{ backgroundColor: COLORS.success + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                                    <Text style={{ fontSize: 9, color: COLORS.success, ...FONTS.bold }}>APPROVED</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                            </View>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={ph.uploadBtn} onPress={() => navigation.navigate('UploadScan')}>
                        <Ionicons name="cloud-upload" size={20} color="#fff" />
                        <Text style={{ fontSize: SIZES.md, color: '#fff', ...FONTS.bold }}>Upload New Scan</Text>
                    </TouchableOpacity>
                </>}

                {activeTab === 'appointments' && <>
                    <Text style={ph.sectionTitle}>All Appointments</Text>
                    {UPCOMING.map(a => (
                        <View key={a.id} style={ph.apptCard}>
                            <View style={[ph.apptStripe, { backgroundColor: SC(a.status) }]} />
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={ph.apptDoc}>{a.doctor}</Text>
                                    <Text style={[ph.apptMeta, { color: SC(a.status) }]}>{a.status.toUpperCase()}</Text>
                                </View>
                                <Text style={ph.apptSpec}>{a.spec}</Text>
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="calendar" size={11} color={COLORS.textMuted} /><Text style={ph.apptMeta}>{a.date}</Text></View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="cash" size={11} color={COLORS.textMuted} /><Text style={ph.apptMeta}>₹{a.fee}</Text></View>
                                </View>
                            </View>
                        </View>
                    ))}
                </>}

                {activeTab === 'history' && (
                    <View style={[ph.aiCard, { backgroundColor: COLORS.card }]}>
                        <Text style={{ color: COLORS.textMuted, textAlign: 'center', padding: 24 }}>Medical history, lab results, and previous prescriptions will appear here.</Text>
                    </View>
                )}
            </ScrollView>

            {/* SOS Modal */}
            <Modal visible={sosModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: COLORS.card, borderRadius: 24, padding: 32, width: '100%', borderWidth: 2, borderColor: COLORS.danger + '50', alignItems: 'center' }}>
                        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.danger + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Ionicons name="flash" size={36} color={COLORS.danger} />
                        </View>
                        <Text style={{ fontSize: 24, color: '#fff', ...FONTS.bold, marginBottom: 8 }}>Emergency SOS</Text>
                        <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 }}>This will immediately alert emergency services and share your location with your emergency contact: Sita Teja</Text>
                        <TouchableOpacity style={{ width: '100%', backgroundColor: COLORS.danger, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
                            onPress={() => { setSosModal(false); navigation.navigate('Emergency'); }}>
                            <Text style={{ fontSize: SIZES.lg, color: '#fff', ...FONTS.bold }}>🚨 Call Emergency Services</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSosModal(false)}>
                            <Text style={{ color: COLORS.textMuted, fontSize: SIZES.md }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const ph = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, overflow: 'hidden', position: 'relative' },
    headerGlow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.primary + '15' },
    greeting: { fontSize: SIZES.sm, color: COLORS.textMuted },
    name: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },
    iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
    badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
    badgeTxt: { fontSize: 8, color: '#fff', ...FONTS.bold },
    idCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.primary + '30' },
    idLabel: { fontSize: 9, color: COLORS.textMuted, ...FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
    idValue: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold, marginTop: 2 },
    idChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabTxt: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold, textTransform: 'capitalize' },
    scroll: { flex: 1 },
    sectionTitle: { fontSize: SIZES.md, color: '#fff', ...FONTS.bold, marginBottom: 12, marginTop: 4 },
    qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    qaCard: { width: '30%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1, flexGrow: 1 },
    qaIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    qaLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, ...FONTS.semiBold, textAlign: 'center' },
    vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    vitalCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 14, borderWidth: 1, flexGrow: 1 },
    vitalIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    vitalVal: { fontSize: SIZES.xxl, ...FONTS.bold },
    vitalUnit: { fontSize: SIZES.xs, color: COLORS.textMuted },
    vitalLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    vitalTrend: { fontSize: SIZES.xs, ...FONTS.semiBold, marginTop: 4 },
    apptCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 10, overflow: 'hidden', gap: 12 },
    apptStripe: { width: 4, borderRadius: 2 },
    apptDoc: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    apptSpec: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
    apptMeta: { fontSize: SIZES.xs, color: COLORS.textMuted },
    aiCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 20, borderWidth: 1, borderColor: COLORS.primary + '30', overflow: 'hidden', position: 'relative', marginBottom: 12 },
    aiCardGlow: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary + '12' },
    scanCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, gap: 14, alignItems: 'center' },
    scanType: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, paddingVertical: 14, marginTop: 8 },
});

export default PatientHomeScreen;
