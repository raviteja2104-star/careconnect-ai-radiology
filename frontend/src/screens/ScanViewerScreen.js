import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const MOCK = {
    scanId: 'SCAN-2026-001', scanType: 'CT', bodyPart: 'Chest',
    patientName: 'Ravi Teja', studyDate: '25 Apr 2026', slices: 24,
    institution: 'Apollo Diagnostics, Hyderabad',
    aiReport: {
        riskLevel: 'high', confidence: 0.94,
        findings: 'Large hyperdense lesion in right frontal lobe measuring 3.2×2.8 cm with surrounding perilesional oedema. Midline shift of 4 mm to the left.',
        detectedIssues: [
            { name: 'Subdural Hematoma', probability: 0.968, location: 'Right frontal' },
            { name: 'Perilesional Oedema', probability: 0.87, location: 'Bilateral' },
            { name: 'Midline Shift', probability: 0.82, location: 'Central' },
        ],
        recommendations: [
            'Immediate neurosurgical consultation',
            'Repeat CT in 6 hours to monitor progression',
            'Consider MRI for better soft-tissue characterisation',
        ],
    },
};

const TOOLS = [
    { id: 'zoom', icon: 'search', label: 'Zoom' },
    { id: 'pan', icon: 'hand-left', label: 'Pan' },
    { id: 'measure', icon: 'resize', label: 'Measure' },
    { id: 'annotate', icon: 'pencil', label: 'Annotate' },
    { id: 'roi', icon: 'ellipse', label: 'ROI' },
];

const WINDOWS = [
    { id: 'brain', label: 'Brain', wl: 40, ww: 80 },
    { id: 'bone', label: 'Bone', wl: 400, ww: 1800 },
    { id: 'lung', label: 'Lung', wl: -600, ww: 1500 },
    { id: 'soft', label: 'Soft Tissue', wl: 60, ww: 400 },
];

const RC = r => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);

