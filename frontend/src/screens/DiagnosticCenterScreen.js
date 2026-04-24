import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const PRIORITIES = [
    { id: 'normal', label: 'Routine', color: COLORS.success, icon: 'checkmark-circle' },
    { id: 'urgent', label: 'Urgent', color: COLORS.warning, icon: 'alert-circle' },
    { id: 'emergency', label: 'Emergency', color: COLORS.danger, icon: 'flash' },
];
const SCAN_TYPES = ['X-Ray', 'CT', 'MRI', 'Ultrasound', 'PET-CT', 'Mammography'];
const BODY_PARTS = ['Head', 'Chest', 'Abdomen', 'Spine', 'Pelvis', 'Extremity', 'Cardiac', 'Whole Body'];
const CONTRAST = ['No Contrast', 'With Contrast', 'Both Phases'];
const CLINICAL_TEMPLATES = [
    'Patient presents with acute chest pain and shortness of breath.',
    'Post-operative scan to assess surgical site and healing.',
    'Screening examination. No acute symptoms.',
    'Follow-up for previously diagnosed malignancy.',
    'Trauma — motor vehicle accident.',
    'Suspected pulmonary embolism, elevated D-dimer.',
];

const Step = ({ n, label, active, done }) => (
    <View style={{ alignItems: 'center', gap: 4 }}>
        <View style={[dc.stepCircle, active && dc.stepActive, done && dc.stepDone]}>
            {done
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={[dc.stepN, (active || done) && { color: '#fff' }]}>{n}</Text>}
        </View>
        <Text style={[dc.stepLbl, active && { color: COLORS.primary }]}>{label}</Text>
    </View>
);

