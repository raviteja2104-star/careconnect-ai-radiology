import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const BACKEND = __DEV__ ? 'http://localhost:5000' : 'https://careconnect-iota-five.vercel.app';

const QUEUE_MOCK = [
    {
        id: 'REQ-001', patient: 'Ravi Teja', scanType: 'CT', bodyPart: 'Head',
        priority: 'urgent', doctor: 'Dr. Raj Sharma', requestedAt: '09:15 AM',
        status: 'pending', notes: 'Rule out hemorrhage',
    },
    {
        id: 'REQ-002', patient: 'Priya Sharma', scanType: 'XRAY', bodyPart: 'Chest',
        priority: 'normal', doctor: 'Dr. Anita Desai', requestedAt: '10:30 AM',
        status: 'in_progress', notes: 'Annual checkup',
    },
    {
        id: 'REQ-003', patient: 'Arjun Kumar', scanType: 'MRI', bodyPart: 'Spine',
        priority: 'normal', doctor: 'Dr. Vikram Patel', requestedAt: '11:00 AM',
        status: 'pending', notes: 'Lower back pain evaluation',
    },
    {
        id: 'REQ-004', patient: 'Sita Reddy', scanType: 'CT', bodyPart: 'Abdomen',
        priority: 'urgent', doctor: 'Dr. Raj Sharma', requestedAt: '11:45 AM',
        status: 'completed', notes: 'Suspected appendicitis',
    },
];

const EQUIPMENT_MOCK = [
    { id: 'CT-01', name: 'CT Scanner Unit 1', type: 'CT', status: 'operational', lastMaintenance: '2026-04-28', nextMaintenance: '2026-05-28', room: 'Radiology Room A' },
    { id: 'MRI-01', name: 'MRI Machine 1.5T', type: 'MRI', status: 'operational', lastMaintenance: '2026-04-15', nextMaintenance: '2026-05-15', room: 'Radiology Room B' },
    { id: 'XRAY-01', name: 'Digital X-Ray Unit', type: 'XRAY', status: 'maintenance', lastMaintenance: '2026-05-01', nextMaintenance: '2026-05-08', room: 'Radiology Room C' },
    { id: 'XRAY-02', name: 'Portable X-Ray', type: 'XRAY', status: 'operational', lastMaintenance: '2026-04-20', nextMaintenance: '2026-05-20', room: 'ICU' },
];

const priorityColors = { urgent: '#EF5350', normal: '#42A5F5', emergency: '#FF1744' };
const statusColors = { pending: '#FFA726', in_progress: '#42A5F5', completed: '#66BB6A', cancelled: '#EF5350' };
const equipmentColors = { operational: '#66BB6A', maintenance: '#FFA726', offline: '#EF5350' };
const scanTypeIcons = { CT: 'layers', MRI: 'magnet', XRAY: 'body' };

const LabTechnicianScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('queue');
    const [queue, setQueue] = useState(QUEUE_MOCK);
    const [equipment, setEquipment] = useState(EQUIPMENT_MOCK);
    const [refreshing, setRefreshing] = useState(false);

    const tabs = [
        { key: 'queue', label: 'Scan Queue', icon: 'list' },
        { key: 'equipment', label: 'Equipment', icon: 'hardware-chip' },
        { key: 'upload', label: 'Upload', icon: 'cloud-upload' },
    ];

    const updateScanStatus = (id, newStatus) => {
        setQueue(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        Alert.alert('✅ Updated', `Scan ${id} marked as ${newStatus.replace('_', ' ')}.`);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 1000));
        setRefreshing(false);
    };

    const pendingCount = queue.filter(q => q.status === 'pending').length;
    const inProgressCount = queue.filter(q => q.status === 'in_progress').length;
    const urgentCount = queue.filter(q => q.priority === 'urgent' && q.status !== 'completed').length;

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Lab Technician</Text>
                    <Text style={s.sub}>CareConnect Diagnostic Center</Text>
                </View>
                <View style={s.badge}>
                    <Ionicons name="flask" size={14} color="#fff" />
                    <Text style={s.badgeText}>LAB TECH</Text>
                </View>
            </View>

            {/* Quick stats bar */}
            <View style={s.quickStats}>
                <View style={s.quickStat}>
                    <Text style={[s.quickStatNum, { color: '#FFA726' }]}>{pendingCount}</Text>
                    <Text style={s.quickStatLabel}>Pending</Text>
                </View>
                <View style={[s.divider]} />
                <View style={s.quickStat}>
                    <Text style={[s.quickStatNum, { color: '#42A5F5' }]}>{inProgressCount}</Text>
                    <Text style={s.quickStatLabel}>In Progress</Text>
                </View>
                <View style={s.divider} />
                <View style={s.quickStat}>
                    <Text style={[s.quickStatNum, { color: '#EF5350' }]}>{urgentCount}</Text>
                    <Text style={s.quickStatLabel}>Urgent</Text>
                </View>
                <View style={s.divider} />
                <View style={s.quickStat}>
                    <Text style={[s.quickStatNum, { color: '#66BB6A' }]}>{queue.filter(q => q.status === 'completed').length}</Text>
                    <Text style={s.quickStatLabel}>Completed</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
                {tabs.map(t => (
                    <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
                        <Ionicons name={t.icon} size={15} color={activeTab === t.key ? '#fff' : COLORS.textMuted} />
                        <Text style={[s.tabLabel, activeTab === t.key && s.tabLabelActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* QUEUE TAB */}
                {activeTab === 'queue' && queue.map(req => (
                    <View key={req.id} style={[s.card, req.priority === 'urgent' && { borderLeftColor: '#EF5350', borderLeftWidth: 3 }]}>
                        <View style={s.cardHeader}>
                            <View style={s.cardLeft}>
                                <View style={[s.scanIcon, { backgroundColor: '#AB47BC20' }]}>
                                    <Ionicons name={scanTypeIcons[req.scanType] || 'scan'} size={18} color="#AB47BC" />
                                </View>
                                <View>
                                    <Text style={s.cardTitle}>{req.patient}</Text>
                                    <Text style={s.cardSub}>{req.scanType} · {req.bodyPart}</Text>
                                </View>
                            </View>
                            <View style={{ gap: 4, alignItems: 'flex-end' }}>
                                <View style={[s.pill, { backgroundColor: (priorityColors[req.priority] || '#888') + '20' }]}>
                                    <Text style={[s.pillText, { color: priorityColors[req.priority] || '#888' }]}>{req.priority.toUpperCase()}</Text>
                                </View>
                                <View style={[s.pill, { backgroundColor: (statusColors[req.status] || '#888') + '20' }]}>
                                    <Text style={[s.pillText, { color: statusColors[req.status] || '#888' }]}>{req.status.replace('_', ' ')}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={s.cardMeta}>
                            <Ionicons name="medical" size={12} color={COLORS.textMuted} />
                            <Text style={s.metaText}>{req.doctor}</Text>
                            <Ionicons name="time" size={12} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
                            <Text style={s.metaText}>{req.requestedAt}</Text>
                        </View>
                        {req.notes ? (
                            <View style={s.notesRow}>
                                <Ionicons name="document-text" size={12} color={COLORS.textMuted} />
                                <Text style={s.notesText}>{req.notes}</Text>
                            </View>
                        ) : null}
                        {req.status !== 'completed' && (
                            <View style={s.actions}>
                                {req.status === 'pending' && (
                                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#42A5F520' }]} onPress={() => updateScanStatus(req.id, 'in_progress')}>
                                        <Ionicons name="play" size={14} color="#42A5F5" />
                                        <Text style={[s.actionBtnText, { color: '#42A5F5' }]}>Start Scan</Text>
                                    </TouchableOpacity>
                                )}
                                {req.status === 'in_progress' && (
                                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#66BB6A20' }]} onPress={() => updateScanStatus(req.id, 'completed')}>
                                        <Ionicons name="checkmark" size={14} color="#66BB6A" />
                                        <Text style={[s.actionBtnText, { color: '#66BB6A' }]}>Mark Complete</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EF535020' }]} onPress={() => updateScanStatus(req.id, 'cancelled')}>
                                    <Ionicons name="close" size={14} color="#EF5350" />
                                    <Text style={[s.actionBtnText, { color: '#EF5350' }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}

                {/* EQUIPMENT TAB */}
                {activeTab === 'equipment' && equipment.map(eq => (
                    <View key={eq.id} style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={s.cardLeft}>
                                <View style={[s.scanIcon, { backgroundColor: (equipmentColors[eq.status] || '#888') + '20' }]}>
                                    <Ionicons name="hardware-chip" size={18} color={equipmentColors[eq.status] || '#888'} />
                                </View>
                                <View>
                                    <Text style={s.cardTitle}>{eq.name}</Text>
                                    <Text style={s.cardSub}>{eq.room}</Text>
                                </View>
                            </View>
                            <View style={[s.pill, { backgroundColor: (equipmentColors[eq.status] || '#888') + '20' }]}>
                                <Text style={[s.pillText, { color: equipmentColors[eq.status] || '#888' }]}>{eq.status.toUpperCase()}</Text>
                            </View>
                        </View>
                        <View style={s.equipInfo}>
                            <View style={s.equipInfoRow}>
                                <Text style={s.equipInfoLabel}>Last Maintenance:</Text>
                                <Text style={s.equipInfoValue}>{eq.lastMaintenance}</Text>
                            </View>
                            <View style={s.equipInfoRow}>
                                <Text style={s.equipInfoLabel}>Next Maintenance:</Text>
                                <Text style={[s.equipInfoValue, { color: eq.status === 'maintenance' ? '#EF5350' : COLORS.text }]}>{eq.nextMaintenance}</Text>
                            </View>
                        </View>
                        {eq.status === 'maintenance' && (
                            <TouchableOpacity
                                style={[s.actionBtn, { backgroundColor: '#66BB6A20', alignSelf: 'flex-start' }]}
                                onPress={() => {
                                    setEquipment(prev => prev.map(e => e.id === eq.id ? { ...e, status: 'operational' } : e));
                                    Alert.alert('✅', `${eq.name} marked as operational.`);
                                }}
                            >
                                <Ionicons name="checkmark-circle" size={14} color="#66BB6A" />
                                <Text style={[s.actionBtnText, { color: '#66BB6A' }]}>Mark Operational</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {/* UPLOAD TAB */}
                {activeTab === 'upload' && (
                    <>
                        <View style={s.uploadCard}>
                            <Ionicons name="cloud-upload" size={48} color={COLORS.primary} />
                            <Text style={s.uploadTitle}>Upload DICOM Files</Text>
                            <Text style={s.uploadSub}>Upload processed .dcm scan files directly to the CareConnect PACS server</Text>
                            <TouchableOpacity
                                style={s.uploadBtn}
                                onPress={() => navigation.navigate('UploadScan')}
                            >
                                <Ionicons name="add-circle" size={18} color="#fff" />
                                <Text style={s.uploadBtnText}>Select & Upload DICOM</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={s.sectionTitle}>📁 Recent Uploads</Text>
                        {[
                            { name: 'CT_HEAD_RAVI_20260505.dcm', size: '48.2 MB', status: 'uploaded', time: '10 mins ago' },
                            { name: 'XRAY_CHEST_PRIYA_20260505.dcm', size: '12.4 MB', status: 'processing', time: '25 mins ago' },
                            { name: 'MRI_SPINE_ARJUN_20260504.dcm', size: '156.8 MB', status: 'uploaded', time: '1 hour ago' },
                        ].map((file, i) => (
                            <View key={i} style={s.fileRow}>
                                <Ionicons name="document" size={20} color="#AB47BC" />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.fileName}>{file.name}</Text>
                                    <Text style={s.fileMeta}>{file.size} · {file.time}</Text>
                                </View>
                                <View style={[s.pill, { backgroundColor: file.status === 'uploaded' ? '#66BB6A20' : '#FFA72620' }]}>
                                    <Text style={[s.pillText, { color: file.status === 'uploaded' ? '#66BB6A' : '#FFA726' }]}>{file.status}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFA726', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    quickStats: { flexDirection: 'row', backgroundColor: COLORS.card, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    quickStat: { flex: 1, alignItems: 'center' },
    quickStatNum: { fontSize: 22, fontWeight: '800' },
    quickStatLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
    divider: { width: 1, backgroundColor: COLORS.border },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 12, gap: 8, paddingVertical: 8 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8 },
    tabActive: { backgroundColor: COLORS.primary },
    tabLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
    tabLabelActive: { color: '#fff' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 10 },
    card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10, gap: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    scanIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    cardSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    pillText: { fontSize: 9, fontWeight: '700' },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 11, color: COLORS.textMuted },
    notesRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.background, padding: 8, borderRadius: 8 },
    notesText: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
    actions: { flexDirection: 'row', gap: 8, paddingTop: 4 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
    actionBtnText: { fontSize: 12, fontWeight: '600' },
    equipInfo: { gap: 4, paddingTop: 4 },
    equipInfoRow: { flexDirection: 'row', gap: 6 },
    equipInfoLabel: { fontSize: 11, color: COLORS.textMuted, width: 130 },
    equipInfoValue: { fontSize: 11, fontWeight: '600', color: COLORS.text },
    uploadCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10, marginBottom: 16 },
    uploadTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    uploadSub: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 6 },
    uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
    fileName: { fontSize: 12, fontWeight: '600', color: COLORS.text },
    fileMeta: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
});

export default LabTechnicianScreen;
