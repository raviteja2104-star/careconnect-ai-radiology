import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { radiologyAPI } from '../services/api';

const RadiologistDashboardScreen = ({ navigation }) => {
    const [scans, setScans] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => { loadScans(); }, [filter]);

    const loadScans = async () => {
        try {
            const params = {};
            if (filter !== 'all') params.status = filter;
            const res = await radiologyAPI.listScans(params);
            if (res.success) setScans(res.data);
        } catch (e) {
            setScans([
                { _id: '1', scanId: 'SCAN-001', scanType: 'XRAY', bodyPart: 'Chest', status: 'ai_completed', priority: 'normal', patientId: { firstName: 'Ravi', lastName: 'Teja' }, aiReport: { riskLevel: 'low', findings: 'Normal chest X-ray' }, createdAt: new Date().toISOString() },
                { _id: '2', scanId: 'SCAN-002', scanType: 'CT', bodyPart: 'Head', status: 'ai_completed', priority: 'emergency', patientId: { firstName: 'Priya', lastName: 'Sharma' }, aiReport: { riskLevel: 'high', findings: 'Subdural hematoma detected' }, createdAt: new Date().toISOString() },
                { _id: '3', scanId: 'SCAN-003', scanType: 'MRI', bodyPart: 'Knee', status: 'reviewed', priority: 'normal', patientId: { firstName: 'John', lastName: 'Doe' }, aiReport: { riskLevel: 'medium', findings: 'Meniscal tear detected' }, createdAt: new Date().toISOString() },
            ]);
        }
    };

    const getRiskColor = (r) => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);
    const filters = ['all', 'ai_completed', 'radiologist_review', 'reviewed', 'approved'];

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>Radiologist Panel</Text>
                <TouchableOpacity style={s.iconBtn}><Ionicons name="stats-chart" size={20} color="#fff" /></TouchableOpacity>
            </View>
            <FlatList horizontal data={filters} keyExtractor={i => i} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, marginBottom: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[s.filterBtn, filter === item && s.filterActive]} onPress={() => setFilter(item)}>
                        <Text style={[s.filterTxt, filter === item && { color: '#fff' }]}>{item === 'all' ? 'All' : item.replace(/_/g, ' ')}</Text>
                    </TouchableOpacity>
                )}
            />
            <FlatList data={scans} keyExtractor={i => i._id} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[s.card, item.priority === 'emergency' && { borderColor: COLORS.danger }]} onPress={() => navigation.navigate('ReportEditor', { scan: item })}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                <Text style={s.scanType}>{item.scanType}</Text>
                                {item.priority === 'emergency' && <View style={s.urgBadge}><Ionicons name="alert" size={10} color="#fff" /><Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>EMERGENCY</Text></View>}
                            </View>
                            <View style={[s.riskBadge, { backgroundColor: getRiskColor(item.aiReport?.riskLevel) + '20' }]}>
                                <Text style={[s.riskTxt, { color: getRiskColor(item.aiReport?.riskLevel) }]}>{item.aiReport?.riskLevel?.toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={s.patient}>{item.patientId?.firstName} {item.patientId?.lastName}</Text>
                        <Text style={s.bodyPart}>{item.bodyPart} • {item.scanId}</Text>
                        <Text style={s.findings} numberOfLines={2}>{item.aiReport?.findings}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                            <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            <Text style={[s.status, { color: item.status === 'approved' ? COLORS.success : COLORS.warning }]}>{item.status?.replace(/_/g, ' ')}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60 },
    title: { fontSize: 22, color: '#fff', fontWeight: '700' },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border },
    filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterTxt: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize', fontWeight: '500' },
    card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    scanType: { fontSize: 13, color: COLORS.primary, fontWeight: '700', backgroundColor: COLORS.primaryGlow, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    urgBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    riskBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
    riskTxt: { fontSize: 10, fontWeight: '700' },
    patient: { fontSize: 15, color: '#fff', fontWeight: '600' },
    bodyPart: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    findings: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },
    date: { fontSize: 11, color: COLORS.textMuted },
    status: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});

export default RadiologistDashboardScreen;
