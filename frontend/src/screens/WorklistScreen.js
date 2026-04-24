import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const RC = r => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F', emergency: '#D32F2F' }[r] || COLORS.textMuted);

const FILTERS = ['All', 'Emergency', 'Urgent', 'Routine', 'Pending', 'In Review', 'Completed'];

const MOCK_CASES = [
    { id: 'CC-001', patientName: 'Ravi Teja', age: 31, gender: 'M', scanType: 'CT', bodyPart: 'Head', priority: 'emergency', status: 'pending', aiRisk: 'high', aiConf: 96, finding: 'Subdural Hematoma', centre: 'Apollo Diagnostics', receivedAt: '5 min ago', tat: '< 30 min', assignedTo: null },
    { id: 'CC-002', patientName: 'Priya Sharma', age: 45, gender: 'F', scanType: 'MRI', bodyPart: 'Spine', priority: 'urgent', status: 'in_review', aiRisk: 'medium', aiConf: 82, finding: 'Disc Herniation L4-L5', centre: 'Yashoda Hospitals', receivedAt: '22 min ago', tat: '2 hrs', assignedTo: 'Dr. Kumar' },
    { id: 'CC-003', patientName: 'Amit Kumar', age: 58, gender: 'M', scanType: 'X-Ray', bodyPart: 'Chest', priority: 'normal', status: 'pending', aiRisk: 'low', aiConf: 78, finding: 'Normal Study', centre: 'KIMS Diagnostics', receivedAt: '1 hr ago', tat: '4 hrs', assignedTo: null },
    { id: 'CC-004', patientName: 'Lakshmi Devi', age: 62, gender: 'F', scanType: 'CT', bodyPart: 'Abdomen', priority: 'urgent', status: 'completed', aiRisk: 'high', aiConf: 91, finding: 'Hepatic Mass', centre: 'Care Hospital', receivedAt: '2 hrs ago', tat: 'Done', assignedTo: 'Dr. Rao' },
    { id: 'CC-005', patientName: 'Sanjay Gupta', age: 39, gender: 'M', scanType: 'MRI', bodyPart: 'Cardiac', priority: 'urgent', status: 'pending', aiRisk: 'high', aiConf: 88, finding: 'Myocardial Infarction', centre: 'Maxcure Hospitals', receivedAt: '35 min ago', tat: '1.5 hrs', assignedTo: null },
    { id: 'CC-006', patientName: 'Aarti Singh', age: 27, gender: 'F', scanType: 'Mammography', bodyPart: 'Chest', priority: 'normal', status: 'in_review', aiRisk: 'medium', aiConf: 74, finding: 'Suspicious Calcification', centre: 'LifePoint Labs', receivedAt: '3 hrs ago', tat: '4 hrs', assignedTo: 'Dr. Mehta' },
];

const StatusChip = ({ status }) => {
    const map = {
        pending: { label: 'Pending', color: COLORS.warning },
        in_review: { label: 'In Review', color: COLORS.primary },
        completed: { label: 'Approved', color: COLORS.success },
    };
    const s = map[status] || map.pending;
    return (
        <View style={{ backgroundColor: s.color + '20', borderRadius: 6, borderWidth: 1, borderColor: s.color + '50', paddingHorizontal: 7, paddingVertical: 3 }}>
            <Text style={{ fontSize: 9, color: s.color, ...FONTS.bold }}>{s.label}</Text>
        </View>
    );
};

const PriorityStripe = ({ priority }) => {
    const color = { emergency: '#D32F2F', urgent: COLORS.warning, normal: COLORS.success }[priority] || COLORS.border;
    return <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: color, marginRight: 12 }} />;
};

