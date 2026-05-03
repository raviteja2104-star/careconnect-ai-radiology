import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { radiologyAPI } from '../services/api';

const TEMPLATES = [
    { label: 'Normal Chest', text: 'Heart size is normal. Mediastinum is not widened. Lungs are clear bilaterally. No pleural effusion or pneumothorax. Bony thorax is intact. Impression: Normal chest radiograph.' },
    { label: 'Brain CT', text: 'No acute intracranial hemorrhage, mass effect, or midline shift. Ventricles and sulci are normal in size and configuration. Gray-white matter differentiation is preserved. No extra-axial fluid collection.' },
    { label: 'Spine MRI', text: 'Vertebral body heights and alignment are maintained. Intervertebral disc spaces are preserved. No significant disc herniation or spinal canal stenosis. Conus medullaris terminates at L1-L2 level.' },
    { label: 'Abdomen CT', text: 'Liver is normal in size and attenuation. No focal hepatic lesion. Gallbladder is normal. Pancreas, spleen, and adrenal glands are unremarkable. Kidneys show normal enhancement. No free fluid.' },
];

const ReportEditorScreen = ({ navigation, route }) => {
    const { scan } = route.params || {};
    const [findings, setFindings] = useState(scan?.aiReport?.findings || '');
    const [impression, setImpression] = useState('');
    const [riskLevel, setRiskLevel] = useState(scan?.aiReport?.riskLevel || 'low');
    const [notes, setNotes] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [activeField, setActiveField] = useState('findings');
    const [templateModal, setTemplateModal] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // ── Voice Dictation (Web Speech API) ──────────────────────────────────────
    const recognitionRef = useRef(null);

    const startVoice = (field) => {
        if (Platform.OS !== 'web') {
            Alert.alert('Voice Dictation', 'Voice dictation is available on web platform. Please use the web version.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            Alert.alert('Not Supported', 'Speech recognition is not supported in this browser.');
            return;
        }

        setActiveField(field);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            // Medical term corrections
            transcript = transcript
                .replace(/\bM R I\b/gi, 'MRI')
                .replace(/\bC T\b/gi, 'CT')
                .replace(/\bX ray\b/gi, 'X-Ray')
                .replace(/\bfull stop\b/gi, '.')
                .replace(/\bnew line\b/gi, '\n')
                .replace(/\bcomma\b/gi, ',');

            const setter = { findings: setFindings, impression: setImpression, notes: setNotes, recommendations: setRecommendations }[field];
            if (setter) setter(prev => prev + ' ' + transcript);
        };

        recognition.onerror = (e) => {
            console.warn('Speech error:', e.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    };

    const stopVoice = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };

    useEffect(() => { return () => { if (recognitionRef.current) recognitionRef.current.stop(); }; }, []);

    const handleSubmit = async (action) => {
        setLoading(true);
        try {
            await radiologyAPI.submitReport({ scanId: scan?._id || scan?.id, findings, impression, riskLevel, notes, action, recommendations: recommendations.split('\n').filter(r => r.trim()) });
            Alert.alert('Success', `Report ${action}d successfully`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e) {
            Alert.alert('Success', `Report ${action}d (demo)`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } finally { setLoading(false); }
    };

    const applyTemplate = (t) => {
        setFindings(t.text);
        setTemplateModal(false);
    };

    const RC = r => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);

    const VoiceButton = ({ field }) => (
        <TouchableOpacity
            style={[s.voiceBtn, isListening && activeField === field && s.voiceBtnActive]}
            onPress={() => isListening && activeField === field ? stopVoice() : startVoice(field)}
        >
            {isListening && activeField === field ? (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="stop-circle" size={20} color={COLORS.danger} />
                </Animated.View>
            ) : (
                <Ionicons name="mic" size={18} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 120 }}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.title}>Report Editor</Text>
                <TouchableOpacity onPress={() => setTemplateModal(true)} style={s.templateBtn}>
                    <Ionicons name="document-text" size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Scan Info */}
            <View style={s.infoCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: SIZES.base, color: COLORS.primary, ...FONTS.bold }}>{scan?.scanType || 'CT'} — {scan?.bodyPart || 'Head'}</Text>
                    <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{scan?.scanId || scan?.id}</Text>
                </View>
                <Text style={{ fontSize: SIZES.sm, color: '#fff', marginTop: 4 }}>{scan?.patientName || scan?.patientId?.firstName || 'Patient'}</Text>
            </View>

            {/* Voice status bar */}
            {isListening && (
                <View style={s.voiceStatus}>
                    <Animated.View style={[s.voiceDot, { transform: [{ scale: pulseAnim }] }]} />
                    <Text style={{ color: COLORS.danger, fontSize: SIZES.sm, ...FONTS.bold }}>
                        🎤 Listening — dictating to "{activeField}"
                    </Text>
                    <TouchableOpacity onPress={stopVoice}>
                        <Text style={{ color: COLORS.textMuted, fontSize: SIZES.sm }}>Stop</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* AI Analysis */}
            <View style={s.aiSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="sparkles" size={18} color={COLORS.primary} />
                    <Text style={{ fontSize: SIZES.base, color: COLORS.primary, ...FONTS.semiBold }}>AI Analysis</Text>
                </View>
                <Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 }}>
                    {scan?.aiReport?.findings || scan?.finding || 'No AI analysis available'}
                </Text>
                {(scan?.aiReport?.detectedIssues || []).map((issue, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: RC(scan.aiReport.riskLevel) }} />
                        <Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary }}>{issue.name} ({Math.round(issue.probability * 100)}%)</Text>
                    </View>
                ))}
            </View>

            {/* Findings */}
            <View style={s.fieldHeader}>
                <Text style={s.label}>Findings</Text>
                <VoiceButton field="findings" />
            </View>
            <TextInput style={s.textArea} multiline numberOfLines={6} value={findings} onChangeText={setFindings}
                placeholderTextColor={COLORS.textMuted} placeholder="Enter clinical findings..." />

            {/* Impression */}
            <View style={s.fieldHeader}>
                <Text style={s.label}>Impression</Text>
                <VoiceButton field="impression" />
            </View>
            <TextInput style={[s.textArea, { minHeight: 70 }]} multiline value={impression} onChangeText={setImpression}
                placeholderTextColor={COLORS.textMuted} placeholder="Clinical impression..." />

            {/* Risk Level */}
            <Text style={[s.label, { marginTop: 16 }]}>Risk Level</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                {['low', 'medium', 'high', 'critical'].map(r => (
                    <TouchableOpacity key={r} style={[s.riskBtn, riskLevel === r && { borderColor: RC(r), backgroundColor: RC(r) + '20' }]} onPress={() => setRiskLevel(r)}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: RC(r) }} />
                        <Text style={[s.riskTxt, riskLevel === r && { color: RC(r) }]}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Recommendations */}
            <View style={s.fieldHeader}>
                <Text style={s.label}>Recommendations</Text>
                <VoiceButton field="recommendations" />
            </View>
            <TextInput style={[s.textArea, { minHeight: 70 }]} multiline value={recommendations} onChangeText={setRecommendations}
                placeholderTextColor={COLORS.textMuted} placeholder="One recommendation per line..." />

            {/* Notes */}
            <View style={s.fieldHeader}>
                <Text style={s.label}>Additional Notes</Text>
                <VoiceButton field="notes" />
            </View>
            <TextInput style={[s.textArea, { minHeight: 60 }]} multiline value={notes} onChangeText={setNotes}
                placeholderTextColor={COLORS.textMuted} placeholder="Internal notes (not included in patient report)..." />

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.warning }]} onPress={() => handleSubmit('review')} disabled={loading}>
                    <Ionicons name="create" size={18} color="#fff" /><Text style={s.actionTxt}>Save Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.success, flex: 1.5 }]} onPress={() => handleSubmit('approve')} disabled={loading}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={s.actionTxt}>Approve & Sign</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.danger, marginTop: 8 }]} onPress={() => handleSubmit('reject')} disabled={loading}>
                <Ionicons name="close-circle" size={18} color="#fff" /><Text style={s.actionTxt}>Reject — Rescan Needed</Text>
            </TouchableOpacity>

            {/* Template Modal */}
            {templateModal && (
                <View style={s.templateOverlay}>
                    <View style={s.templateCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                            <Text style={{ fontSize: SIZES.lg, color: '#fff', ...FONTS.bold }}>Report Templates</Text>
                            <TouchableOpacity onPress={() => setTemplateModal(false)}>
                                <Ionicons name="close" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>
                        {TEMPLATES.map((t, i) => (
                            <TouchableOpacity key={i} style={s.templateItem} onPress={() => applyTemplate(t)}>
                                <Ionicons name="document" size={18} color={COLORS.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.semiBold }}>{t.label}</Text>
                                    <Text style={{ fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 }} numberOfLines={2}>{t.text}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    back: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    templateBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    infoCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
    voiceStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.danger + '15', borderRadius: SIZES.radius, padding: 12, borderWidth: 1, borderColor: COLORS.danger + '40', marginBottom: 16 },
    voiceDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger },
    aiSection: { backgroundColor: COLORS.primaryGlow, borderRadius: SIZES.radius, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.primary + '40' },
    fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 6 },
    label: { fontSize: SIZES.base, color: '#fff', ...FONTS.semiBold },
    voiceBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    voiceBtnActive: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '20' },
    textArea: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: SIZES.sm, color: '#fff', textAlignVertical: 'top', minHeight: 100 },
    riskBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border },
    riskTxt: { fontSize: 11, color: COLORS.textSecondary, ...FONTS.semiBold, textTransform: 'capitalize' },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: SIZES.radius },
    actionTxt: { fontSize: SIZES.md, color: '#fff', ...FONTS.semiBold },
    templateOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20, zIndex: 99 },
    templateCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24 },
    templateItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
});

export default ReportEditorScreen;
