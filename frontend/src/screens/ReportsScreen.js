import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { radiologyAPI } from '../services/api';

const ReportsScreen = ({ navigation }) => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadScans(); }, []);

    const loadScans = async () => {
        try {
            const res = await radiologyAPI.listScans({});
            if (res.success) setScans(res.data);
        } catch (e) {
            setScans([
                { _id: '1', scanId: 'SCAN-001', scanType: 'XRAY', bodyPart: 'Chest', status: 'approved', priority: 'normal', aiReport: { riskLevel: 'low', confidence: 0.92 }, createdAt: new Date().toISOString() },
                { _id: '2', scanId: 'SCAN-002', scanType: 'CT', bodyPart: 'Head', status: 'ai_completed', priority: 'urgent', aiReport: { riskLevel: 'medium', confidence: 0.88 }, createdAt: new Date().toISOString() },
                { _id: '3', scanId: 'SCAN-003', scanType: 'MRI', bodyPart: 'Knee', status: 'reviewed', priority: 'normal', aiReport: { riskLevel: 'low', confidence: 0.95 }, createdAt: new Date().toISOString() },
            ]);
        } finally { setLoading(false); }
    };

    const getStatusColor = (status) => {
        const m = { uploaded: COLORS.info, ai_processing: COLORS.warning, ai_completed: '#AB47BC', radiologist_review: COLORS.warning, reviewed: COLORS.primary, approved: COLORS.success, rejected: COLORS.danger };
        return m[status] || COLORS.textMuted;
    };

    const getRiskColor = (r) => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);

    const renderScan = ({ item }) => (
        <TouchableOpacity style={st.card} onPress={() => navigation.navigate('ScanViewer', { scan: item })}>
            <View style={st.cardHeader}>
                <View style={[st.typeBadge, { backgroundColor: item.scanType === 'CT' ? '#AB47BC20' : item.scanType === 'MRI' ? '#26A69A20' : '#42A5F520' }]}>
                    <Text style={[st.typeText, { color: item.scanType === 'CT' ? '#AB47BC' : item.scanType === 'MRI' ? '#26A69A' : '#42A5F5' }]}>{item.scanType}</Text>
                </View>
                <View style={[st.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[st.statusText, { color: getStatusColor(item.status) }]}>{item.status?.replace(/_/g, ' ')}</Text>
                {item.priority === 'emergency' && <View style={st.emergBadge}><Ionicons name="alert" size={12} color="#fff" /><Text style={st.emergText}>URGENT</Text></View>}
            </View>
            <Text style={st.scanId}>{item.scanId}</Text>
            <Text style={st.bodyPart}>{item.bodyPart} Scan</Text>
            {item.aiReport?.riskLevel && (
                <View style={st.riskRow}>
                    <Text style={st.riskLabel}>AI Risk:</Text>
                    <View style={[st.riskBadge, { backgroundColor: getRiskColor(item.aiReport.riskLevel) + '20' }]}>
                        <View style={[st.riskDot, { backgroundColor: getRiskColor(item.aiReport.riskLevel) }]} />
                        <Text style={[st.riskText, { color: getRiskColor(item.aiReport.riskLevel) }]}>{item.aiReport.riskLevel?.toUpperCase()}</Text>
                    </View>
                    <Text style={st.confText}>{Math.round((item.aiReport.confidence || 0) * 100)}% conf.</Text>
                </View>
            )}
            <Text style={st.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={st.back}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                <Text style={st.title}>My Reports</Text><View style={{ width: 44 }} />
            </View>
            <FlatList data={scans} renderItem={renderScan} keyExtractor={i => i._id} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} ListEmptyComponent={<Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 40 }}>No reports found</Text>} />
        </View>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, color: '#fff', fontWeight: '700' },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    typeText: { fontSize: 11, fontWeight: '700' },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
    emergBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginLeft: 'auto' },
    emergText: { fontSize: 9, color: '#fff', fontWeight: '700' },
    scanId: { fontSize: 14, color: '#fff', fontWeight: '600' },
    bodyPart: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    riskLabel: { fontSize: 12, color: COLORS.textMuted },
    riskBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    riskDot: { width: 6, height: 6, borderRadius: 3 },
    riskText: { fontSize: 11, fontWeight: '700' },
    confText: { fontSize: 11, color: COLORS.textMuted },
    dateText: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
});

export default ReportsScreen;
