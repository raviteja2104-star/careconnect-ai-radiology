import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { getDicomViewerHTML } from '../components/DICOMViewerHTML';

const SAMPLE_DICOM_URL = '';

const MOCK = {
  scanId: 'SCAN-2026-001', scanType: 'CT', bodyPart: 'Head',
  patientName: 'Ravi Teja', studyDate: '25 Apr 2026', slices: 24,
  institution: 'Apollo Diagnostics, Hyderabad',
  dicomUrl: null,
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

const RC = r => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);

const ScanViewerScreen = ({ navigation, route }) => {
  const scan = route?.params?.scan || MOCK;
  const ai = scan.aiReport || MOCK.aiReport;
  const dicomUrl = scan.dicomUrl || SAMPLE_DICOM_URL;

  const [tab, setTab] = useState('DICOM');
  const [loading, setLoading] = useState(true);
  const [slices, setSlices] = useState(1);
  const webRef = useRef(null);

  const html = getDicomViewerHTML({
    dicomUrl,
    patientName: scan.patientName,
    scanType: scan.scanType,
    bodyPart: scan.bodyPart,
    aiFindings: ai.detectedIssues?.[0]?.name,
    aiConf: Math.round((ai.confidence || 0) * 100),
    riskLevel: ai.riskLevel,
  });

  const handleMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'loaded') { setLoading(false); setSlices(msg.slices || 1); }
      if (msg.type === 'navigate' && msg.target === 'ReportEditor') {
        navigation.navigate('ReportEditor', { scan });
      }
      if (msg.type === 'error') {
        setLoading(false);
      }
    } catch (_) {}
  }, [navigation, scan]);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{scan.scanType} · {scan.bodyPart}</Text>
          <Text style={s.sub}>{scan.patientName} · {scan.studyDate || scan.receivedAt}</Text>
        </View>
        <View style={[s.riskBadge, { backgroundColor: RC(ai.riskLevel) + '25', borderColor: RC(ai.riskLevel) + '60' }]}>
          <Text style={[s.riskTxt, { color: RC(ai.riskLevel) }]}>{(ai.riskLevel || 'N/A').toUpperCase()}</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {['DICOM', 'AI Analysis'].map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => setTab(t)}>
            <Ionicons name={t === 'DICOM' ? 'scan' : 'sparkles'} size={13} color={tab === t ? '#fff' : COLORS.textMuted} />
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.reportTabBtn} onPress={() => navigation.navigate('ReportEditor', { scan })}>
          <Ionicons name="create" size={13} color={COLORS.primary} />
          <Text style={[s.tabTxt, { color: COLORS.primary }]}>Write Report</Text>
        </TouchableOpacity>
      </View>

      {/* DICOM Viewer (WebView + DWV) */}
      {tab === 'DICOM' && (
        <View style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <View style={s.loadOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={s.loadTxt}>Loading DICOM Viewer…</Text>
              <Text style={s.loadSub}>Powered by DWV · Cornerstone-compatible</Text>
            </View>
          )}
          <WebView
            ref={webRef}
            style={{ flex: 1, backgroundColor: '#000' }}
            source={{ html }}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
            onMessage={handleMessage}
            onLoad={() => setTimeout(() => setLoading(false), 2000)}
            onError={() => setLoading(false)}
            originWhitelist={['*']}
          />
          <View style={s.metaBar}>
            <Text style={s.metaTxt}>{scan.institution || 'CareConnect Diagnostics'}</Text>
            <Text style={s.metaTxt}>{scan.scanId || scan.id}</Text>
            <Text style={s.metaTxt}>Slices: {slices}</Text>
          </View>
        </View>
      )}

      {/* AI Analysis Panel */}
      {tab === 'AI Analysis' && (
        <ScrollView contentContainerStyle={s.aiPanel}>
          <View style={[s.riskCard, { borderColor: RC(ai.riskLevel) + '50', backgroundColor: RC(ai.riskLevel) + '10' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.riskLabel, { color: RC(ai.riskLevel) }]}>{(ai.riskLevel || '').toUpperCase()} RISK</Text>
              <Text style={s.riskDesc}>AI Confidence: {Math.round((ai.confidence || 0) * 100)}%</Text>
            </View>
            <Text style={[s.riskPct, { color: RC(ai.riskLevel) }]}>{Math.round((ai.confidence || 0) * 100)}%</Text>
          </View>

          <Text style={s.secTitle}>FINDINGS</Text>
          <View style={s.findCard}>
            <Text style={s.findTxt}>{ai.findings}</Text>
          </View>

          <Text style={s.secTitle}>DETECTED ISSUES</Text>
          {(ai.detectedIssues || []).map((iss, i) => (
            <View key={i} style={s.issCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <View style={[s.issDot, { backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.primary }]} />
                <Text style={s.issName}>{iss.name}</Text>
                <Text style={[s.issProb, { color: i === 0 ? COLORS.danger : COLORS.warning }]}>{Math.round(iss.probability * 100)}%</Text>
              </View>
              <Text style={s.issLoc}>{iss.location}</Text>
              <View style={s.probBg}>
                <View style={[s.probFg, { width: `${Math.round(iss.probability * 100)}%`, backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.primary }]} />
              </View>
            </View>
          ))}

          <Text style={s.secTitle}>RECOMMENDATIONS</Text>
          {(ai.recommendations || []).map((r, i) => (
            <View key={i} style={s.recRow}>
              <View style={s.recDot} />
              <Text style={s.recTxt}>{r}</Text>
            </View>
          ))}

          <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('ReportEditor', { scan })}>
            <Ionicons name="create" size={16} color="#fff" />
            <Text style={s.ctaTxt}>Write Radiology Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.ctaBtn, s.ctaSecondary]} onPress={() => navigation.navigate('ReportViewer', { scan })}>
            <Ionicons name="document-text" size={16} color={COLORS.primary} />
            <Text style={[s.ctaTxt, { color: COLORS.primary }]}>View Existing Report</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  riskTxt: { fontSize: 9, ...FONTS.bold, letterSpacing: .5 },
  tabBar: { flexDirection: 'row', gap: 6, padding: 8, backgroundColor: '#08111e', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  tabBtnOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  reportTabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primary + '50', marginLeft: 'auto' },
  tabTxt: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold },
  tabTxtOn: { color: '#fff' },
  loadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 12 },
  loadTxt: { color: '#fff', fontSize: SIZES.base, ...FONTS.semiBold },
  loadSub: { color: COLORS.textMuted, fontSize: SIZES.xs },
  metaBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,.7)', paddingHorizontal: 12, paddingVertical: 4 },
  metaTxt: { fontSize: 8, color: 'rgba(255,255,255,.35)', ...FONTS.semiBold },
  aiPanel: { padding: 18, gap: 4, paddingBottom: 60 },
  riskCard: { flexDirection: 'row', alignItems: 'center', borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, marginBottom: 12 },
  riskLabel: { fontSize: SIZES.base, ...FONTS.bold },
  riskDesc: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  riskPct: { fontSize: 32, ...FONTS.bold },
  secTitle: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, ...FONTS.bold, marginTop: 14, marginBottom: 8 },
  findCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  findTxt: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  issCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  issDot: { width: 7, height: 7, borderRadius: 4 },
  issName: { flex: 1, fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold },
  issProb: { fontSize: SIZES.base, ...FONTS.bold },
  issLoc: { fontSize: SIZES.xs, color: COLORS.textMuted, marginBottom: 7 },
  probBg: { height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  probFg: { height: '100%', borderRadius: 2 },
  recRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 7 },
  recDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 5 },
  recTxt: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, paddingVertical: 14, marginTop: 16 },
  ctaSecondary: { backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primary + '50', marginTop: 8 },
  ctaTxt: { color: '#fff', fontSize: SIZES.md, ...FONTS.bold },
});

export default ScanViewerScreen;
