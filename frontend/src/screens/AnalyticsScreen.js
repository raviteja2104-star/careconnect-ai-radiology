import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const PERIODS = ['7D', '30D', '90D', 'All'];

const SCAN_DATA = [40, 65, 50, 80, 60, 90, 72, 95, 55, 70, 85, 45];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BarChart = ({ data, labels }) => {
    const max = Math.max(...data);
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120, paddingTop: 8 }}>
            {data.map((val, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{
                        height: (val / max) * 100,
                        backgroundColor: COLORS.primary + 'AA',
                        borderRadius: 4,
                        width: '100%',
                        minHeight: 4,
                    }} />
                    <Text style={{ fontSize: 7, color: COLORS.textMuted, marginTop: 4 }}>{labels[i]}</Text>
                </View>
            ))}
        </View>
    );
};

const ProgressBar = ({ value, color = COLORS.primary }) => (
    <View style={{ height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
        <View style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 3 }} />
    </View>
);

const AnalyticsScreen = ({ navigation }) => {
    const [period, setPeriod] = useState('30D');

    const kpis = [
        { label: 'Total Scans', value: '1,422', change: '+12.5%', up: true, icon: 'scan', color: COLORS.primary },
        { label: 'Avg TAT', value: '18.5m', change: '-2.4m', up: true, icon: 'timer', color: COLORS.warning },
        { label: 'AI Accuracy', value: '98.2%', change: '+0.4%', up: true, icon: 'analytics', color: COLORS.success },
        { label: 'Emergencies', value: '142', change: '+8', up: false, icon: 'alert-circle', color: COLORS.danger },
    ];

    const radiologists = [
        { name: 'Dr. S. Wilson', scans: 284, tat: '14m', accuracy: 97 },
        { name: 'Dr. J. Chen', scans: 192, tat: '11m', accuracy: 98 },
        { name: 'Dr. P. Verma', scans: 319, tat: '20m', accuracy: 99 },
        { name: 'Dr. A. Mehta', scans: 148, tat: '17m', accuracy: 96 },
    ];

    return (
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.title}>Analytics</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Period Selector */}
            <View style={s.periodRow}>
                {PERIODS.map(p => (
                    <TouchableOpacity key={p} style={[s.periodBtn, period === p && s.periodActive]} onPress={() => setPeriod(p)}>
                        <Text style={[s.periodTxt, period === p && { color: '#fff' }]}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* KPI Cards */}
            <View style={s.kpiGrid}>
                {kpis.map((kpi, i) => (
                    <View key={i} style={s.kpiCard}>
                        <View style={[s.kpiIcon, { backgroundColor: kpi.color + '20' }]}>
                            <Ionicons name={kpi.icon} size={18} color={kpi.color} />
                        </View>
                        <Text style={s.kpiLabel}>{kpi.label}</Text>
                        <Text style={s.kpiValue}>{kpi.value}</Text>
                        <View style={[s.changeBadge, { backgroundColor: (kpi.up ? COLORS.success : COLORS.danger) + '20' }]}>
                            <Ionicons name={kpi.up ? 'trending-up' : 'trending-down'} size={10} color={kpi.up ? COLORS.success : COLORS.danger} />
                            <Text style={[s.changeTxt, { color: kpi.up ? COLORS.success : COLORS.danger }]}>{kpi.change}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Case Volume Chart */}
            <View style={s.chartCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={s.sectionTitle}>Diagnostic Load Trend</Text>
                    <View style={s.legendRow}>
                        <View style={[s.legendDot, { backgroundColor: COLORS.primary }]} />
                        <Text style={s.legendTxt}>Scans / Month</Text>
                    </View>
                </View>
                <BarChart data={SCAN_DATA} labels={MONTHS} />
            </View>

            {/* Modality Breakdown */}
            <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Modality Breakdown</Text>
                <View style={{ marginTop: 16, gap: 14 }}>
                    {[
                        { label: 'X-Ray', pct: 52, count: 739, color: '#42A5F5' },
                        { label: 'CT Scan', pct: 30, count: 427, color: '#AB47BC' },
                        { label: 'MRI', pct: 18, count: 256, color: '#26A69A' },
                    ].map((m, i) => (
                        <View key={i}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: '#fff', fontSize: SIZES.sm }}>{m.label}</Text>
                                <Text style={{ color: COLORS.textMuted, fontSize: SIZES.sm }}>{m.count} scans ({m.pct}%)</Text>
                            </View>
                            <ProgressBar value={m.pct} color={m.color} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Risk Distribution */}
            <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>AI Risk Distribution</Text>
                <View style={s.riskRow}>
                    {[
                        { label: 'Low', val: '68%', color: COLORS.success },
                        { label: 'Medium', val: '18%', color: COLORS.warning },
                        { label: 'High', val: '10%', color: COLORS.danger },
                        { label: 'Critical', val: '4%', color: '#D32F2F' },
                    ].map((r, i) => (
                        <View key={i} style={s.riskCard}>
                            <View style={[s.riskDot, { backgroundColor: r.color }]} />
                            <Text style={[s.riskVal, { color: r.color }]}>{r.val}</Text>
                            <Text style={s.riskLabel}>{r.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Radiologist Performance */}
            <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Radiologist Performance</Text>
                <View style={{ gap: 12, marginTop: 14 }}>
                    {radiologists.map((r, i) => (
                        <View key={i} style={s.radRow}>
                            <View style={s.radAvatar}>
                                <Text style={s.radAvatarTxt}>{r.name.split(' ')[1][0]}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={s.radName}>{r.name}</Text>
                                    <Text style={{ color: COLORS.textMuted, fontSize: SIZES.xs }}>{r.tat} avg</Text>
                                </View>
                                <ProgressBar value={r.accuracy} color={COLORS.primary} />
                                <Text style={{ color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 3 }}>
                                    {r.scans} scans • {r.accuracy}% accuracy
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Emergency Response */}
            <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Emergency Response</Text>
                <View style={s.emergRow}>
                    {[
                        { label: 'Avg Dispatch', val: '4.2 min', icon: 'car', color: COLORS.danger },
                        { label: 'SOS Success', val: '98%', icon: 'shield-checkmark', color: COLORS.success },
                        { label: 'Active Alerts', val: '3', icon: 'pulse', color: COLORS.warning },
                    ].map((e, i) => (
                        <View key={i} style={s.emergCard}>
                            <Ionicons name={e.icon} size={20} color={e.color} />
                            <Text style={[s.emergVal, { color: e.color }]}>{e.val}</Text>
                            <Text style={s.emergLabel}>{e.label}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },
    periodRow: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 20, backgroundColor: COLORS.card, borderRadius: SIZES.radiusFull, padding: 4, gap: 4, borderWidth: 1, borderColor: COLORS.border },
    periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
    periodActive: { backgroundColor: COLORS.primary },
    periodTxt: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10, marginBottom: 20 },
    kpiCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    kpiLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    kpiValue: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold, marginBottom: 6 },
    changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' },
    changeTxt: { fontSize: 10, ...FONTS.bold },
    chartCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, marginHorizontal: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendTxt: { fontSize: SIZES.xs, color: COLORS.textMuted },
    sectionCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, marginHorizontal: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    sectionTitle: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 0.8 },
    riskRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    riskCard: { alignItems: 'center', gap: 6 },
    riskDot: { width: 12, height: 12, borderRadius: 6 },
    riskVal: { fontSize: SIZES.xl, ...FONTS.bold },
    riskLabel: { fontSize: SIZES.xs, color: COLORS.textMuted },
    radRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    radAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    radAvatarTxt: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.bold },
    radName: { fontSize: SIZES.md, color: '#fff', ...FONTS.semiBold },
    emergRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    emergCard: { alignItems: 'center', gap: 6, backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 16, flex: 1, marginHorizontal: 4 },
    emergVal: { fontSize: SIZES.xl, ...FONTS.bold },
    emergLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, textAlign: 'center' },
});

export default AnalyticsScreen;