const DiagnosticCenterScreen = ({ navigation }) => {
    const [step, setStep] = useState(0); // 0=patient 1=scan 2=history 3=submit
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const [templateModal, setTemplateModal] = useState(false);

    // Form state
    const [pid, setPid] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [phone, setPhone] = useState('');
    const [abha, setAbha] = useState('');

    const [scanType, setScanType] = useState('CT');
    const [bodyPart, setBodyPart] = useState('Chest');
    const [contrast, setContrast] = useState('No Contrast');
    const [priority, setPriority] = useState('normal');
    const [slices, setSlices] = useState('');
    const [kv, setKv] = useState('');
    const [mas, setMas] = useState('');

    const [clinicalHistory, setClinicalHistory] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [allergies, setAllergies] = useState('');
    const [prevSurgery, setPrevSurgery] = useState('');
    const [referringDoc, setReferringDoc] = useState('');
    const [remarks, setRemarks] = useState('');

    const simulateUpload = () => {
        setUploading(true);
        setTimeout(() => { setUploading(false); setUploaded(true); }, 2200);
    };

    const handleSubmit = () => {
        setProcessing(true);
        setTimeout(() => { setProcessing(false); setDone(true); }, 3000);
    };

    if (done) {
        const caseId = `CC-${Date.now().toString().slice(-6)}`;
        return (
            <View style={dc.doneContainer}>
                <View style={dc.doneCard}>
                    <View style={dc.doneGlow} />
                    <View style={dc.doneIcon}><Ionicons name="checkmark-circle" size={52} color={COLORS.success} /></View>
                    <Text style={dc.doneTitle}>Case Submitted!</Text>
                    <Text style={dc.doneSub}>AI analysis initiated. Radiologist will be assigned shortly.</Text>
                    <View style={dc.doneInfoBox}>
                        <InfoRow label="Case ID" value={caseId} valueColor={COLORS.primary} />
                        <InfoRow label="Patient" value={`${firstName || 'John'} ${lastName || 'Doe'}`} />
                        <InfoRow label="Scan" value={`${scanType} · ${bodyPart}`} />
                        <InfoRow label="Priority" value={priority.toUpperCase()} valueColor={PRIORITIES.find(p => p.id === priority)?.color} />
                        <InfoRow label="AI Status" value="Processing…" valueColor={COLORS.warning} />
                        <InfoRow label="Est. TAT" value={priority === 'emergency' ? '< 30 min' : priority === 'urgent' ? '1–2 hrs' : '4–6 hrs'} />
                    </View>
                    <TouchableOpacity style={dc.doneBtn} onPress={() => setDone(false)}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={dc.doneBtnTxt}>New Upload</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[dc.doneBtn, { backgroundColor: COLORS.card, marginTop: 8 }]}
                        onPress={() => navigation.navigate('Worklist')}>
                        <Ionicons name="list" size={18} color={COLORS.primary} />
                        <Text style={[dc.doneBtnTxt, { color: COLORS.primary }]}>View Worklist</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const STEPS = ['Patient', 'Scan', 'History', 'Submit'];

    return (
        <View style={dc.root}>
            {/* Header */}
            <View style={dc.header}>
                <TouchableOpacity style={dc.back} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={dc.headerTitle}>Diagnostic Upload</Text>
                    <Text style={dc.headerSub}>Apollo Diagnostics, Hyderabad</Text>
                </View>
                <View style={[dc.priBadge, { backgroundColor: PRIORITIES.find(p => p.id === priority)?.color + '20', borderColor: PRIORITIES.find(p => p.id === priority)?.color + '60' }]}>
                    <Ionicons name={PRIORITIES.find(p => p.id === priority)?.icon} size={12} color={PRIORITIES.find(p => p.id === priority)?.color} />
                    <Text style={[dc.priBadgeTxt, { color: PRIORITIES.find(p => p.id === priority)?.color }]}>{priority.toUpperCase()}</Text>
                </View>
            </View>

            {/* Step indicator */}
            <View style={dc.stepRow}>
                {STEPS.map((s, i) => (
                    <React.Fragment key={i}>
                        <Step n={i + 1} label={s} active={step === i} done={step > i} />
                        {i < STEPS.length - 1 && <View style={[dc.stepLine, step > i && { backgroundColor: COLORS.primary }]} />}
                    </React.Fragment>
                ))}
            </View>

            <ScrollView style={dc.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

                {/* ── STEP 0: Patient Registration ── */}
                {step === 0 && (
                    <View style={dc.card}>
                        <SectionHead icon="person" title="Patient Registration" color={COLORS.secondary} />
                        <InlineRow>
                            <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="First" flex={1} />
                            <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Last" flex={1} />
                        </InlineRow>
                        <InlineRow>
                            <Field label="Age" value={age} onChange={setAge} placeholder="yrs" kb="numeric" flex={0.5} />
                            <ChipField label="Gender" options={['Male', 'Female', 'Other']} selected={gender} onSelect={setGender} flex={1} />
                        </InlineRow>
                        <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91-XXXXXXXXXX" kb="phone-pad" />
                        <Field label="Patient ID (PID)" value={pid} onChange={setPid} placeholder="Auto-generated if blank" />
                        <Field label="ABHA Number (optional)" value={abha} onChange={setAbha} placeholder="14-digit ABHA ID" kb="numeric" />
                        <View style={dc.abhaHint}>
                            <Ionicons name="shield-checkmark" size={13} color={COLORS.primary} />
                            <Text style={dc.abhaHintTxt}>Linking ABHA enables ABDM-compliant consent-based sharing</Text>
                        </View>
                    </View>
                )}

                {/* ── STEP 1: Scan Details ── */}
                {step === 1 && (
                    <View style={dc.card}>
                        <SectionHead icon="scan" title="Scan & Study Details" color="#AB47BC" />

                        <Text style={dc.fieldLabel}>Scan Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {SCAN_TYPES.map(t => (
                                    <TouchableOpacity key={t} style={[dc.chip, scanType === t && dc.chipActive]} onPress={() => setScanType(t)}>
                                        <Text style={[dc.chipTxt, scanType === t && { color: '#fff' }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={dc.fieldLabel}>Body Part / Region</Text>
                        <View style={dc.chipGrid}>
                            {BODY_PARTS.map(b => (
                                <TouchableOpacity key={b} style={[dc.chip, bodyPart === b && dc.chipActive]} onPress={() => setBodyPart(b)}>
                                    <Text style={[dc.chipTxt, bodyPart === b && { color: '#fff' }]}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={dc.fieldLabel}>Contrast</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                            {CONTRAST.map(c => (
                                <TouchableOpacity key={c} style={[dc.chip, contrast === c && dc.chipActive, { flex: 1, justifyContent: 'center' }]} onPress={() => setContrast(c)}>
                                    <Text style={[dc.chipTxt, contrast === c && { color: '#fff' }, { textAlign: 'center' }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={dc.fieldLabel}>Technical Parameters (optional)</Text>
                        <InlineRow>
                            <Field label="Slices" value={slices} onChange={setSlices} placeholder="e.g. 64" kb="numeric" flex={1} />
                            <Field label="kV" value={kv} onChange={setKv} placeholder="120" kb="numeric" flex={1} />
                            <Field label="mAs" value={mas} onChange={setMas} placeholder="200" kb="numeric" flex={1} />
                        </InlineRow>

                        <Text style={dc.fieldLabel}>Case Priority</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {PRIORITIES.map(p => (
                                <TouchableOpacity key={p.id} style={[dc.priBtnBase, { borderColor: p.color + '50', flex: 1 }, priority === p.id && { backgroundColor: p.color + '20', borderColor: p.color }]}
                                    onPress={() => setPriority(p.id)}>
                                    <Ionicons name={p.icon} size={18} color={p.color} />
                                    <Text style={[dc.priBtnTxt, { color: p.color }]}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <SectionHead icon="cloud-upload" title="DICOM Upload" color={COLORS.primary} style={{ marginTop: 20 }} />
                        <TouchableOpacity style={[dc.uploadZone, uploaded && dc.uploadDone]} onPress={!uploaded ? simulateUpload : undefined}>
                            {uploading
                                ? <><ActivityIndicator color={COLORS.primary} /><Text style={dc.uploadTxt}>Uploading…</Text></>
                                : uploaded
                                    ? <><Ionicons name="checkmark-circle" size={32} color={COLORS.success} /><Text style={[dc.uploadTxt, { color: COLORS.success }]}>DICOM Uploaded ✓</Text><Text style={dc.uploadSub}>scan_001.dcm · 48.2 MB</Text></>
                                    : <><Ionicons name="cloud-upload" size={32} color={COLORS.primary} /><Text style={dc.uploadTxt}>Tap to upload DICOM / JPEG</Text><Text style={dc.uploadSub}>Supports .dcm · .jpg · .png · .zip</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── STEP 2: Clinical History ── */}
                {step === 2 && (
                    <View style={dc.card}>
                        <SectionHead icon="document-text" title="Clinical History" color={COLORS.warning} />
                        <View style={dc.templateRow}>
                            <Text style={dc.fieldLabel}>Clinical History *</Text>
                            <TouchableOpacity onPress={() => setTemplateModal(true)} style={dc.templateBtn}>
                                <Ionicons name="list" size={13} color={COLORS.primary} />
                                <Text style={dc.templateBtnTxt}>Templates</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput style={[dc.textArea, { height: 100 }]} multiline value={clinicalHistory} onChangeText={setClinicalHistory}
                            placeholder="Describe presenting complaint and clinical context…" placeholderTextColor={COLORS.textMuted} />

                        <Field label="Current Symptoms" value={symptoms} onChange={setSymptoms} placeholder="e.g. Chest pain, dyspnoea, cough" />
                        <Field label="Known Allergies" value={allergies} onChange={setAllergies} placeholder="Drug, contrast, latex allergies" />
                        <Field label="Previous Surgery / Procedures" value={prevSurgery} onChange={setPrevSurgery} placeholder="e.g. CABG 2022, appendectomy 2018" />
                        <Field label="Referring Physician" value={referringDoc} onChange={setReferringDoc} placeholder="Dr. Name, Specialisation" />

                        <Text style={dc.fieldLabel}>Additional Remarks</Text>
                        <TextInput style={[dc.textArea, { height: 70 }]} multiline value={remarks} onChangeText={setRemarks}
                            placeholder="Any special instructions for radiologist…" placeholderTextColor={COLORS.textMuted} />

                        <View style={dc.mandatoryNote}>
                            <Ionicons name="information-circle" size={14} color={COLORS.primary} />
                            <Text style={dc.mandatoryTxt}>Clinical history is mandatory for AI-assisted analysis and improves diagnostic accuracy.</Text>
                        </View>
                    </View>
                )}

                {/* ── STEP 3: Review & Submit ── */}
                {step === 3 && (
                    <View style={dc.card}>
                        <SectionHead icon="checkmark-done" title="Review & Submit" color={COLORS.success} />
                        <View style={dc.reviewBox}>
                            <Text style={dc.reviewSecTitle}>Patient</Text>
                            <InfoRow label="Name" value={`${firstName || 'John'} ${lastName || 'Doe'}`} />
                            <InfoRow label="Age / Gender" value={`${age || '—'} / ${gender}`} />
                            <InfoRow label="Phone" value={phone || '—'} />
                        </View>
                        <View style={dc.reviewBox}>
                            <Text style={dc.reviewSecTitle}>Study</Text>
                            <InfoRow label="Modality" value={`${scanType} · ${bodyPart}`} />
                            <InfoRow label="Contrast" value={contrast} />
                            <InfoRow label="Priority" value={priority.toUpperCase()} valueColor={PRIORITIES.find(p => p.id === priority)?.color} />
                            <InfoRow label="DICOM" value={uploaded ? 'Uploaded ✓' : 'Not uploaded'} valueColor={uploaded ? COLORS.success : COLORS.danger} />
                        </View>
                        <View style={dc.reviewBox}>
                            <Text style={dc.reviewSecTitle}>Clinical</Text>
                            <InfoRow label="History" value={clinicalHistory ? clinicalHistory.slice(0, 60) + '…' : 'Not provided'} valueColor={clinicalHistory ? '#fff' : COLORS.danger} />
                            <InfoRow label="Referring Dr." value={referringDoc || '—'} />
                        </View>

                        {/* AI pre-analysis notice */}
                        <View style={dc.aiNotice}>
                            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={dc.aiNoticeTitle}>AI Pre-Analysis will run automatically</Text>
                                <Text style={dc.aiNoticeSub}>CareConnect AI v3 will analyse your scan and generate a preliminary report before radiologist review.</Text>
                            </View>
                        </View>
                        {!clinicalHistory && (
                            <View style={[dc.aiNotice, { borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '0a' }]}>
                                <Ionicons name="warning" size={16} color={COLORS.danger} />
                                <Text style={[dc.aiNoticeSub, { color: COLORS.danger, flex: 1 }]}>Clinical history is missing — AI accuracy may be reduced.</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Navigation buttons */}
            <View style={dc.footer}>
                {step > 0 && (
                    <TouchableOpacity style={dc.prevBtn} onPress={() => setStep(s => s - 1)}>
                        <Ionicons name="chevron-back" size={16} color={COLORS.textMuted} />
                        <Text style={dc.prevBtnTxt}>Back</Text>
                    </TouchableOpacity>
                )}
                {step < 3
                    ? <TouchableOpacity style={dc.nextBtn} onPress={() => setStep(s => s + 1)}>
                        <Text style={dc.nextBtnTxt}>{step === 1 && !uploaded ? 'Skip Upload →' : 'Next →'}</Text>
                    </TouchableOpacity>
                    : <TouchableOpacity style={[dc.nextBtn, processing && { opacity: 0.7 }]} onPress={handleSubmit} disabled={processing}>
                        {processing
                            ? <><ActivityIndicator color="#fff" size="small" /><Text style={dc.nextBtnTxt}> Submitting…</Text></>
                            : <><Ionicons name="send" size={16} color="#fff" /><Text style={dc.nextBtnTxt}> Submit Case</Text></>}
                    </TouchableOpacity>
                }
            </View>

            {/* Template modal */}
            <Modal visible={templateModal} transparent animationType="slide">
                <View style={dc.modOverlay}>
                    <View style={dc.modCard}>
                        <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => setTemplateModal(false)}>
                            <Ionicons name="close" size={22} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        <Text style={dc.modTitle}>Clinical Templates</Text>
                        {CLINICAL_TEMPLATES.map((t, i) => (
                            <TouchableOpacity key={i} style={dc.templateItem} onPress={() => { setClinicalHistory(t); setTemplateModal(false); }}>
                                <Ionicons name="document-text" size={14} color={COLORS.primary} />
                                <Text style={dc.templateItemTxt}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Reusable sub-components ───────────────────────────────
const SectionHead = ({ icon, title, color }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={15} color={color} />
        </View>
        <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.bold }}>{title}</Text>
    </View>
);

const Field = ({ label, value, onChange, placeholder, kb, flex }) => (
    <View style={[{ marginBottom: 12 }, flex !== undefined && { flex }]}>
        <Text style={dc.fieldLabel}>{label}</Text>
        <TextInput style={dc.fieldInput} value={value} onChangeText={onChange}
            placeholder={placeholder} placeholderTextColor={COLORS.textMuted}
            keyboardType={kb || 'default'} />
    </View>
);

const ChipField = ({ label, options, selected, onSelect, flex }) => (
    <View style={[{ marginBottom: 12 }, flex !== undefined && { flex }]}>
        <Text style={dc.fieldLabel}>{label}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
            {options.map(o => (
                <TouchableOpacity key={o} style={[dc.chip, selected === o && dc.chipActive, { flex: 1, justifyContent: 'center' }]} onPress={() => onSelect(o)}>
                    <Text style={[dc.chipTxt, selected === o && { color: '#fff' }, { textAlign: 'center', fontSize: 10 }]}>{o}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const InlineRow = ({ children }) => <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;

const InfoRow = ({ label, value, valueColor }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider }}>
        <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{label}</Text>
        <Text style={{ fontSize: SIZES.sm, color: valueColor || '#fff', ...FONTS.semiBold, flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
);

const dc = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    back: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    headerSub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    priBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
    priBadgeTxt: { fontSize: 10, ...FONTS.bold },
    stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    stepActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
    stepDone: { borderColor: COLORS.success, backgroundColor: COLORS.success },
    stepN: { fontSize: 12, color: COLORS.textMuted, ...FONTS.bold },
    stepLbl: { fontSize: 9, color: COLORS.textMuted, ...FONTS.semiBold },
    stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4, marginBottom: 14 },
    scroll: { flex: 1 },
    card: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    fieldLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
    fieldInput: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: SIZES.md, color: '#fff', marginBottom: 12 },
    textArea: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: SIZES.md, color: '#fff', textAlignVertical: 'top', marginBottom: 14 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipTxt: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    priBtnBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: SIZES.radius, borderWidth: 1.5, backgroundColor: COLORS.background },
    priBtnTxt: { fontSize: SIZES.sm, ...FONTS.bold },
    uploadZone: { borderWidth: 2, borderColor: COLORS.primary + '50', borderStyle: 'dashed', borderRadius: SIZES.radiusLg, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primaryGlow, marginTop: 8 },
    uploadDone: { borderColor: COLORS.success + '50', backgroundColor: COLORS.success + '0a', borderStyle: 'solid' },
    uploadTxt: { fontSize: SIZES.base, color: '#fff', ...FONTS.semiBold },
    uploadSub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    templateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    templateBtnTxt: { fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.semiBold },
    mandatoryNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.primaryGlow, borderRadius: SIZES.radius, padding: 12, marginTop: 8 },
    mandatoryTxt: { flex: 1, fontSize: SIZES.xs, color: COLORS.textSecondary, lineHeight: 17 },
    reviewBox: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
    reviewSecTitle: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, ...FONTS.bold, marginBottom: 8 },
    aiNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.primaryGlow, borderRadius: SIZES.radius, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.primary + '30' },
    aiNoticeTitle: { fontSize: SIZES.sm, color: '#fff', ...FONTS.bold, marginBottom: 2 },
    aiNoticeSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, lineHeight: 17 },
    abhaHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 4 },
    abhaHintTxt: { fontSize: SIZES.xs, color: COLORS.textMuted },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 36, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
    prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingVertical: 14, borderRadius: SIZES.radius, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
    prevBtnTxt: { fontSize: SIZES.md, color: COLORS.textMuted, ...FONTS.semiBold },
    nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: SIZES.radius, backgroundColor: COLORS.primary },
    nextBtnTxt: { fontSize: SIZES.md, color: '#fff', ...FONTS.bold },
    doneContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
    doneCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusXl, padding: 28, width: '100%', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', position: 'relative', alignItems: 'center' },
    doneGlow: { position: 'absolute', top: -40, left: '50%', width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.success + '15' },
    doneIcon: { marginBottom: 14 },
    doneTitle: { fontSize: SIZES.xxl + 4, color: '#fff', ...FONTS.bold, marginBottom: 6 },
    doneSub: { fontSize: SIZES.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
    doneInfoBox: { width: '100%', backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
    doneBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, paddingVertical: 14 },
    doneBtnTxt: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    modOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 },
    modTitle: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold, marginBottom: 16 },
    templateItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 14, marginBottom: 8 },
    templateItemTxt: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 19 },
});

export default DiagnosticCenterScreen;
