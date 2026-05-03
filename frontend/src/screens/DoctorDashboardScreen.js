import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const TODAY_PATIENTS = [
    { id: 1, name: 'Ravi Teja', age: 31, gender: 'M', time: '9:00 AM', type: 'In-Person', complaint: 'Chest pain, shortness of breath', urgency: 'high', status: 'waiting' },
    { id: 2, name: 'Priya Sharma', age: 45, gender: 'F', time: '10:30 AM', type: 'Video', complaint: 'Follow-up spine MRI', urgency: 'normal', status: 'completed' },
    { id: 3, name: 'Amit Kumar', age: 58, gender: 'M', time: '11:30 AM', type: 'In-Person', complaint: 'Routine check-up', urgency: 'normal', status: 'upcoming' },
    { id: 4, name: 'Lakshmi Devi', age: 62, gender: 'F', time: '2:00 PM', type: 'Video', complaint: 'Diabetes management', urgency: 'normal', status: 'upcoming' },
    { id: 5, name: 'Sanjay Gupta', age: 39, gender: 'M', time: '3:30 PM', type: 'In-Person', complaint: 'Cardiac evaluation', urgency: 'high', status: 'upcoming' },
];

const PENDING_REPORTS = [
    { id: 1, patient: 'Ravi Teja', scan: 'CT Chest', date: '24 Apr', aiRisk: 'high', aiConf: 94 },
    { id: 2, patient: 'Aarti Singh', scan: 'Mammography', date: '23 Apr', aiRisk: 'medium', aiConf: 76 },
];

const UC = u => ({ high: COLORS.danger, normal: COLORS.success }[u] || COLORS.textMuted);
const SC = s => ({ waiting: COLORS.warning, completed: COLORS.success, upcoming: COLORS.primary }[s] || COLORS.textMuted);