const ScanViewerScreen = ({ navigation, route }) => {
    const scan = route?.params?.scan || MOCK;
    const ai = scan.aiReport || MOCK.aiReport;

    const [tool, setTool] = useState('zoom');
    const [showAI, setShowAI] = useState(true);
    const [heatmap, setHeatmap] = useState(true);
    const [split, setSplit] = useState(false);
    const [invert, setInvert] = useState(false);
    const [slice, setSlice] = useState(12);
    const [zoom, setZoom] = useState(1);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [window, setWindow] = useState('brain');
    const [annotations, setAnnotations] = useState([]);
    const [annModal, setAnnModal] = useState(false);
    const [annText, setAnnText] = useState('');

    const px = useRef(new Animated.Value(0)).current;
    const py = useRef(new Animated.Value(0)).current;
    const pr = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: () => tool === 'pan',
        onPanResponderMove: Animated.event([null, { dx: px, dy: py }], { useNativeDriver: false }),
        onPanResponderRelease: () => { px.extractOffset(); py.extractOffset(); },
    })).current;

    const addAnn = () => {
        if (annText.trim()) { setAnnotations(a => [...a, { id: Date.now(), text: annText }]); }
        setAnnText(''); setAnnModal(false);
    };

    return (
        <View style={s.root}>
            {/* Top bar */}
            <View style={s.topBar}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.topTitle}>{scan.scanType} · {scan.bodyPart}</Text>
                    <Text style={s.topSub}>{scan.patientName} · {scan.studyDate}</Text>
                </View>
                <View style={s.tbRight}>
                    <TouchableOpacity style={[s.tbBtn, showAI && s.tbBtnOn]} onPress={() => setShowAI(v => !v)}>
                        <Ionicons name="sparkles" size={13} color={showAI ? '#fff' : COLORS.textMuted} />
                        <Text style={[s.tbTxt, showAI && { color: '#fff' }]}>AI</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.tbBtn, split && s.tbBtnOn]} onPress={() => setSplit(v => !v)}>
                        <Ionicons name="grid" size={13} color={split ? '#fff' : COLORS.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.tbBtn} onPress={() => navigation.navigate('ReportViewer', { scan })}>
                        <Ionicons name="document-text" size={13} color={COLORS.textMuted} />
                        <Text style={s.tbTxt}>Report</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={s.body}>
                {/* Tool rail */}
                <View style={s.rail}>
                    {TOOLS.map(t => (
                        <TouchableOpacity key={t.id} style={[s.railBtn, tool === t.id && s.railBtnOn]}
                            onPress={() => t.id === 'annotate' ? setAnnModal(true) : setTool(t.id)}>
                            <Ionicons name={t.icon} size={17} color={tool === t.id ? COLORS.primary : COLORS.textMuted} />
                            <Text style={[s.railLbl, tool === t.id && { color: COLORS.primary }]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                    <View style={s.railDiv} />
                    <TouchableOpacity style={s.railBtn} onPress={() => setZoom(v => Math.min(4, v + 0.25))}>
                        <Ionicons name="add-circle" size={17} color={COLORS.textMuted} /><Text style={s.railLbl}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.railBtn} onPress={() => setZoom(v => Math.max(0.5, v - 0.25))}>
                        <Ionicons name="remove-circle" size={17} color={COLORS.textMuted} /><Text style={s.railLbl}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.railBtn, invert && s.railBtnOn]} onPress={() => setInvert(v => !v)}>
                        <Ionicons name="contrast" size={17} color={invert ? COLORS.primary : COLORS.textMuted} />
                        <Text style={[s.railLbl, invert && { color: COLORS.primary }]}>Inv</Text>
                    </TouchableOpacity>
                </View>

                {/* Viewer(s) */}
                <View style={s.viewers}>
                    {/* Main viewport */}
                    <View style={[s.vp, split && { flex: 1 }]}>
                        <View style={s.vpHead}>
                            <Text style={s.vpHdTxt}>{scan.institution}</Text>
                            <Text style={s.vpHdTxt}>{zoom.toFixed(2)}x · W:{WINDOWS.find(w => w.id === window)?.ww}</Text>
                        </View>
                        <Animated.View style={[s.imgWrap, { transform: [{ translateX: px }, { translateY: py }, { scale: zoom }] }]}
                            {...pr.panHandlers}>
                            <View style={[s.scanCircle, invert && { backgroundColor: '#fff' }]}>
                                <View style={s.scanBrain} />
                                <View style={[s.scanVent, { left: '28%' }]} />
                                <View style={[s.scanVent, { right: '28%' }]} />
                                {showAI && heatmap && <>
                                    <View style={s.hotspot1} />
                                    <View style={s.hotspot2} />
                                </>}
                            </View>
                            <View style={s.scaleBadge}><View style={s.scaleLine} /><Text style={s.scaleNum}>10mm</Text></View>
                            {annotations.map((a, i) => (
                                <View key={a.id} style={[s.annPin, { top: 30 + i * 20, left: 30 }]}>
                                    <View style={s.annDot} /><Text style={s.annTxt}>{a.text}</Text>
                                </View>
                            ))}
                        </Animated.View>
                        {/* DICOM overlay text */}
                        <Text style={[s.ovr, { top: 28, left: 8 }]}>{scan.patientName}</Text>
                        <Text style={[s.ovr, { top: 40, left: 8 }]}>{scan.studyDate}</Text>
                        <Text style={[s.ovr, { top: 28, right: 8, textAlign: 'right' }]}>Slice {slice}/{scan.slices}</Text>
                        {showAI && <View style={[s.aiBadge, { borderColor: RC(ai.riskLevel) + '80', backgroundColor: RC(ai.riskLevel) + '20' }]}>
                            <Ionicons name="sparkles" size={9} color={RC(ai.riskLevel)} />
                            <Text style={[s.aiBadgeTxt, { color: RC(ai.riskLevel) }]}>AI {Math.round(ai.confidence * 100)}% · {ai.riskLevel.toUpperCase()}</Text>
                        </View>}
                        <Text style={[s.orient, { top: 36, alignSelf: 'center' }]}>S</Text>
                        <Text style={[s.orient, { bottom: 48, alignSelf: 'center' }]}>I</Text>
                        <Text style={[s.orient, { left: 8, top: '50%' }]}>R</Text>
                        <Text style={[s.orient, { right: 8, top: '50%' }]}>L</Text>
                    </View>

                    {split && (
                        <View style={[s.vp, { flex: 1, marginLeft: 3 }]}>
                            <View style={s.vpHead}><Text style={s.vpHdTxt}>PLAIN (No AI)</Text></View>
                            <View style={s.imgWrap}>
                                <View style={s.scanCircle}><View style={s.scanBrain} /><View style={[s.scanVent, { left: '28%' }]} /><View style={[s.scanVent, { right: '28%' }]} /></View>
                            </View>
                        </View>
                    )}

                    {/* Findings sidebar */}
                    {showAI && (
                        <ScrollView style={s.sidebar} showsVerticalScrollIndicator={false}>
                            <View style={[s.riskRow, { borderColor: RC(ai.riskLevel) + '50', backgroundColor: RC(ai.riskLevel) + '12' }]}>
                                <Text style={[s.riskTxt, { color: RC(ai.riskLevel) }]}>{ai.riskLevel.toUpperCase()} RISK</Text>
                                <Text style={[s.riskPct, { color: RC(ai.riskLevel) }]}>{Math.round(ai.confidence * 100)}%</Text>
                            </View>

                            <Text style={s.sideSec}>FINDINGS</Text>
                            <Text style={s.findTxt}>{ai.findings}</Text>

                            <Text style={s.sideSec}>DETECTED ISSUES</Text>
                            {ai.detectedIssues.map((iss, i) => (
                                <View key={i} style={s.issCard}>
                                    <View style={s.issTop}>
                                        <View style={[s.issDot, { backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.info }]} />
                                        <Text style={s.issName}>{iss.name}</Text>
                                        <Text style={[s.issProb, { color: i === 0 ? COLORS.danger : COLORS.warning }]}>{Math.round(iss.probability * 100)}%</Text>
                                    </View>
                                    <Text style={s.issLoc}>{iss.location}</Text>
                                    <View style={s.probBg}><View style={[s.probFg, { width: `${iss.probability * 100}%`, backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.info }]} /></View>
                                </View>
                            ))}

                            <TouchableOpacity style={[s.hmToggle, heatmap && { borderColor: COLORS.primary }]} onPress={() => setHeatmap(v => !v)}>
                                <Ionicons name={heatmap ? 'eye' : 'eye-off'} size={13} color={heatmap ? COLORS.primary : COLORS.textMuted} />
                                <Text style={[s.hmTxt, heatmap && { color: COLORS.primary }]}>{heatmap ? 'Heatmap ON' : 'Heatmap OFF'}</Text>
                            </TouchableOpacity>

                            <Text style={s.sideSec}>RECOMMENDATIONS</Text>
                            {ai.recommendations.map((r, i) => (
                                <View key={i} style={s.recRow}><View style={s.recDot} /><Text style={s.recTxt}>{r}</Text></View>
                            ))}

                            <TouchableOpacity style={s.reportBtn} onPress={() => navigation.navigate('ReportViewer', { scan })}>
                                <Ionicons name="document-text" size={15} color="#fff" />
                                <Text style={s.reportBtnTxt}>Full Report</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>

                {/* Bottom controls */}
            </View>

            <View style={s.bottom}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.winRow}>
                    {WINDOWS.map(w => (
                        <TouchableOpacity key={w.id} style={[s.winBtn, window === w.id && s.winBtnOn]} onPress={() => setWindow(w.id)}>
                            <Text style={[s.winTxt, window === w.id && { color: '#fff' }]}>{w.label}</Text>
                            <Text style={s.wlTxt}>WL:{w.wl} WW:{w.ww}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <View style={s.sliceCtrl}>
                    <TouchableOpacity onPress={() => setSlice(v => Math.max(1, v - 1))}><Ionicons name="chevron-back" size={18} color={COLORS.textMuted} /></TouchableOpacity>
                    <Text style={s.sliceTxt}>Slice {slice} / {scan.slices}</Text>
                    <TouchableOpacity onPress={() => setSlice(v => Math.min(scan.slices || 24, v + 1))}><Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} /></TouchableOpacity>
                    <Text style={s.wcTxt}>  B:{brightness}%</Text>
                    <TouchableOpacity onPress={() => setBrightness(v => Math.min(200, v + 10))}><Ionicons name="add" size={14} color={COLORS.textMuted} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setBrightness(v => Math.max(20, v - 10))}><Ionicons name="remove" size={14} color={COLORS.textMuted} /></TouchableOpacity>
                    <Text style={s.wcTxt}>  C:{contrast}%</Text>
                    <TouchableOpacity onPress={() => setContrast(v => Math.min(300, v + 10))}><Ionicons name="add" size={14} color={COLORS.textMuted} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setContrast(v => Math.max(20, v - 10))}><Ionicons name="remove" size={14} color={COLORS.textMuted} /></TouchableOpacity>
                </View>
            </View>

            <Modal visible={annModal} transparent animationType="slide">
                <View style={s.modOverlay}>
                    <View style={s.modCard}>
                        <Text style={s.modTitle}>Add Annotation</Text>
                        <TextInput style={s.modInput} placeholder="Type annotation..." placeholderTextColor={COLORS.textMuted} value={annText} onChangeText={setAnnText} multiline />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                            <TouchableOpacity style={[s.modBtn, { backgroundColor: COLORS.border }]} onPress={() => setAnnModal(false)}><Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[s.modBtn, { backgroundColor: COLORS.primary, flex: 1 }]} onPress={addAnn}><Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050d1a' },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 10, backgroundColor: '#08111e', borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    topTitle: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    topSub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    tbRight: { flexDirection: 'row', gap: 6 },
    tbBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    tbBtnOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tbTxt: { fontSize: 10, color: COLORS.textMuted, ...FONTS.semiBold },
    body: { flex: 1, flexDirection: 'row' },
    rail: { width: 54, backgroundColor: '#060e1c', borderRightWidth: 1, borderRightColor: COLORS.border, alignItems: 'center', paddingVertical: 10, gap: 2 },
    railBtn: { width: 42, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
    railBtnOn: { backgroundColor: COLORS.primaryGlow },
    railLbl: { fontSize: 7, color: COLORS.textMuted, ...FONTS.bold },
    railDiv: { height: 1, width: 28, backgroundColor: COLORS.border, marginVertical: 4 },
    viewers: { flex: 1, flexDirection: 'row' },
    vp: { flex: 2, backgroundColor: '#000', position: 'relative', overflow: 'hidden' },
    vpHead: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 5, zIndex: 5, backgroundColor: 'rgba(0,0,0,0.6)' },
    vpHdTxt: { fontSize: 8, color: 'rgba(255,255,255,0.4)', ...FONTS.medium },
    imgWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    scanCircle: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#111', borderWidth: 3, borderColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
    scanBrain: { width: 140, height: 160, borderRadius: 70, backgroundColor: '#222' },
    scanVent: { position: 'absolute', top: '28%', width: 24, height: 16, borderRadius: 8, backgroundColor: '#0a0a0a' },
    hotspot1: { position: 'absolute', top: 40, right: 30, width: 55, height: 55, borderRadius: 28, backgroundColor: 'rgba(211,47,47,0.55)' },
    hotspot2: { position: 'absolute', top: 55, right: 18, width: 75, height: 65, borderRadius: 35, backgroundColor: 'rgba(255,167,38,0.28)' },
    scaleBadge: { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    scaleLine: { width: 28, height: 1.5, backgroundColor: '#fff' },
    scaleNum: { fontSize: 8, color: '#fff' },
    annPin: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4 },
    annDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.warning, borderWidth: 1.5, borderColor: '#fff' },
    annTxt: { fontSize: 8, color: '#fff', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
    ovr: { position: 'absolute', fontSize: 8, color: 'rgba(255,255,255,0.38)', ...FONTS.semiBold },
    aiBadge: { position: 'absolute', bottom: 6, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    aiBadgeTxt: { fontSize: 8, ...FONTS.bold },
    orient: { position: 'absolute', fontSize: 10, color: 'rgba(255,255,255,0.35)', ...FONTS.bold },
    sidebar: { width: 190, backgroundColor: '#080f1c', borderLeftWidth: 1, borderLeftColor: COLORS.border, padding: 12 },
    riskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, padding: 10, borderWidth: 1, marginBottom: 12 },
    riskTxt: { fontSize: 11, ...FONTS.bold, letterSpacing: .5 },
    riskPct: { fontSize: 16, ...FONTS.bold },
    sideSec: { fontSize: 8, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, ...FONTS.bold, marginTop: 12, marginBottom: 6 },
    findTxt: { fontSize: 10, color: COLORS.textSecondary, lineHeight: 16 },
    issCard: { backgroundColor: COLORS.card, borderRadius: 8, padding: 9, borderWidth: 1, borderColor: COLORS.border, marginBottom: 7 },
    issTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
    issDot: { width: 5, height: 5, borderRadius: 3 },
    issName: { flex: 1, fontSize: 10, color: '#fff', ...FONTS.semiBold },
    issProb: { fontSize: 11, ...FONTS.bold },
    issLoc: { fontSize: 8, color: COLORS.textMuted, marginBottom: 5 },
    probBg: { height: 2.5, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
    probFg: { height: '100%', borderRadius: 2 },
    hmToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 8, marginTop: 6 },
    hmTxt: { fontSize: 10, color: COLORS.textMuted, ...FONTS.semiBold },
    recRow: { flexDirection: 'row', gap: 7, marginBottom: 6, alignItems: 'flex-start' },
    recDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 5 },
    recTxt: { flex: 1, fontSize: 9, color: COLORS.textSecondary, lineHeight: 14 },
    reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11, marginTop: 14, marginBottom: 20 },
    reportBtnTxt: { fontSize: SIZES.sm, color: '#fff', ...FONTS.bold },
    bottom: { backgroundColor: '#08111e', borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 7, gap: 6 },
    winRow: { paddingHorizontal: 14, gap: 7, alignItems: 'center' },
    winBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    winBtnOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    winTxt: { fontSize: 10, color: COLORS.textMuted, ...FONTS.semiBold },
    wlTxt: { fontSize: 7, color: COLORS.textMuted, marginTop: 1 },
    sliceCtrl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sliceTxt: { fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold, minWidth: 90, textAlign: 'center' },
    wcTxt: { fontSize: 10, color: COLORS.textMuted },
    modOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modTitle: { fontSize: SIZES.lg, color: '#fff', ...FONTS.bold, marginBottom: 12 },
    modInput: { backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, fontSize: SIZES.md, color: '#fff', minHeight: 70, textAlignVertical: 'top' },
    modBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
});

export default ScanViewerScreen;
