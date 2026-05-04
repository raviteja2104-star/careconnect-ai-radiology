import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const BACKEND = 'http://localhost:5000';

const MOCK = {
    scanId: 'SCAN-2026-001', scanType: 'CT', bodyPart: 'Head',
    patientName: 'Ravi Teja', studyDate: '25 Apr 2026', slices: 24,
    institution: 'Apollo Diagnostics, Hyderabad',
    studyUID: '1.2.840.113619.2.55.3.604688119.971.1717595236.375',
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
    { icon: 'scan-outline', label: 'Zoom', key: 'zoom' },
    { icon: 'move', label: 'Pan', key: 'pan' },
    { icon: 'resize', label: 'Measure', key: 'measure' },
    { icon: 'pencil', label: 'Mark', key: 'annotate' },
    { icon: 'contrast', label: 'W/L', key: 'wl' },
];

const WINDOWS = [
    { label: 'Brain', wl: 40, ww: 80 },
    { label: 'Bone', wl: 300, ww: 1500 },
    { label: 'Lung', wl: -600, ww: 1500 },
    { label: 'Soft', wl: 50, ww: 350 },
];

const RC = r => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);

// ─── Web-only OHIF iframe wrapper ──────────────────────────────────────────
const OHIFFrame = ({ studyUID, ai, scan }) => {
    const [loading, setLoading] = useState(true);
    const iframeRef = React.useRef(null);

    const viewerUrl = `${BACKEND}/viewer${studyUID ? `?studyUID=${studyUID}` : ''}`;

    // Send AI data to viewer via postMessage once loaded
    const onLoad = () => {
        setLoading(false);
        try {
            iframeRef.current?.contentWindow?.postMessage({ type: 'aiData', ai }, '*');
        } catch (_) {}
    };

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            {loading && (
                <View style={s.loadOverlay}>
                    <View style={s.ohifBrand}>
                        <View style={s.ohifIcon}><Text style={{ fontSize: 22, color: '#0A1628', fontWeight: '700' }}>✚</Text></View>
                        <View>
                            <Text style={{ color: '#00E5A0', fontWeight: '700', fontSize: 16 }}>CareConnect Radiology</Text>
                            <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>Connecting to DICOMweb…</Text>
                        </View>
                    </View>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
            {Platform.OS === 'web' && (
                <iframe
                    ref={iframeRef}
                    src={viewerUrl}
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#050d1a' }}
                    allow="fullscreen"
                    onLoad={onLoad}
                    title="CareConnect DICOM Viewer"
                />
            )}
        </View>
    );
};

// ─── Native canvas fallback viewer ─────────────────────────────────────────
const NativeViewer = ({ scan, ai, navigation }) => {
    const [tool, setTool] = useState('pan');
    const [slice, setSlice] = useState(12);
    const [showAI, setShowAI] = useState(true);
    const [inverted, setInverted] = useState(false);
    const [windowPreset, setWindowPreset] = useState(0);
    const totalSlices = scan.slices || 24;

    return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
            {/* Tool Rail */}
            <View style={s.toolRail}>
                {TOOLS.map(t => (
                    <TouchableOpacity key={t.key} style={[s.toolBtn, tool === t.key && s.toolBtnOn]}
                        onPress={() => setTool(t.key)}>
                        <Ionicons name={t.icon} size={16} color={tool === t.key ? COLORS.primary : COLORS.textMuted} />
                        <Text style={[s.toolLabel, tool === t.key && { color: COLORS.primary }]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6 }} />
                <TouchableOpacity style={[s.toolBtn, inverted && s.toolBtnOn]} onPress={() => setInverted(!inverted)}>
                    <Ionicons name="invert-mode" size={16} color={inverted ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[s.toolLabel, inverted && { color: COLORS.primary }]}>Inv</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.toolBtn, showAI && { backgroundColor: COLORS.danger + '20' }]} onPress={() => setShowAI(!showAI)}>
                    <Ionicons name="flame" size={16} color={showAI ? COLORS.danger : COLORS.textMuted} />
                    <Text style={[s.toolLabel, showAI && { color: COLORS.danger }]}>AI</Text>
                </TouchableOpacity>
            </View>

            {/* Canvas Area */}
            <View style={s.canvas}>
                <View style={[s.scanImage, inverted && { backgroundColor: '#e0e0e0' }]}>
                    {/* Orientation markers */}
                    <Text style={[s.orient, { top: 8, left: '47%' }]}>S</Text>
                    <Text style={[s.orient, { bottom: 8, left: '47%' }]}>I</Text>
                    <Text style={[s.orient, { top: '47%', left: 8 }]}>R</Text>
                    <Text style={[s.orient, { top: '47%', right: 8 }]}>L</Text>

                    {/* Brain shape */}
                    <View style={[s.brainOuter, inverted && { borderColor: '#444' }]}>
                        <View style={[s.brainInner, inverted && { borderColor: '#666' }]}>
                            <View style={[s.ventricle, { left: '30%' }, inverted && { backgroundColor: '#000' }]} />
                            <View style={[s.ventricle, { right: '30%' }, inverted && { backgroundColor: '#000' }]} />
                        </View>
                    </View>

                    {/* AI Heatmap */}
                    {showAI && (ai.detectedIssues || []).map((iss, i) => (
                        <View key={i} style={[s.heatSpot, {
                            top: `${22 + i * 16}%`, right: `${18 + i * 12}%`,
                            width: 52 - i * 10, height: 44 - i * 8,
                            backgroundColor: i === 0 ? 'rgba(255,60,60,0.35)' : i === 1 ? 'rgba(255,165,0,0.25)' : 'rgba(0,180,255,0.2)',
                            borderColor: i === 0 ? 'rgba(255,60,60,0.6)' : 'transparent',
                        }]}>
                            <Text style={s.heatLabel}>{iss.name.split(' ')[0]}</Text>
                        </View>
                    ))}

                    {/* DICOM info overlay */}
                    <View style={s.scanMetaL}>
                        <Text style={s.metaLine}>{scan.patientName}</Text>
                        <Text style={s.metaLine}>{scan.scanType} {scan.bodyPart}</Text>
                        <Text style={s.metaLine}>Slice {slice}/{totalSlices}</Text>
                        <Text style={s.metaLine}>WL:{WINDOWS[windowPreset].wl} WW:{WINDOWS[windowPreset].ww}</Text>
                    </View>
                    <View style={s.scanMetaR}>
                        <Text style={s.metaLine}>{scan.institution || 'CareConnect'}</Text>
                        <Text style={s.metaLine}>{scan.scanId || scan.id}</Text>
                        {showAI && <Text style={[s.metaLine, { color: COLORS.danger }]}>AI {Math.round(ai.confidence * 100)}%</Text>}
                    </View>
                </View>

                {/* Window presets */}
                <View style={s.windowBar}>
                    {WINDOWS.map((w, i) => (
                        <TouchableOpacity key={i} style={[s.windowBtn, windowPreset === i && s.windowBtnOn]} onPress={() => setWindowPreset(i)}>
                            <Text style={[s.windowTxt, windowPreset === i && { color: '#fff' }]}>{w.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Slice nav */}
                <View style={s.sliceBar}>
                    <TouchableOpacity style={s.sliceBtn} onPress={() => setSlice(Math.max(1, slice - 1))}>
                        <Ionicons name="chevron-back" size={16} color="#fff" />
                    </TouchableOpacity>
                    <View style={s.sliceTrack}>
                        <View style={[s.sliceFill, { width: `${(slice / totalSlices) * 100}%` }]} />
                    </View>
                    <Text style={s.sliceNum}>{slice}/{totalSlices}</Text>
                    <TouchableOpacity style={s.sliceBtn} onPress={() => setSlice(Math.min(totalSlices, slice + 1))}>
                        <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// ─── AI Panel ──────────────────────────────────────────────────────────────
const AIPanel = ({ scan, ai, navigation }) => (
    <ScrollView contentContainerStyle={s.aiPanel}>
        <View style={[s.riskCard, { borderColor: RC(ai.riskLevel) + '50', backgroundColor: RC(ai.riskLevel) + '10' }]}>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: SIZES.base, ...FONTS.bold, color: RC(ai.riskLevel) }}>{(ai.riskLevel || '').toUpperCase()} RISK</Text>
                <Text style={{ fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 }}>AI Confidence: {Math.round((ai.confidence || 0) * 100)}%</Text>
            </View>
            <Text style={{ fontSize: 36, ...FONTS.bold, color: RC(ai.riskLevel) }}>{Math.round((ai.confidence || 0) * 100)}%</Text>
        </View>

        <Text style={s.secTitle}>FINDINGS</Text>
        <View style={s.card}><Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 }}>{ai.findings}</Text></View>

        <Text style={s.secTitle}>DETECTED ISSUES</Text>
        {(ai.detectedIssues || []).map((iss, i) => (
            <View key={i} style={s.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.primary }} />
                    <Text style={{ flex: 1, fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold }}>{iss.name}</Text>
                    <Text style={{ fontSize: SIZES.base, ...FONTS.bold, color: i === 0 ? COLORS.danger : COLORS.warning }}>{Math.round(iss.probability * 100)}%</Text>
                </View>
                <Text style={{ fontSize: SIZES.xs, color: COLORS.textMuted, marginBottom: 6 }}>{iss.location}</Text>
                <View style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ height: '100%', borderRadius: 2, width: `${Math.round(iss.probability * 100)}%`, backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.primary }} />
                </View>
            </View>
        ))}

        <Text style={s.secTitle}>RECOMMENDATIONS</Text>
        {(ai.recommendations || []).map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 6 }} />
                <Text style={{ flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 }}>{r}</Text>
            </View>
        ))}

        <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('ReportEditor', { scan })}>
            <Ionicons name="create" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: SIZES.md, ...FONTS.bold }}>Write Radiology Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctaBtn, { backgroundColor: COLORS.primaryGlow, marginTop: 8, borderWidth: 1, borderColor: COLORS.primary + '50' }]}
            onPress={() => navigation.navigate('ReportViewer', { scan })}>
            <Ionicons name="document-text" size={16} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontSize: SIZES.md, ...FONTS.bold }}>View Existing Report</Text>
        </TouchableOpacity>
    </ScrollView>
);

