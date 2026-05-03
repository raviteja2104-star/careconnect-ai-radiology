import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { radiologyAPI } from '../services/api';

// ─── Mock data (fallback when API unavailable) ────────────────────────────────
const MOCK_QUEUE = [
  { id: 'TR-001', patientName: 'Ravi Teja', age: 31, gender: 'M', scanType: 'CT', bodyPart: 'Head', priority: 'critical', status: 'pending', aiRisk: 'high', aiConf: 96, finding: 'Subdural Hematoma', centre: 'Apollo Diagnostics', receivedAt: '5 min ago', tat: '<30 min', fee: 850 },
  { id: 'TR-002', patientName: 'Priya Sharma', age: 45, gender: 'F', scanType: 'MRI', bodyPart: 'Spine', priority: 'urgent', status: 'assigned', aiRisk: 'medium', aiConf: 82, finding: 'Disc Herniation L4-L5', centre: 'Yashoda Hospitals', receivedAt: '22 min ago', tat: '2 hrs', fee: 600 },
  { id: 'TR-003', patientName: 'Amit Kumar', age: 58, gender: 'M', scanType: 'X-Ray', bodyPart: 'Chest', priority: 'routine', status: 'pending', aiRisk: 'low', aiConf: 78, finding: 'Normal Study', centre: 'KIMS', receivedAt: '1 hr ago', tat: '4 hrs', fee: 300 },
  { id: 'TR-004', patientName: 'Lakshmi Devi', age: 62, gender: 'F', scanType: 'CT', bodyPart: 'Abdomen', priority: 'urgent', status: 'reported', aiRisk: 'high', aiConf: 91, finding: 'Hepatic Mass', centre: 'Care Hospital', receivedAt: '2 hrs ago', tat: 'Done', fee: 750 },
];

const PRIORITY_COLOR = { critical: '#D32F2F', urgent: COLORS.warning, routine: COLORS.success };
const RISK_COLOR = (r) => ({ high: COLORS.danger, medium: COLORS.warning, low: COLORS.success }[r] || COLORS.textMuted);
const STATUS_MAP = {
  pending:  { label: 'Pending',  color: COLORS.warning },
  assigned: { label: 'Assigned', color: COLORS.primary },
  reported: { label: 'Reported', color: COLORS.success },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => (
  <View style={[s.badge, { backgroundColor: (PRIORITY_COLOR[priority] || COLORS.border) + '25', borderColor: (PRIORITY_COLOR[priority] || COLORS.border) + '60' }]}>
    <Text style={[s.badgeTxt, { color: PRIORITY_COLOR[priority] || COLORS.textMuted }]}>{priority?.toUpperCase()}</Text>
  </View>
);

const StatusChip = ({ status }) => {
  const m = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <View style={[s.chip, { backgroundColor: m.color + '20', borderColor: m.color + '50' }]}>
      <Text style={[s.chipTxt, { color: m.color }]}>{m.label}</Text>
    </View>
  );
};

