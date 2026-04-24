import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const RC = r => ({ low: COLORS.success, medium: COLORS.warning, high: COLORS.danger, critical: '#D32F2F' }[r] || COLORS.textMuted);

const MOCK = {
    scanId: 'SCAN-2026-001', scanType: 'CT', bodyPart: 'Chest',
    studyDate: '25 Apr 2026', studyTime: '09:41',
    institution: 'Apollo Diagnostics, Hyderabad',
    referringDoctor: 'Dr. Priya Anand',
    patientId: { firstName: 'Ravi', lastName: 'Teja', dateOfBirth: '15 Jun 1995', gender: 'Male', bloodGroup: 'O+' },
    aiReport: {
        riskLevel: 'high', confidence: 0.94,
        findings: 'Large hyperdense lesion in right frontal lobe measuring 3.2×2.8 cm with surrounding perilesional oedema. Midline shift of 4 mm to the left. No hydrocephalus or herniation noted at this time.',
        detectedIssues: [
            { name: 'Subdural Hematoma', probability: 0.968, location: 'Right frontal', description: 'Hyperdense crescent lesion consistent with acute SDH' },
            { name: 'Perilesional Oedema', probability: 0.87, location: 'Bilateral', description: 'Surrounding low-density zone indicating vasogenic oedema' },
            { name: 'Midline Shift', probability: 0.82, location: 'Central', description: '4 mm leftward deviation of midline structures' },
        ],
        recommendations: [
            'Immediate neurosurgical consultation required',
            'Repeat CT brain in 6 hours to monitor progression',
            'Consider MRI for better soft-tissue characterisation',
            'Monitor ICP closely; maintain head elevation at 30°',
        ],
        processedAt: '25 Apr 2026 09:45', modelVersion: 'CareConnect AI v3.2',
    },
    finalReport: {
        findings: 'Acute subdural haematoma identified on the right. Perilesional oedema present. Midline shift of approximately 4 mm noted. No evidence of herniation. Ventricles appear normal in size and configuration.',
        impression: 'ACUTE RIGHT SUBDURAL HAEMATOMA WITH PERILESIONAL OEDEMA AND MILD MIDLINE SHIFT. Urgent neurosurgical evaluation recommended. Correlate with clinical status.',
        recommendations: ['Urgent neurosurgical consultation', 'ICU admission and close neurological monitoring', 'Repeat imaging in 6 hours'],
        riskLevel: 'high',
        reviewedBy: { firstName: 'Sarah', lastName: 'Wilson', specialization: 'Neuroradiology' },
        reviewedAt: '25 Apr 2026 10:20',
        notes: 'Case escalated as per emergency protocol. Neurosurgery team notified at 10:22.',
    },
    status: 'approved',
};

const Badge = ({ label, color }) => (
    <View style={{ backgroundColor: color + '20', borderRadius: 6, borderWidth: 1, borderColor: color + '50', paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontSize: 10, color, ...FONTS.bold }}>{label}</Text>
    </View>
);