// ─── Main Screen ──────────────────────────────────────────────────────────
const ScanViewerScreen = ({ navigation, route }) => {
    const scan = route?.params?.scan || MOCK;
    const ai = scan.aiReport || MOCK.aiReport;
    const studyUID = scan.studyUID || MOCK.studyUID;

    // Tabs: OHIF (web only), Native, AI Analysis
    const isWeb = Platform.OS === 'web';
    const defaultTab = isWeb ? 'ohif' : 'native';
    const [tab, setTab] = useState(defaultTab);

    const TABS = [
        ...(isWeb ? [{ key: 'ohif', icon: 'cube', label: 'OHIF Viewer' }] : []),
        { key: 'native', icon: 'scan', label: 'Quick View' },
        { key: 'ai', icon: 'sparkles', label: 'AI Analysis' },
    ];

    return (
        <SafeAreaView style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>{scan.scanType} · {scan.bodyPart}</Text>
                    <Text style={s.sub}>{scan.patientName} · {scan.studyDate || scan.date}</Text>
                </View>
                <View style={[s.riskBadge, { backgroundColor: RC(ai.riskLevel) + '25', borderColor: RC(ai.riskLevel) + '60' }]}>
                    <Text style={[s.riskTxt, { color: RC(ai.riskLevel) }]}>{(ai.riskLevel || 'N/A').toUpperCase()}</Text>
                </View>
            </View>

            {/* Tab Bar */}
            <View style={s.tabBar}>
                {TABS.map(t => (
                    <TouchableOpacity key={t.key} style={[s.tabBtn, tab === t.key && s.tabBtnOn]} onPress={() => setTab(t.key)}>
                        <Ionicons name={t.icon} size={12} color={tab === t.key ? '#fff' : COLORS.textMuted} />
                        <Text style={[s.tabTxt, tab === t.key && { color: '#fff' }]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={s.reportBtn} onPress={() => navigation.navigate('ReportEditor', { scan })}>
                    <Ionicons name="create" size={12} color={COLORS.primary} />
                    <Text style={{ fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.semiBold }}>Write Report</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {tab === 'ohif' && <OHIFFrame studyUID={studyUID} />}
            {tab === 'native' && <NativeViewer scan={scan} ai={ai} navigation={navigation} />}
            {tab === 'ai' && <AIPanel scan={scan} ai={ai} navigation={navigation} />}
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050d1a' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: '#08111e', borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    sub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    riskBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
    riskTxt: { fontSize: 9, ...FONTS.bold, letterSpacing: 0.5 },
    tabBar: { flexDirection: 'row', gap: 6, padding: 8, backgroundColor: '#08111e', borderBottomWidth: 1, borderBottomColor: COLORS.border, flexWrap: 'wrap' },
    tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    tabBtnOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabTxt: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold },
    reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primary + '50', marginLeft: 'auto' },
    // OHIF loading
    loadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10 },
    ohifBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    ohifIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#00E5A0', alignItems: 'center', justifyContent: 'center' },
    loadTxt: { color: COLORS.textMuted, fontSize: SIZES.sm },
    // Tool rail
    toolRail: { width: 56, backgroundColor: '#08111e', borderRightWidth: 1, borderRightColor: COLORS.border, paddingTop: 8, alignItems: 'center', gap: 2 },
    toolBtn: { width: 48, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
    toolBtnOn: { backgroundColor: COLORS.primaryGlow },
    toolLabel: { fontSize: 8, color: COLORS.textMuted, marginTop: 2 },
    // Canvas
    canvas: { flex: 1, backgroundColor: '#000' },
    scanImage: { flex: 1, backgroundColor: '#0a0a0a', position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    orient: { position: 'absolute', fontSize: 10, color: 'rgba(0,200,255,0.5)', ...FONTS.bold },
    brainOuter: { width: '55%', aspectRatio: 1, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(200,200,200,0.15)', alignItems: 'center', justifyContent: 'center' },
    brainInner: { width: '75%', aspectRatio: 1.1, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(200,200,200,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 20 },
    ventricle: { width: 12, height: 20, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)' },
    heatSpot: { position: 'absolute', borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    heatLabel: { fontSize: 7, color: 'rgba(255,255,255,0.85)', ...FONTS.bold },
    scanMetaL: { position: 'absolute', top: 8, left: 8 },
    scanMetaR: { position: 'absolute', top: 8, right: 8, alignItems: 'flex-end' },
    metaLine: { fontSize: 8, color: 'rgba(0,200,255,0.5)', fontFamily: 'monospace', lineHeight: 13 },
    windowBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.8)', gap: 4, padding: 6, justifyContent: 'center' },
    windowBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    windowBtnOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    windowTxt: { fontSize: 10, color: COLORS.textMuted, ...FONTS.semiBold },
    sliceBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 12, paddingVertical: 8 },
    sliceBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    sliceTrack: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
    sliceFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
    sliceNum: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.bold, minWidth: 36, textAlign: 'center' },
    // AI Panel
    aiPanel: { padding: 18, gap: 4, paddingBottom: 60 },
    riskCard: { flexDirection: 'row', alignItems: 'center', borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, marginBottom: 12 },
    secTitle: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, ...FONTS.bold, marginTop: 14, marginBottom: 8 },
    card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
    ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, paddingVertical: 14, marginTop: 16 },
});

export default ScanViewerScreen;