const CaseCard = ({ c, onPress }) => (
    <TouchableOpacity style={wl.caseCard} onPress={() => onPress(c)}>
        <PriorityStripe priority={c.priority} />
        <View style={{ flex: 1 }}>
            <View style={wl.caseTop}>
                <Text style={wl.caseName}>{c.patientName}</Text>
                <StatusChip status={c.status} />
            </View>
            <View style={wl.caseMeta}>
                <Ionicons name="person" size={10} color={COLORS.textMuted} /><Text style={wl.caseMetaTxt}>{c.age}{c.gender}</Text>
                <Ionicons name="scan" size={10} color={COLORS.textMuted} /><Text style={wl.caseMetaTxt}>{c.scanType} · {c.bodyPart}</Text>
                <Ionicons name="business" size={10} color={COLORS.textMuted} /><Text style={wl.caseMetaTxt}>{c.centre}</Text>
            </View>
            <View style={wl.aiFinding}>
                <View style={[wl.riskDot, { backgroundColor: RC(c.aiRisk) }]} />
                <Text style={[wl.findingTxt, { color: RC(c.aiRisk) }]}>{c.finding}</Text>
                <Text style={wl.confTxt}>AI {c.aiConf}%</Text>
            </View>
            <View style={wl.caseFooter}>
                <Ionicons name="time" size={10} color={COLORS.textMuted} /><Text style={wl.footTxt}>{c.receivedAt}</Text>
                <Ionicons name="hourglass" size={10} color={COLORS.textMuted} /><Text style={wl.footTxt}>TAT: {c.tat}</Text>
                {c.assignedTo && <><Ionicons name="person-circle" size={10} color={COLORS.primary} /><Text style={[wl.footTxt, { color: COLORS.primary }]}>{c.assignedTo}</Text></>}
            </View>
        </View>
    </TouchableOpacity>
);