const InfoRow = ({ label, value, color }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.divider }}>
        <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{label}</Text>
        <Text style={{ fontSize: SIZES.sm, color: color || '#fff', ...FONTS.semiBold, flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
);

const Section = ({ title, icon, color = COLORS.primary, children }) => (
    <View style={rv.section}>
        <View style={rv.sectionHead}>
            <View style={[rv.sectionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={14} color={color} />
            </View>
            <Text style={rv.sectionTitle}>{title}</Text>
        </View>
        {children}
    </View>
);

const ReportViewerScreen = ({ navigation, route }) => {
    const scan = route?.params?.scan || MOCK;
    const final = scan.finalReport || MOCK.finalReport;
    const ai = scan.aiReport || MOCK.aiReport;
    const pt = scan.patientId || MOCK.patientId;
    const [pdfModal, setPdfModal] = useState(false);
    const [sharing, setSharing] = useState(false);

    const handleShare = async () => {
        setSharing(true);
        try {
            await Share.share({
                message: `CareConnect Radiology Report\nPatient: ${pt.firstName} ${pt.lastName}\nScan: ${scan.scanType} ${scan.bodyPart}\nDate: ${scan.studyDate}\nImpression: ${final.impression}\nReviewing Radiologist: Dr. ${final.reviewedBy?.firstName} ${final.reviewedBy?.lastName}\nCareConnect AI Platform`,
                title: `Radiology Report — ${scan.scanId}`,
            });
        } catch (e) { }
        setSharing(false);
    };

    const handleDownload = () => setPdfModal(true);

    return (
        <View style={rv.root}>
            {/* Header */}
            <View style={rv.header}>
                <TouchableOpacity style={rv.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={rv.headerTitle}>Radiology Report</Text>
                    <Text style={rv.headerSub}>{scan.scanId} · {scan.status?.toUpperCase()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={rv.hBtn} onPress={handleShare}>
                        <Ionicons name="share-outline" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={rv.hBtn} onPress={handleDownload}>
                        <Ionicons name="download-outline" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={rv.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

                {/* Report banner */}
                <View style={rv.reportBanner}>
                    <View style={rv.bannerGlow} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <View style={rv.bannerIcon}><Ionicons name="document-text" size={22} color={COLORS.primary} /></View>
                        <View>
                            <Text style={rv.bannerTitle}>CareConnect</Text>
                            <Text style={rv.bannerSub}>AI-Powered Radiology Report</Text>
                        </View>
                        <View style={{ marginLeft: 'auto' }}>
                            <Badge label={scan.status?.toUpperCase() || 'APPROVED'} color={COLORS.success} />
                        </View>
                    </View>
                    <View style={rv.bannerMeta}>
                        <View style={rv.metaItem}><Ionicons name="calendar" size={12} color={COLORS.textMuted} /><Text style={rv.metaTxt}>{scan.studyDate}</Text></View>
                        <View style={rv.metaItem}><Ionicons name="scan" size={12} color={COLORS.textMuted} /><Text style={rv.metaTxt}>{scan.scanType} · {scan.bodyPart}</Text></View>
                        <View style={rv.metaItem}><Ionicons name="business" size={12} color={COLORS.textMuted} /><Text style={rv.metaTxt}>{scan.institution}</Text></View>
                    </View>
                </View>

                {/* Patient info */}
                <Section title="Patient Information" icon="person" color={COLORS.secondary}>
                    <InfoRow label="Full Name" value={`${pt.firstName} ${pt.lastName}`} />
                    <InfoRow label="Date of Birth" value={pt.dateOfBirth || 'N/A'} />
                    <InfoRow label="Gender" value={pt.gender || 'N/A'} />
                    <InfoRow label="Blood Group" value={pt.bloodGroup || 'N/A'} />
                    <InfoRow label="Referring Doctor" value={scan.referringDoctor || 'N/A'} />
                    <InfoRow label="PID" value={scan.scanId} color={COLORS.primary} />
                </Section>

                {/* Study info */}
                <Section title="Study Details" icon="scan" color="#AB47BC">
                    <InfoRow label="Modality" value={scan.scanType} color={COLORS.primary} />
                    <InfoRow label="Body Part" value={scan.bodyPart} />
                    <InfoRow label="Study Date" value={scan.studyDate} />
                    <InfoRow label="Study Time" value={scan.studyTime || '—'} />
                    <InfoRow label="Institution" value={scan.institution} />
                    <InfoRow label="Protocol" value={`${scan.scanType} Standard`} />
                </Section>

                {/* AI Analysis */}
                <Section title="AI Analysis" icon="sparkles" color={RC(ai.riskLevel)}>
                    {/* Confidence score */}
                    <View style={rv.confCard}>
                        <View style={rv.confGlow} />
                        <Text style={rv.confPct}>{Math.round(ai.confidence * 100)}%</Text>
                        <Text style={rv.confLbl}>AI Confidence Score</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            <Badge label={`${ai.riskLevel.toUpperCase()} RISK`} color={RC(ai.riskLevel)} />
                            <Badge label={`Model ${ai.modelVersion || 'v3.2'}`} color={COLORS.primary} />
                        </View>
                    </View>

                    <Text style={rv.fieldLbl}>AI Findings</Text>
                    <View style={rv.findingsBox}>
                        <Text style={rv.findingsTxt}>{ai.findings}</Text>
                    </View>

                    <Text style={rv.fieldLbl}>Detected Issues</Text>
                    {ai.detectedIssues.map((iss, i) => (
                        <View key={i} style={rv.issueRow}>
                            <View style={rv.issueHeader}>
                                <View style={[rv.issueDot, { backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.info }]} />
                                <Text style={rv.issueName}>{iss.name}</Text>
                                <Text style={[rv.issueProb, { color: i === 0 ? COLORS.danger : COLORS.warning }]}>{Math.round(iss.probability * 100)}%</Text>
                            </View>
                            <Text style={rv.issueLoc}>{iss.location} · {iss.description}</Text>
                            <View style={rv.probTrack}>
                                <View style={[rv.probFill, { width: `${iss.probability * 100}%`, backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.info }]} />
                            </View>
                        </View>
                    ))}

                    <View style={rv.aiFooter}>
                        <Ionicons name="time" size={11} color={COLORS.textMuted} />
                        <Text style={rv.aiFooterTxt}>Processed: {ai.processedAt}</Text>
                        <Text style={rv.aiFooterTxt}>· {ai.modelVersion}</Text>
                    </View>
                </Section>

                {/* Radiologist Final Report */}
                <Section title="Radiologist Report" icon="medical" color={COLORS.success}>
                    {/* Reviewer card */}
                    <View style={rv.reviewerCard}>
                        <View style={rv.reviewerAvatar}>
                            <Text style={rv.reviewerInitials}>{final.reviewedBy?.firstName?.[0]}{final.reviewedBy?.lastName?.[0]}</Text>
                        </View>
                        <View>
                            <Text style={rv.reviewerName}>Dr. {final.reviewedBy?.firstName} {final.reviewedBy?.lastName}</Text>
                            <Text style={rv.reviewerSpec}>{final.reviewedBy?.specialization || 'Radiologist'}</Text>
                            <Text style={rv.reviewerDate}>Reviewed: {final.reviewedAt}</Text>
                        </View>
                        <Badge label="APPROVED" color={COLORS.success} />
                    </View>

                    <Text style={rv.fieldLbl}>Findings</Text>
                    <View style={rv.findingsBox}><Text style={rv.findingsTxt}>{final.findings}</Text></View>

                    <Text style={rv.fieldLbl}>Impression</Text>
                    <View style={[rv.findingsBox, { borderColor: COLORS.success + '40', backgroundColor: COLORS.success + '08' }]}>
                        <Text style={[rv.findingsTxt, { color: COLORS.success }]}>{final.impression}</Text>
                    </View>

                    <Text style={rv.fieldLbl}>Recommendations</Text>
                    {final.recommendations.map((r, i) => (
                        <View key={i} style={rv.recRow}>
                            <View style={[rv.recNum, { backgroundColor: COLORS.primary }]}><Text style={rv.recNumTxt}>{i + 1}</Text></View>
                            <Text style={rv.recTxt}>{r}</Text>
                        </View>
                    ))}

                    {final.notes && (
                        <>
                            <Text style={rv.fieldLbl}>Radiologist Notes</Text>
                            <View style={[rv.findingsBox, { borderColor: COLORS.warning + '40', backgroundColor: COLORS.warning + '08' }]}>
                                <Text style={rv.findingsTxt}>{final.notes}</Text>
                            </View>
                        </>
                    )}
                </Section>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <TouchableOpacity style={[rv.actionBtn, { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]}
                        onPress={() => navigation.navigate('ScanViewer', { scan })}>
                        <Ionicons name="eye" size={16} color={COLORS.primary} />
                        <Text style={[rv.actionTxt, { color: COLORS.primary }]}>View Scan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[rv.actionBtn, { flex: 1, backgroundColor: COLORS.warning }]}
                        onPress={() => navigation.navigate('Marketplace')}>
                        <Ionicons name="people" size={16} color="#fff" />
                        <Text style={rv.actionTxt}>2nd Opinion</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[rv.actionBtn, { backgroundColor: COLORS.primary, marginTop: 10 }]} onPress={handleDownload}>
                    <Ionicons name="download" size={16} color="#fff" />
                    <Text style={rv.actionTxt}>Download PDF Report</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* PDF preview modal */}
            <Modal visible={pdfModal} transparent animationType="slide">
                <View style={rv.modOverlay}>
                    <View style={rv.modCard}>
                        <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 12 }} onPress={() => setPdfModal(false)}>
                            <Ionicons name="close" size={22} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="document-text" size={28} color={COLORS.primary} />
                            </View>
                            <Text style={{ fontSize: SIZES.xl, color: '#fff', ...FONTS.bold }}>Report Ready</Text>
                            <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted, textAlign: 'center' }}>
                                CareConnect Radiology Report{'\n'}{scan.scanId} · {scan.studyDate}
                            </Text>
                        </View>
                        <View style={{ gap: 8 }}>
                            {[
                                { icon: 'document-text', label: 'Full PDF Report (2 pages)', sub: 'All findings, AI analysis, and approval' },
                                { icon: 'image', label: 'Scan Images', sub: 'DICOM export with annotations' },
                                { icon: 'share', label: 'Share with Doctor', sub: 'Send via WhatsApp, Email or ABDM' },
                            ].map((opt, i) => (
                                <TouchableOpacity key={i} style={rv.dlOpt} onPress={() => { setPdfModal(false); handleShare(); }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name={opt.icon} size={16} color={COLORS.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: SIZES.md, color: '#fff', ...FONTS.semiBold }}>{opt.label}</Text>
                                        <Text style={{ fontSize: SIZES.xs, color: COLORS.textMuted }}>{opt.sub}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const rv = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    headerSub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    hBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    scroll: { flex: 1 },

    reportBanner: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', position: 'relative' },
    bannerGlow: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: COLORS.primary + '15' },
    bannerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    bannerTitle: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    bannerSub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    bannerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaTxt: { fontSize: SIZES.xs, color: COLORS.textMuted },

    section: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    fieldLbl: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, ...FONTS.bold, marginTop: 14, marginBottom: 7 },
    findingsBox: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, borderWidth: 1, borderColor: COLORS.border },
    findingsTxt: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },

    confCard: { backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg, padding: 20, alignItems: 'center', marginBottom: 14, overflow: 'hidden', position: 'relative' },
    confGlow: { position: 'absolute', width: 160, height: 100, borderRadius: 80, backgroundColor: COLORS.primary + '12', top: -20 },
    confPct: { fontSize: 52, color: '#fff', ...FONTS.extraBold, letterSpacing: -1 },
    confLbl: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: -4 },

    issueRow: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    issueHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
    issueDot: { width: 6, height: 6, borderRadius: 3 },
    issueName: { flex: 1, fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold },
    issueProb: { fontSize: SIZES.md, ...FONTS.bold },
    issueLoc: { fontSize: SIZES.xs, color: COLORS.textMuted, marginBottom: 7 },
    probTrack: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
    probFill: { height: '100%', borderRadius: 2 },
    aiFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, opacity: 0.6 },
    aiFooterTxt: { fontSize: SIZES.xs, color: COLORS.textMuted },

    reviewerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.success + '30' },
    reviewerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.success + '20', alignItems: 'center', justifyContent: 'center' },
    reviewerInitials: { fontSize: SIZES.md, color: COLORS.success, ...FONTS.bold },
    reviewerName: { fontSize: SIZES.md, color: '#fff', ...FONTS.bold, marginBottom: 2 },
    reviewerSpec: { fontSize: SIZES.xs, color: COLORS.textMuted },
    reviewerDate: { fontSize: SIZES.xs, color: COLORS.textMuted },

    recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    recNum: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    recNumTxt: { fontSize: 10, color: '#fff', ...FONTS.bold },
    recTxt: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 19 },

    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: SIZES.radiusLg, paddingVertical: 14 },
    actionTxt: { fontSize: SIZES.md, color: '#fff', ...FONTS.bold },

    modOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 },
    dlOpt: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg, padding: 14, borderWidth: 1, borderColor: COLORS.border },
});

export default ReportViewerScreen;