const KPICard = ({ label, value, icon, color, sub }) => (
    <View style={[dds.kpi, { borderColor: color + '30' }]}>
        <View style={[dds.kpiIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[dds.kpiVal, { color }]}>{value}</Text>
        <Text style={dds.kpiLabel}>{label}</Text>
        {sub && <Text style={[dds.kpiSub, { color }]}>{sub}</Text>}
    </View>
);

const DoctorDashboardScreen = ({ navigation, route }) => {
    const user = route?.params?.user || { firstName: 'Raj', lastName: 'Sharma', specialization: 'General Physician', hospital: 'CareConnect City Hospital', rating: 4.8 };
    const [activeTab, setActiveTab] = useState('today');
    const [patientModal, setPatientModal] = useState(null);

    return (
        <View style={dds.root}>
            {/* Header */}
            <View style={dds.header}>
                <View style={dds.headerGlow} />
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={dds.sub}>Doctor Dashboard</Text>
                        <Text style={dds.name}>Dr. {user.firstName} {user.lastName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={[dds.specBadge]}>
                                <Ionicons name="medical" size={10} color={COLORS.primary} />
                                <Text style={dds.specTxt}>{user.specialization || 'General Physician'}</Text>
                            </View>
                            <View style={dds.ratingBadge}>
                                <Ionicons name="star" size={10} color={COLORS.warning} />
                                <Text style={dds.ratingTxt}>{user.rating || 4.8}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
                        <View style={dds.analyticBtn}>
                            <Ionicons name="bar-chart" size={18} color={COLORS.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* KPI strip */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ gap: 10 }}>
                    <KPICard label="Today's Patients" value="5" icon="people" color={COLORS.primary} sub="2 urgent" />
                    <KPICard label="Completed" value="1" icon="checkmark-circle" color={COLORS.success} />
                    <KPICard label="Pending Reports" value="2" icon="document-text" color={COLORS.warning} sub="AI assisted" />
                    <KPICard label="Rating" value="4.8" icon="star" color={COLORS.warning} />
                    <KPICard label="Revenue Today" value="₹2,400" icon="cash" color="#AB47BC" />
                </ScrollView>
            </View>

            {/* Tab bar */}
            <View style={dds.tabBar}>
                {['today', 'reports', 'consultations', 'analytics'].map(t => (
                    <TouchableOpacity key={t} style={[dds.tab, activeTab === t && dds.tabActive]} onPress={() => setActiveTab(t)}>
                        <Text style={[dds.tabTxt, activeTab === t && { color: COLORS.primary }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={dds.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {activeTab === 'today' && <>
                    {/* Availability toggle */}
                    <View style={dds.avail}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={dds.availDot} />
                            <Text style={{ fontSize: SIZES.sm, color: COLORS.success, ...FONTS.bold }}>Available for consultations</Text>
                        </View>
                        <TouchableOpacity style={dds.availToggle}>
                            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={dds.sectionTitle}>Today's Queue ({TODAY_PATIENTS.length})</Text>
                    {TODAY_PATIENTS.map(p => (
                        <TouchableOpacity key={p.id} style={dds.patientCard} onPress={() => setPatientModal(p)}>
                            <View style={[dds.timeCol, { borderRightColor: COLORS.border }]}>
                                <Text style={dds.timeMain}>{p.time.split(' ')[0]}</Text>
                                <Text style={dds.timeAmPm}>{p.time.split(' ')[1]}</Text>
                            </View>
                            <View style={{ flex: 1, paddingLeft: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <Text style={dds.patName}>{p.name}</Text>
                                    <View style={{ backgroundColor: SC(p.status) + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: SC(p.status) + '40' }}>
                                        <Text style={{ fontSize: 9, color: SC(p.status), ...FONTS.bold }}>{p.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <Text style={dds.patSub}>{p.age}{p.gender} · {p.type}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                                    <View style={[dds.urgencyDot, { backgroundColor: UC(p.urgency) }]} />
                                    <Text style={dds.complaint}>{p.complaint}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </>}

                {activeTab === 'reports' && <>
                    <Text style={dds.sectionTitle}>Pending Scan Reviews</Text>
                    {PENDING_REPORTS.map(r => (
                        <TouchableOpacity key={r.id} style={dds.reportCard} onPress={() => navigation.navigate('ReportViewer', { scan: r })}>
                            <View style={[dds.reportIcon, { backgroundColor: COLORS.warning + '20' }]}>
                                <Ionicons name="document-text" size={20} color={COLORS.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.bold }}>{r.patient}</Text>
                                <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{r.scan} · {r.date}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                                    <Text style={{ fontSize: SIZES.xs, color: COLORS.primary }}>AI {r.aiConf}% · {r.aiRisk.toUpperCase()} risk</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    ))}
                </>}

                {activeTab === 'consultations' && (
                    <View style={[dds.reportCard, { flexDirection: 'column', alignItems: 'center', padding: 32 }]}>
                        <Ionicons name="videocam" size={48} color={COLORS.primary} />
                        <Text style={{ color: COLORS.textMuted, marginTop: 12, textAlign: 'center' }}>Video consultation history and upcoming teleconsultations will appear here.</Text>
                    </View>
                )}

                {activeTab === 'analytics' && (
                    <TouchableOpacity style={[dds.reportCard, { flexDirection: 'column', alignItems: 'center', padding: 32 }]}
                        onPress={() => navigation.navigate('Analytics')}>
                        <Ionicons name="bar-chart" size={48} color={COLORS.primary} />
                        <Text style={{ color: '#fff', marginTop: 12, ...FONTS.bold, fontSize: SIZES.base }}>Open Full Analytics</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Patient action modal */}
            <Modal visible={!!patientModal} transparent animationType="slide">
                <View style={dds.modOverlay}>
                    <View style={dds.modCard}>
                        {patientModal && <>
                            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => setPatientModal(null)}>
                                <Ionicons name="close" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="person" size={22} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: SIZES.xl, color: '#fff', ...FONTS.bold }}>{patientModal.name}</Text>
                                    <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{patientModal.age}{patientModal.gender} · {patientModal.time} · {patientModal.type}</Text>
                                </View>
                            </View>
                            <View style={{ gap: 10 }}>
                                {[
                                    { icon: 'videocam', label: 'Start Consultation', color: COLORS.primary, screen: 'SymptomChecker' },
                                    { icon: 'document-text', label: 'View Reports & Scans', color: COLORS.success, screen: 'ReportViewer' },
                                    { icon: 'create', label: 'Write Prescription', color: COLORS.warning, screen: 'ReportEditor' },
                                    { icon: 'people', label: 'Request Second Opinion', color: COLORS.secondary, screen: 'Marketplace' },
                                ].map((a, i) => (
                                    <TouchableOpacity key={i} style={dds.modAction} onPress={() => { setPatientModal(null); navigation.navigate(a.screen, { patient: patientModal }); }}>
                                        <Ionicons name={a.icon} size={18} color={a.color} />
                                        <Text style={[dds.modActionTxt, { color: a.color }]}>{a.label}</Text>
                                        <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const dds = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, overflow: 'hidden', position: 'relative' },
    headerGlow: { position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.primary + '12' },
    sub: { fontSize: SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, ...FONTS.bold },
    name: { fontSize: SIZES.xxl + 2, color: '#fff', ...FONTS.bold, marginTop: 2 },
    specBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryGlow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    specTxt: { fontSize: 10, color: COLORS.primary, ...FONTS.semiBold },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warning + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    ratingTxt: { fontSize: 10, color: COLORS.warning, ...FONTS.bold },
    analyticBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    kpi: { backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg, padding: 14, minWidth: 100, borderWidth: 1, alignItems: 'center' },
    kpiIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    kpiVal: { fontSize: SIZES.xl, ...FONTS.bold },
    kpiLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', ...FONTS.semiBold, marginTop: 2 },
    kpiSub: { fontSize: 9, ...FONTS.bold, marginTop: 2 },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabTxt: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold },
    scroll: { flex: 1 },
    sectionTitle: { fontSize: SIZES.md, color: '#fff', ...FONTS.bold, marginBottom: 12, marginTop: 4 },
    avail: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.success + '0a', borderRadius: SIZES.radius, padding: 12, borderWidth: 1, borderColor: COLORS.success + '30', marginBottom: 16 },
    availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
    availToggle: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: COLORS.card, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
    patientCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, alignItems: 'center' },
    timeCol: { alignItems: 'center', paddingRight: 12, borderRightWidth: 1, minWidth: 52 },
    timeMain: { fontSize: SIZES.lg, color: '#fff', ...FONTS.bold },
    timeAmPm: { fontSize: 10, color: COLORS.textMuted },
    patName: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    patSub: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 1 },
    urgencyDot: { width: 5, height: 5, borderRadius: 3 },
    complaint: { flex: 1, fontSize: SIZES.xs, color: COLORS.textSecondary },
    reportCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, gap: 14, alignItems: 'center' },
    reportIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    modOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 },
    modAction: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    modActionTxt: { fontSize: SIZES.md, ...FONTS.semiBold },
});

export default DoctorDashboardScreen;