const CaseRow = ({ item, onPress }) => (
  <TouchableOpacity style={s.card} onPress={() => onPress(item)} activeOpacity={0.8}>
    <View style={[s.stripe, { backgroundColor: PRIORITY_COLOR[item.priority] || COLORS.border }]} />
    <View style={{ flex: 1 }}>
      <View style={s.row}>
        <Text style={s.name}>{item.patientName}</Text>
        <StatusChip status={item.status} />
      </View>
      <View style={s.meta}>
        <Ionicons name="scan" size={10} color={COLORS.textMuted} />
        <Text style={s.metaTxt}>{item.scanType} · {item.bodyPart}</Text>
        <Ionicons name="business" size={10} color={COLORS.textMuted} />
        <Text style={s.metaTxt}>{item.centre}</Text>
        <PriorityBadge priority={item.priority} />
      </View>
      <View style={s.aiBanner}>
        <Ionicons name="sparkles" size={11} color={RISK_COLOR(item.aiRisk)} />
        <Text style={[s.aiTxt, { color: RISK_COLOR(item.aiRisk) }]}>{item.finding}</Text>
        <Text style={s.confTxt}>AI {item.aiConf}%</Text>
      </View>
      <View style={s.footer}>
        <Ionicons name="time" size={10} color={COLORS.textMuted} />
        <Text style={s.footTxt}>{item.receivedAt}</Text>
        <Ionicons name="hourglass" size={10} color={COLORS.textMuted} />
        <Text style={s.footTxt}>TAT: {item.tat}</Text>
        <Text style={[s.fee, { color: COLORS.primary }]}>₹{item.fee}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TeleradiologyScreen = ({ navigation }) => {
  const [tab, setTab] = useState('Queue');
  const [cases, setCases] = useState(MOCK_QUEUE);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reportText, setReportText] = useState('');
  const [impression, setImpression] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [earnings] = useState({ today: 3750, month: 42600, pending: 1650 });

  useEffect(() => {
    fetchCases();
  }, [tab]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await radiologyAPI.listScans({ status: tab === 'Queue' ? 'pending' : tab === 'Completed' ? 'completed' : undefined });
      if (res?.data?.length) setCases(res.data);
    } catch {
      // silently use mock data
    } finally {
      setLoading(false);
    }
  };

  const openCase = (item) => { setSelected(item); setReportText(''); setImpression(''); setShowDetail(true); };

  const acceptCase = async () => {
    try {
      await radiologyAPI.assignRadiologist(selected.id, { radiologistId: 'demo-radiologist-1' });
    } catch { /* demo fallback */ }
    setCases(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'assigned' } : c));
    setSelected(prev => ({ ...prev, status: 'assigned' }));
    Alert.alert('Accepted', `Case ${selected.id} accepted. TAT: ${selected.tat}`);
  };

  const submitReport = async () => {
    if (!reportText.trim()) { Alert.alert('Required', 'Please enter findings before submitting.'); return; }
    setSubmitting(true);
    try {
      await radiologyAPI.submitReport({ scanId: selected.id, findings: reportText, impression, radiologistId: 'demo-radiologist-1' });
    } catch { /* demo fallback */ }
    setCases(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'reported' } : c));
    setSubmitting(false);
    setShowDetail(false);
    Alert.alert('✅ Report Submitted', `Report for ${selected.patientName} has been submitted and billed.`);
  };

  const escalate = () => {
    Alert.alert('Escalate Case', 'Send this case to a senior specialist?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Escalate', style: 'destructive', onPress: () => { setShowDetail(false); Alert.alert('Escalated', 'Case forwarded to senior radiologist.'); } },
    ]);
  };

  const autoFill = () => {
    setReportText(`${selected?.scanType} of ${selected?.bodyPart}:\n\nTechnique: Standard protocol without contrast.\n\nFindings:\n• AI detected: ${selected?.finding}\n• Confidence: ${selected?.aiConf}%\n• No acute fractures noted.\n• Soft tissues appear unremarkable.\n\nImpression:`);
    setImpression(selected?.aiRisk === 'high' ? 'Significant abnormality noted. Immediate clinical correlation advised.' : 'No significant acute abnormality detected.');
  };

  const filtered = cases.filter(c => {
    const byTab = tab === 'Queue' ? c.status !== 'reported' : tab === 'Completed' ? c.status === 'reported' : true;
    const bySearch = !search || c.patientName.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search);
    return byTab && bySearch;
  });

  const stats = { total: cases.length, pending: cases.filter(c => c.status === 'pending').length, done: cases.filter(c => c.status === 'reported').length };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Teleradiology</Text>
          <Text style={s.sub}>AI-assisted · Remote reporting</Text>
        </View>
        <View style={s.earningBadge}>
          <Ionicons name="wallet" size={12} color={COLORS.primary} />
          <Text style={s.earningTxt}>₹{earnings.today.toLocaleString()}</Text>
        </View>
      </View>

      {/* KPIs */}
      <View style={s.kpiRow}>
        {[
          { label: 'Total', val: stats.total, color: COLORS.primary },
          { label: 'Pending', val: stats.pending, color: COLORS.warning },
          { label: 'Reported', val: stats.done, color: COLORS.success },
          { label: 'Earnings', val: `₹${earnings.month.toLocaleString()}`, color: '#AB47BC' },
        ].map((k, i) => (
          <View key={i} style={[s.kpi, { borderColor: k.color + '30' }]}>
            <Text style={[s.kpiVal, { color: k.color }]}>{k.val}</Text>
            <Text style={s.kpiLbl}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {['Queue', 'Completed', 'Earnings'].map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab !== 'Earnings' ? (
        <>
          {/* Search */}
          <View style={s.searchRow}>
            <Ionicons name="search" size={14} color={COLORS.textMuted} />
            <TextInput style={s.searchInput} placeholder="Search patient, case ID…" placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
          </View>

          {/* Case List */}
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
              {filtered.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                  <Ionicons name="document" size={40} color={COLORS.textMuted} />
                  <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>No cases found</Text>
                </View>
              )}
              {filtered.map(c => <CaseRow key={c.id} item={c} onPress={openCase} />)}
            </ScrollView>
          )}
        </>
      ) : (
        /* Earnings Tab */
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 100 }}>
          {[
            { label: "Today's Earnings", val: `₹${earnings.today.toLocaleString()}`, icon: 'today', color: COLORS.primary },
            { label: 'This Month', val: `₹${earnings.month.toLocaleString()}`, icon: 'calendar', color: '#AB47BC' },
            { label: 'Pending Payout', val: `₹${earnings.pending.toLocaleString()}`, icon: 'hourglass', color: COLORS.warning },
          ].map((e, i) => (
            <View key={i} style={[s.earningCard, { borderLeftColor: e.color }]}>
              <View style={[s.earningIcon, { backgroundColor: e.color + '20' }]}>
                <Ionicons name={e.icon} size={22} color={e.color} />
              </View>
              <View>
                <Text style={s.earningLabel}>{e.label}</Text>
                <Text style={[s.earningVal, { color: e.color }]}>{e.val}</Text>
              </View>
            </View>
          ))}
          <View style={s.txCard}>
            <Text style={s.txTitle}>Recent Transactions</Text>
            {MOCK_QUEUE.slice(0, 3).map((c, i) => (
              <View key={i} style={s.txRow}>
                <View>
                  <Text style={s.txName}>{c.patientName}</Text>
                  <Text style={s.txMeta}>{c.scanType} · {c.centre}</Text>
                </View>
                <Text style={[s.txAmt, { color: COLORS.success }]}>+₹{c.fee}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Case Detail Modal */}
      <Modal visible={showDetail} transparent animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={s.sheetHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sheetName}>{selected.patientName}</Text>
                    <Text style={s.sheetSub}>{selected.id} · {selected.scanType} · {selected.bodyPart}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetail(false)}>
                    <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* AI Box */}
                <View style={[s.aiBox, { borderColor: RISK_COLOR(selected.aiRisk) + '40' }]}>
                  <View style={s.row}>
                    <Ionicons name="sparkles" size={14} color={RISK_COLOR(selected.aiRisk)} />
                    <Text style={[s.aiTitle, { color: RISK_COLOR(selected.aiRisk) }]}>AI Analysis</Text>
                    <Text style={[s.aiConf, { color: RISK_COLOR(selected.aiRisk) }]}>{selected.aiConf}% confidence</Text>
                  </View>
                  <Text style={s.aiFinding}>{selected.finding}</Text>
                  <View style={s.row}>
                    <PriorityBadge priority={selected.priority} />
                    <Text style={s.tatTxt}>TAT: {selected.tat}</Text>
                    <Text style={s.feeTxt}>Fee: ₹{selected.fee}</Text>
                  </View>
                </View>

                {/* Actions if pending */}
                {selected.status === 'pending' && (
                  <TouchableOpacity style={s.acceptBtn} onPress={acceptCase}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={s.acceptTxt}>Accept Case</Text>
                  </TouchableOpacity>
                )}

                {/* Report Editor */}
                {(selected.status === 'assigned' || selected.status === 'pending') && (
                  <>
                    <View style={s.sectionHeader}>
                      <Text style={s.sectionTitle}>Radiology Report</Text>
                      <TouchableOpacity style={s.autoFillBtn} onPress={autoFill}>
                        <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                        <Text style={s.autoFillTxt}>AI Auto-Fill</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={s.reportInput}
                      multiline
                      numberOfLines={8}
                      placeholder="Enter findings here…"
                      placeholderTextColor={COLORS.textMuted}
                      value={reportText}
                      onChangeText={setReportText}
                    />
                    <Text style={s.sectionTitle}>Impression</Text>
                    <TextInput
                      style={[s.reportInput, { minHeight: 70 }]}
                      multiline
                      placeholder="Clinical impression…"
                      placeholderTextColor={COLORS.textMuted}
                      value={impression}
                      onChangeText={setImpression}
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <TouchableOpacity style={[s.actionBtn, { flex: 1, borderColor: COLORS.danger + '50' }]} onPress={escalate}>
                        <Ionicons name="warning" size={16} color={COLORS.danger} />
                        <Text style={[s.actionTxt, { color: COLORS.danger }]}>Escalate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.submitBtn, { flex: 2 }]} onPress={submitReport} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" size="small" /> : <>
                          <Ionicons name="cloud-upload" size={16} color="#fff" />
                          <Text style={s.submitTxt}>Submit Report</Text>
                        </>}
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {selected.status === 'reported' && (
                  <View style={s.doneBanner}>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                    <Text style={[s.sectionTitle, { color: COLORS.success }]}>Report Submitted</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
  sub: { fontSize: SIZES.xs, color: COLORS.textMuted },
  earningBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryGlow, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  earningTxt: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.bold },
  kpiRow: { flexDirection: 'row', gap: 8, padding: 14 },
  kpi: { flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 10, alignItems: 'center', borderWidth: 1 },
  kpiVal: { fontSize: SIZES.lg, ...FONTS.bold },
  kpiLbl: { fontSize: 8, color: COLORS.textMuted, ...FONTS.semiBold, textTransform: 'uppercase' },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 4, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: SIZES.radius, alignItems: 'center' },
  tabBtnOn: { backgroundColor: COLORS.primary },
  tabTxt: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold },
  tabTxtOn: { color: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  searchInput: { flex: 1, fontSize: SIZES.md, color: '#fff' },
  card: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 12, overflow: 'hidden' },
  stripe: { width: 4, borderRadius: 2, marginRight: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaTxt: { fontSize: 10, color: COLORS.textMuted },
  aiBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  aiTxt: { flex: 1, fontSize: SIZES.sm, ...FONTS.semiBold },
  confTxt: { fontSize: 9, color: COLORS.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  footTxt: { fontSize: 9, color: COLORS.textMuted },
  fee: { marginLeft: 'auto', fontSize: SIZES.sm, ...FONTS.bold },
  badge: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt: { fontSize: 8, ...FONTS.bold },
  chip: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  chipTxt: { fontSize: 9, ...FONTS.bold },
  earningCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4 },
  earningIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  earningLabel: { fontSize: SIZES.sm, color: COLORS.textMuted, marginBottom: 2 },
  earningVal: { fontSize: SIZES.xxl, ...FONTS.bold },
  txCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  txTitle: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold, marginBottom: 14 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  txName: { fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold },
  txMeta: { fontSize: SIZES.xs, color: COLORS.textMuted },
  txAmt: { fontSize: SIZES.base, ...FONTS.bold },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, maxHeight: '92%' },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  sheetName: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
  sheetSub: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
  aiBox: { backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg, padding: 14, borderWidth: 1, marginBottom: 14, gap: 6 },
  aiTitle: { fontSize: SIZES.sm, ...FONTS.bold, flex: 1 },
  aiConf: { fontSize: SIZES.sm, ...FONTS.bold },
  aiFinding: { fontSize: SIZES.base, color: '#fff', ...FONTS.semiBold },
  tatTxt: { fontSize: SIZES.xs, color: COLORS.textMuted, marginLeft: 6 },
  feeTxt: { fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.bold, marginLeft: 'auto' },
  acceptBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  acceptTxt: { color: '#fff', fontSize: SIZES.md, ...FONTS.bold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  sectionTitle: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
  autoFillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  autoFillTxt: { fontSize: SIZES.xs, color: COLORS.primary, ...FONTS.semiBold },
  reportInput: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, color: '#fff', fontSize: SIZES.sm, padding: 12, minHeight: 120, textAlignVertical: 'top', marginBottom: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: SIZES.radiusLg, padding: 14, backgroundColor: COLORS.background, borderWidth: 1 },
  actionTxt: { fontSize: SIZES.sm, ...FONTS.semiBold },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 14 },
  submitTxt: { color: '#fff', fontSize: SIZES.md, ...FONTS.bold },
  doneBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 24 },
});

export default TeleradiologyScreen;