const WorklistScreen = ({ navigation }) => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [caseModal, setCaseModal] = useState(false);

    const filtered = MOCK_CASES.filter(c => {
        const matchFilter = filter === 'All' || c.priority.toLowerCase() === filter.toLowerCase() || c.status.replace('_', ' ').toLowerCase() === filter.toLowerCase();
        const matchSearch = !search || c.patientName.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search);
        return matchFilter && matchSearch;
    });

    const stats = {
        total: MOCK_CASES.length,
        emergency: MOCK_CASES.filter(c => c.priority === 'emergency').length,
        pending: MOCK_CASES.filter(c => c.status === 'pending').length,
        done: MOCK_CASES.filter(c => c.status === 'completed').length,
    };

    const handleCasePress = (c) => { setSelected(c); setCaseModal(true); };

    return (
        <View style={wl.root}>
            {/* Header */}
            <View style={wl.header}>
                <TouchableOpacity style={wl.back} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={wl.title}>Radiology Worklist</Text>
                    <Text style={wl.sub}>Smart case queue · AI-sorted</Text>
                </View>
                <TouchableOpacity style={wl.hBtn} onPress={() => navigation.navigate('DiagnosticCenter')}>
                    <Ionicons name="add" size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* KPI row */}
            <View style={wl.kpiRow}>
                {[
                    { label: 'Total', value: stats.total, color: COLORS.primary },
                    { label: 'Emergency', value: stats.emergency, color: COLORS.danger },
                    { label: 'Pending', value: stats.pending, color: COLORS.warning },
                    { label: 'Done', value: stats.done, color: COLORS.success },
                ].map((k, i) => (
                    <View key={i} style={[wl.kpi, { borderColor: k.color + '30' }]}>
                        <Text style={[wl.kpiVal, { color: k.color }]}>{k.value}</Text>
                        <Text style={wl.kpiLbl}>{k.label}</Text>
                    </View>
                ))}
            </View>

            {/* Search */}
            <View style={wl.searchRow}>
                <Ionicons name="search" size={16} color={COLORS.textMuted} />
                <TextInput style={wl.searchInput} placeholder="Search patient, case ID…" placeholderTextColor={COLORS.textMuted}
                    value={search} onChangeText={setSearch} />
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={wl.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
                {FILTERS.map(f => (
                    <TouchableOpacity key={f} style={[wl.filterChip, filter === f && wl.filterChipOn]} onPress={() => setFilter(f)}>
                        <Text style={[wl.filterTxt, filter === f && { color: '#fff' }]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Cases */}
            <ScrollView style={wl.list} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
                {filtered.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                        <Ionicons name="document" size={40} color={COLORS.textMuted} />
                        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: SIZES.base }}>No cases match filter</Text>
                    </View>
                )}
                {filtered.map(c => <CaseCard key={c.id} c={c} onPress={handleCasePress} />)}
            </ScrollView>

            {/* Case action modal */}
            <Modal visible={caseModal} transparent animationType="slide">
                <View style={wl.modOverlay}>
                    <View style={wl.modCard}>
                        {selected && <>
                            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => setCaseModal(false)}>
                                <Ionicons name="close" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: RC(selected.aiRisk) + '20', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="scan" size={20} color={RC(selected.aiRisk)} />
                                </View>
                                <View>
                                    <Text style={{ fontSize: SIZES.xl, color: '#fff', ...FONTS.bold }}>{selected.patientName}</Text>
                                    <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{selected.scanType} · {selected.bodyPart} · {selected.id}</Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, borderWidth: 1, borderColor: RC(selected.aiRisk) + '30', marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="sparkles" size={14} color={RC(selected.aiRisk)} />
                                    <Text style={{ fontSize: SIZES.base, color: RC(selected.aiRisk), ...FONTS.bold }}>AI: {selected.finding}</Text>
                                    <Text style={{ marginLeft: 'auto', fontSize: SIZES.lg, color: RC(selected.aiRisk), ...FONTS.bold }}>{selected.aiConf}%</Text>
                                </View>
                                <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 4 }}>Risk Level: {selected.aiRisk?.toUpperCase()} · Priority: {selected.priority?.toUpperCase()}</Text>
                            </View>

                            <View style={{ gap: 10 }}>
                                <TouchableOpacity style={wl.actionBtn} onPress={() => { setCaseModal(false); navigation.navigate('ScanViewer', { scan: selected }); }}>
                                    <Ionicons name="eye" size={18} color={COLORS.primary} />
                                    <Text style={[wl.actionTxt, { color: COLORS.primary }]}>Open Scan Viewer</Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                                <TouchableOpacity style={wl.actionBtn} onPress={() => { setCaseModal(false); navigation.navigate('ReportEditor', { scan: selected }); }}>
                                    <Ionicons name="create" size={18} color={COLORS.success} />
                                    <Text style={[wl.actionTxt, { color: COLORS.success }]}>Write Report</Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.success} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                                <TouchableOpacity style={wl.actionBtn} onPress={() => { setCaseModal(false); navigation.navigate('ReportViewer', { scan: selected }); }}>
                                    <Ionicons name="document-text" size={18} color={COLORS.secondary} />
                                    <Text style={[wl.actionTxt, { color: COLORS.secondary }]}>View Report</Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[wl.actionBtn, { borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '08' }]}
                                    onPress={() => { setCaseModal(false); Alert.alert('Escalated', 'Case escalated to senior radiologist.'); }}>
                                    <Ionicons name="warning" size={18} color={COLORS.danger} />
                                    <Text style={[wl.actionTxt, { color: COLORS.danger }]}>Escalate Case</Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.danger} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                            </View>
                        </>}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const wl = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    back: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    sub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    hBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    kpiRow: { flexDirection: 'row', gap: 10, padding: 16 },
    kpi: { flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 12, alignItems: 'center', borderWidth: 1 },
    kpiVal: { fontSize: SIZES.xxl, ...FONTS.bold },
    kpiLbl: { fontSize: 9, color: COLORS.textMuted, ...FONTS.semiBold, textTransform: 'uppercase', marginTop: 2 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
    searchInput: { flex: 1, fontSize: SIZES.md, color: '#fff' },
    filterBar: { maxHeight: 44, marginBottom: 4 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    filterChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterTxt: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold },
    list: { flex: 1 },
    caseCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 14, overflow: 'hidden' },
    caseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    caseName: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    caseMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
    caseMetaTxt: { fontSize: 10, color: COLORS.textMuted },
    aiFinding: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    riskDot: { width: 6, height: 6, borderRadius: 3 },
    findingTxt: { flex: 1, fontSize: SIZES.sm, ...FONTS.semiBold },
    confTxt: { fontSize: 10, color: COLORS.textMuted },
    caseFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
    footTxt: { fontSize: 9, color: COLORS.textMuted },
    modOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    actionTxt: { fontSize: SIZES.md, ...FONTS.semiBold },
});

export default WorklistScreen;
