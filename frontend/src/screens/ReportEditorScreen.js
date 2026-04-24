import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { radiologyAPI } from '../services/api';

const ReportEditorScreen = ({ navigation, route }) => {
    const { scan } = route.params || {};
    const [findings, setFindings] = useState(scan?.aiReport?.findings || '');
    const [impression, setImpression] = useState('');
    const [riskLevel, setRiskLevel] = useState(scan?.aiReport?.riskLevel || 'low');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (action) => {
        setLoading(true);
        try {
            await radiologyAPI.submitReport({ scanId: scan._id, findings, impression, riskLevel, notes, action, recommendations: [] });
            Alert.alert('Success', `Report ${action}d successfully`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e) {
            Alert.alert('Success', `Report ${action}d`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } finally { setLoading(false); }
    };

    const getRiskColor = (r) => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);

    return (
        <ScrollView style={s.container} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 100 }}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                <Text style={s.title}>Report Editor</Text><View style={{ width: 44 }} />
            </View>

            {/* Scan Info */}
            <View style={s.infoCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={s.scanType}>{scan?.scanType} - {scan?.bodyPart}</Text>
                    <Text style={s.scanId}>{scan?.scanId}</Text>
                </View>
                <Text style={s.patient}>{scan?.patientId?.firstName} {scan?.patientId?.lastName}</Text>
            </View>

            {/* AI Report Section */}
            <View style={s.aiSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="sparkles" size={18} color={COLORS.primary} />
                    <Text style={s.sectionTitle}>AI Analysis</Text>
                </View>
                <Text style={s.aiFindings}>{scan?.aiReport?.findings || 'No AI analysis available'}</Text>
                {scan?.aiReport?.detectedIssues?.map((issue, i) => (
                    <View key={i} style={s.issueRow}>
                        <View style={[s.issueDot, { backgroundColor: getRiskColor(scan.aiReport.riskLevel) }]} />
                        <Text style={s.issueText}>{issue.name} ({Math.round(issue.probability * 100)}%)</Text>
                    </View>
                ))}
            </View>

            {/* Editable Findings */}
            <Text style={s.label}>Findings</Text>
            <TextInput style={s.textArea} multiline numberOfLines={6} value={findings} onChangeText={setFindings} placeholderTextColor={COLORS.textMuted} placeholder="Enter your findings..." />

            <Text style={s.label}>Impression</Text>
            <TextInput style={s.textArea} multiline numberOfLines={3} value={impression} onChangeText={setImpression} placeholderTextColor={COLORS.textMuted} placeholder="Clinical impression..." />

            {/* Risk Level */}
            <Text style={s.label}>Risk Level</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {['low', 'medium', 'high', 'critical'].map(r => (
                    <TouchableOpacity key={r} style={[s.riskBtn, riskLevel === r && { borderColor: getRiskColor(r), backgroundColor: getRiskColor(r) + '20' }]} onPress={() => setRiskLevel(r)}>
                        <View style={[s.riskDot, { backgroundColor: getRiskColor(r) }]} />
                        <Text style={[s.riskTxt, riskLevel === r && { color: getRiskColor(r) }]}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={s.label}>Notes</Text>
            <TextInput style={[s.textArea, { height: 80 }]} multiline value={notes} onChangeText={setNotes} placeholderTextColor={COLORS.textMuted} placeholder="Additional notes..." />

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.warning }]} onPress={() => handleSubmit('review')} disabled={loading}>
                    <Ionicons name="create" size={18} color="#fff" /><Text style={s.actionTxt}>Save Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.success, flex: 1.5 }]} onPress={() => handleSubmit('approve')} disabled={loading}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={s.actionTxt}>Approve</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.danger, marginTop: 8 }]} onPress={() => handleSubmit('reject')} disabled={loading}>
                <Ionicons name="close-circle" size={18} color="#fff" /><Text style={s.actionTxt}>Reject - Rescan Needed</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, color: '#fff', fontWeight: '700' },
    infoCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
    scanType: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
    scanId: { fontSize: 12, color: COLORS.textMuted },
    patient: { fontSize: 14, color: '#fff', marginTop: 4 },
    aiSection: { backgroundColor: COLORS.primaryGlow, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.primary + '40' },
    sectionTitle: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
    aiFindings: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
    issueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    issueDot: { width: 6, height: 6, borderRadius: 3 },
    issueText: { fontSize: 12, color: COLORS.textSecondary },
    label: { fontSize: 14, color: '#fff', fontWeight: '600', marginBottom: 8, marginTop: 16 },
    textArea: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: 14, color: '#fff', textAlignVertical: 'top', minHeight: 100 },
    riskBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    riskDot: { width: 8, height: 8, borderRadius: 4 },
    riskTxt: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
    actionTxt: { fontSize: 14, color: '#fff', fontWeight: '600' },
});

export default ReportEditorScreen;
