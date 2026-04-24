import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { patientAPI } from '../services/api';

const COMMON_SYMPTOMS = [
    'Headache', 'Fever', 'Cough', 'Chest Pain', 'Back Pain',
    'Abdominal Pain', 'Fatigue', 'Dizziness', 'Nausea',
    'Shortness of Breath', 'Joint Pain', 'Skin Rash',
];

const SymptomCheckerScreen = ({ navigation }) => {
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [customSymptom, setCustomSymptom] = useState('');
    const [severity, setSeverity] = useState('mild');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const toggleSymptom = (symptom) => {
        setSelectedSymptoms((prev) =>
            prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
        );
    };

    const addCustomSymptom = () => {
        if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
            setSelectedSymptoms((prev) => [...prev, customSymptom.trim()]);
            setCustomSymptom('');
        }
    };

    const analyzeSymptoms = async () => {
        if (selectedSymptoms.length === 0) {
            Alert.alert('Error', 'Please select at least one symptom');
            return;
        }
        setLoading(true);
        try {
            const res = await patientAPI.checkSymptoms({
                symptoms: selectedSymptoms,
                severity,
                duration,
            });
            if (res.success) {
                setResult(res.data);
            }
        } catch (error) {
            // Fallback mock
            setResult({
                possibleConditions: [
                    { name: 'General Consultation Recommended', probability: 0.7, description: 'Please consult a doctor for proper evaluation.' },
                ],
                severity,
                urgencyLevel: severity === 'severe' ? 'high' : 'medium',
                shouldSeeDoctor: true,
                recommendations: ['Schedule a consultation', 'Monitor symptoms'],
                disclaimer: 'This is an AI-generated analysis for informational purposes only.',
            });
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        const colors = { low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, emergency: COLORS.riskCritical };
        return colors[level] || COLORS.info;
    };

    if (result) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.resultHeader}>
                    <View style={[styles.urgencyBadge, { backgroundColor: getRiskColor(result.urgencyLevel) }]}>
                        <Ionicons name={result.urgencyLevel === 'high' || result.urgencyLevel === 'emergency' ? 'warning' : 'checkmark-circle'} size={20} color={COLORS.white} />
                        <Text style={styles.urgencyText}>{result.urgencyLevel?.toUpperCase()} URGENCY</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Possible Conditions</Text>
                {result.possibleConditions?.map((condition, i) => (
                    <View key={i} style={styles.conditionCard}>
                        <View style={styles.conditionHeader}>
                            <Text style={styles.conditionName}>{condition.name}</Text>
                            <View style={styles.probabilityBadge}>
                                <Text style={styles.probabilityText}>{Math.round(condition.probability * 100)}%</Text>
                            </View>
                        </View>
                        <Text style={styles.conditionDesc}>{condition.description}</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${condition.probability * 100}%`, backgroundColor: condition.probability > 0.7 ? COLORS.danger : condition.probability > 0.4 ? COLORS.warning : COLORS.success }]} />
                        </View>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Recommendations</Text>
                <View style={styles.recCard}>
                    {result.recommendations?.map((rec, i) => (
                        <View key={i} style={styles.recItem}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                            <Text style={styles.recText}>{rec}</Text>
                        </View>
                    ))}
                </View>

                {result.shouldSeeDoctor && (
                    <TouchableOpacity style={styles.consultButton} onPress={() => navigation.navigate('DoctorList')}>
                        <Ionicons name="person" size={20} color={COLORS.white} />
                        <Text style={styles.consultButtonText}>Consult a Doctor Now</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.disclaimer}>{result.disclaimer}</Text>

                <TouchableOpacity style={styles.resetButton} onPress={() => { setResult(null); setSelectedSymptoms([]); }}>
                    <Text style={styles.resetText}>Check Again</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.aiHeader}>
                <View style={styles.aiIconContainer}>
                    <Ionicons name="sparkles" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.aiTitle}>AI Symptom Checker</Text>
                <Text style={styles.aiSubtitle}>Select your symptoms for an AI-powered analysis</Text>
            </View>

            {/* Selected symptoms */}
            {selectedSymptoms.length > 0 && (
                <View style={styles.selectedContainer}>
                    <Text style={styles.selectedLabel}>Selected ({selectedSymptoms.length})</Text>
                    <View style={styles.chipContainer}>
                        {selectedSymptoms.map((s) => (
                            <TouchableOpacity key={s} style={styles.chipActive} onPress={() => toggleSymptom(s)}>
                                <Text style={styles.chipActiveText}>{s}</Text>
                                <Ionicons name="close-circle" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Common symptoms grid */}
            <Text style={styles.sectionTitle}>Common Symptoms</Text>
            <View style={styles.chipContainer}>
                {COMMON_SYMPTOMS.map((symptom) => (
                    <TouchableOpacity
                        key={symptom}
                        style={[styles.chip, selectedSymptoms.includes(symptom) && styles.chipActive]}
                        onPress={() => toggleSymptom(symptom)}
                    >
                        <Text style={[styles.chipText, selectedSymptoms.includes(symptom) && styles.chipActiveText]}>{symptom}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Custom symptom */}
            <View style={styles.customInput}>
                <TextInput
                    style={styles.input}
                    placeholder="Add other symptom..."
                    placeholderTextColor={COLORS.textMuted}
                    value={customSymptom}
                    onChangeText={setCustomSymptom}
                    onSubmitEditing={addCustomSymptom}
                />
                <TouchableOpacity onPress={addCustomSymptom} style={styles.addButton}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Severity */}
            <Text style={styles.sectionTitle}>Severity</Text>
            <View style={styles.severityRow}>
                {['mild', 'moderate', 'severe'].map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.severityButton, severity === s && styles.severityActive]}
                        onPress={() => setSeverity(s)}
                    >
                        <Text style={[styles.severityText, severity === s && styles.severityActiveText]}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Duration */}
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.severityRow}>
                {['1 day', '2-3 days', '1 week', '2+ weeks'].map((d) => (
                    <TouchableOpacity
                        key={d}
                        style={[styles.severityButton, duration === d && styles.severityActive]}
                        onPress={() => setDuration(d)}
                    >
                        <Text style={[styles.severityText, duration === d && styles.severityActiveText]}>{d}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Analyze button */}
            <TouchableOpacity
                style={[styles.analyzeButton, selectedSymptoms.length === 0 && { opacity: 0.5 }]}
                onPress={analyzeSymptoms}
                disabled={loading || selectedSymptoms.length === 0}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <>
                        <Ionicons name="analytics" size={20} color={COLORS.white} />
                        <Text style={styles.analyzeText}>Analyze Symptoms</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: SIZES.paddingLg, paddingTop: 60, paddingBottom: 100 },
    aiHeader: { alignItems: 'center', marginBottom: 24 },
    aiIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: COLORS.primary },
    aiTitle: { fontSize: SIZES.xxl, color: COLORS.white, ...FONTS.bold },
    aiSubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
    selectedContainer: { marginBottom: 20 },
    selectedLabel: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.semiBold, marginBottom: 8 },
    sectionTitle: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.semiBold, marginBottom: 12, marginTop: 16 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radiusFull },
    chipText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
    chipActiveText: { fontSize: SIZES.sm, color: COLORS.white, ...FONTS.medium },
    customInput: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    input: { flex: 1, height: 46, backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingHorizontal: 16, fontSize: SIZES.md, color: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
    addButton: { width: 46, height: 46, borderRadius: SIZES.radius, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    severityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    severityButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border },
    severityActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    severityText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
    severityActiveText: { color: COLORS.white, ...FONTS.medium },
    analyzeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: SIZES.radius, height: 56, gap: 8, marginTop: 32 },
    analyzeText: { fontSize: SIZES.lg, color: COLORS.white, ...FONTS.semiBold },
    // Results styles
    resultHeader: { alignItems: 'center', marginBottom: 24 },
    urgencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: SIZES.radiusFull },
    urgencyText: { fontSize: SIZES.md, color: COLORS.white, ...FONTS.bold },
    conditionCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    conditionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    conditionName: { fontSize: SIZES.base, color: COLORS.white, ...FONTS.semiBold, flex: 1 },
    probabilityBadge: { backgroundColor: COLORS.primaryGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
    probabilityText: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.bold },
    conditionDesc: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
    progressBar: { height: 4, backgroundColor: COLORS.surface, borderRadius: 2, marginTop: 10 },
    progressFill: { height: 4, borderRadius: 2 },
    recCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    recItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    recText: { fontSize: SIZES.md, color: COLORS.textSecondary, flex: 1, lineHeight: 22 },
    consultButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: SIZES.radius, height: 52, gap: 8, marginTop: 20 },
    consultButtonText: { fontSize: SIZES.base, color: COLORS.white, ...FONTS.semiBold },
    disclaimer: { fontSize: SIZES.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
    resetButton: { alignItems: 'center', marginTop: 16, marginBottom: 40 },
    resetText: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.semiBold },
});

export default SymptomCheckerScreen;
