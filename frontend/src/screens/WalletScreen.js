import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const TRANSACTIONS = [
    { id: '1', type: 'debit', label: 'CT Scan Analysis — SCAN-001', amount: 5, date: '25 Apr 2026', status: 'completed', scanType: 'CT' },
    { id: '2', type: 'debit', label: 'Second Opinion — Dr. Sarah Wilson', amount: 45, date: '24 Apr 2026', status: 'completed', scanType: null },
    { id: '3', type: 'credit', label: 'Credits Added via UPI', amount: 500, date: '22 Apr 2026', status: 'completed', scanType: null },
    { id: '4', type: 'debit', label: 'MRI Scan Analysis — SCAN-003', amount: 8, date: '20 Apr 2026', status: 'completed', scanType: 'MRI' },
    { id: '5', type: 'credit', label: 'Credits Added via Card', amount: 800, date: '15 Apr 2026', status: 'completed', scanType: null },
    { id: '6', type: 'debit', label: 'X-Ray Analysis — SCAN-004', amount: 2, date: '10 Apr 2026', status: 'completed', scanType: 'XRAY' },
    { id: '7', type: 'refund', label: 'Report Rejection Refund', amount: 8, date: '08 Apr 2026', status: 'completed', scanType: null },
];

const PACKS = [
    { id: 'p1', label: 'Starter', amount: 200, bonus: 0, popular: false },
    { id: 'p2', label: 'Standard', amount: 500, bonus: 50, popular: true },
    { id: 'p3', label: 'Pro', amount: 1000, bonus: 150, popular: false },
    { id: 'p4', label: 'Enterprise', amount: 5000, bonus: 1000, popular: false },
];

const PRICING = [
    { type: 'X-Ray Analysis', credits: 2, icon: 'radio-button-on', color: '#42A5F5' },
    { type: 'CT Scan Analysis', credits: 5, icon: 'layers', color: '#AB47BC' },
    { type: 'MRI Analysis', credits: 8, icon: 'magnet', color: '#26A69A' },
    { type: 'Second Opinion (Radiologist)', credits: '35–60', icon: 'people', color: '#FFA726' },
    { type: 'AI Emergency Priority', credits: 1, icon: 'alert-circle', color: COLORS.danger },
];

const WalletScreen = ({ navigation }) => {
    const [balance, setBalance] = useState(1250);
    const [showTopUp, setShowTopUp] = useState(false);
    const [selectedPack, setSelectedPack] = useState('p2');
    const [tab, setTab] = useState('history');

    const handleTopUp = () => {
        const pack = PACKS.find(p => p.id === selectedPack);
        setBalance(prev => prev + pack.amount + pack.bonus);
        setShowTopUp(false);
    };

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.title}>Wallet & Billing</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Balance Card */}
                <View style={s.balanceCard}>
                    <View style={s.balanceGlow} />
                    <Text style={s.balanceLabel}>Available Credits</Text>
                    <Text style={s.balanceAmt}>₹{balance.toLocaleString()}</Text>
                    <Text style={s.balanceSub}>1 Credit = ₹1 • Used for scans & consultations</Text>
                    <View style={s.balanceActions}>
                        <TouchableOpacity style={s.addBtn} onPress={() => setShowTopUp(true)}>
                            <Ionicons name="add-circle" size={18} color="#fff" />
                            <Text style={s.addTxt}>Add Credits</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.histBtn}>
                            <Ionicons name="receipt" size={18} color={COLORS.primary} />
                            <Text style={s.histTxt}>Statement</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={s.statsRow}>
                    {[
                        { label: 'Spent this month', val: '₹63', icon: 'trending-down', color: COLORS.danger },
                        { label: 'Scans analyzed', val: '4', icon: 'scan', color: COLORS.primary },
                        { label: 'Consultations', val: '1', icon: 'people', color: COLORS.warning },
                    ].map((st, i) => (
                        <View key={i} style={s.statCard}>
                            <Ionicons name={st.icon} size={18} color={st.color} />
                            <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                            <Text style={s.statLabel}>{st.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Tabs */}
                <View style={s.tabs}>
                    {['history', 'pricing'].map(t => (
                        <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                            <Text style={[s.tabTxt, tab === t && { color: '#fff' }]}>
                                {t === 'history' ? 'Transaction History' : 'Credit Pricing'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {tab === 'history' && (
                    <View style={{ paddingHorizontal: 24 }}>
                        {TRANSACTIONS.map(tx => (
                            <View key={tx.id} style={s.txRow}>
                                <View style={[s.txIcon, {
                                    backgroundColor: tx.type === 'credit' || tx.type === 'refund'
                                        ? COLORS.success + '20' : COLORS.danger + '20'
                                }]}>
                                    <Ionicons
                                        name={tx.type === 'credit' ? 'arrow-down' : tx.type === 'refund' ? 'refresh' : 'arrow-up'}
                                        size={16}
                                        color={tx.type === 'credit' || tx.type === 'refund' ? COLORS.success : COLORS.danger}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.txLabel} numberOfLines={1}>{tx.label}</Text>
                                    <Text style={s.txDate}>{tx.date}</Text>
                                </View>
                                <Text style={[s.txAmt, {
                                    color: tx.type === 'credit' || tx.type === 'refund' ? COLORS.success : COLORS.danger
                                }]}>
                                    {tx.type === 'debit' ? '−' : '+'}₹{tx.amount}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {tab === 'pricing' && (
                    <View style={{ paddingHorizontal: 24 }}>
                        <Text style={s.pricingHeader}>Credit Usage per Service</Text>
                        {PRICING.map((p, i) => (
                            <View key={i} style={s.pricingRow}>
                                <View style={[s.pricingIcon, { backgroundColor: p.color + '20' }]}>
                                    <Ionicons name={p.icon} size={18} color={p.color} />
                                </View>
                                <Text style={s.pricingLabel}>{p.type}</Text>
                                <View style={s.creditsBadge}>
                                    <Text style={s.creditsBadgeTxt}>{p.credits} cr</Text>
                                </View>
                            </View>
                        ))}
                        <View style={s.abdhNotice}>
                            <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
                            <Text style={s.abdhTxt}>ABDM members get 30% discount on all scan analyses.</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Top-Up Modal */}
            <Modal visible={showTopUp} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <TouchableOpacity style={s.modalClose} onPress={() => setShowTopUp(false)}>
                            <Ionicons name="close" size={22} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        <Text style={s.modalTitle}>Add Credits</Text>
                        <Text style={s.modalSub}>Select a top-up pack</Text>

                        <View style={s.packsGrid}>
                            {PACKS.map(pack => (
                                <TouchableOpacity
                                    key={pack.id}
                                    style={[s.packCard, selectedPack === pack.id && s.packActive]}
                                    onPress={() => setSelectedPack(pack.id)}
                                >
                                    {pack.popular && (
                                        <View style={s.popularBadge}><Text style={s.popularTxt}>POPULAR</Text></View>
                                    )}
                                    <Text style={s.packLabel}>{pack.label}</Text>
                                    <Text style={s.packAmt}>₹{pack.amount}</Text>
                                    {pack.bonus > 0 && (
                                        <Text style={s.packBonus}>+₹{pack.bonus} bonus</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={s.payBtn} onPress={handleTopUp}>
                            <Ionicons name="card" size={18} color="#fff" />
                            <Text style={s.payTxt}>
                                Pay ₹{PACKS.find(p => p.id === selectedPack)?.amount} via UPI / Card
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },
    balanceCard: { margin: 24, marginTop: 0, backgroundColor: COLORS.primaryDark, borderRadius: SIZES.radiusXl, padding: 28, overflow: 'hidden' },
    balanceGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.primary + '30', top: -80, right: -60 },
    balanceLabel: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', ...FONTS.medium, marginBottom: 4 },
    balanceAmt: { fontSize: 44, color: '#fff', ...FONTS.extraBold, marginBottom: 6 },
    balanceSub: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
    balanceActions: { flexDirection: 'row', gap: 12 },
    addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: SIZES.radius, paddingVertical: 12 },
    addTxt: { color: '#fff', ...FONTS.bold, fontSize: SIZES.sm },
    histBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: SIZES.radius, paddingVertical: 12 },
    histTxt: { color: COLORS.primary, ...FONTS.bold, fontSize: SIZES.sm },
    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4 },
    statVal: { fontSize: SIZES.xl, ...FONTS.bold },
    statLabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
    tabs: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: SIZES.radius, backgroundColor: COLORS.card, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabTxt: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.semiBold },
    txRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
    txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    txLabel: { fontSize: SIZES.md, color: '#fff', ...FONTS.medium, marginBottom: 2 },
    txDate: { fontSize: SIZES.xs, color: COLORS.textMuted },
    txAmt: { fontSize: SIZES.lg, ...FONTS.bold },
    pricingHeader: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    pricingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
    pricingIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    pricingLabel: { flex: 1, fontSize: SIZES.md, color: '#fff' },
    creditsBadge: { backgroundColor: COLORS.primaryGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    creditsBadgeTxt: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.bold },
    abdhNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primaryGlow, borderRadius: SIZES.radius, padding: 14, marginTop: 20 },
    abdhTxt: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary },
    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 },
    modalClose: { alignSelf: 'flex-end' },
    modalTitle: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold, marginBottom: 4 },
    modalSub: { fontSize: SIZES.sm, color: COLORS.textMuted, marginBottom: 24 },
    packsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    packCard: { width: '47%', backgroundColor: COLORS.background, borderRadius: SIZES.radiusLg, padding: 18, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
    packActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
    popularBadge: { backgroundColor: COLORS.warning, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 8 },
    popularTxt: { fontSize: 9, color: '#fff', ...FONTS.bold },
    packLabel: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 4 },
    packAmt: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },
    packBonus: { fontSize: SIZES.xs, color: COLORS.success, ...FONTS.semiBold, marginTop: 4 },
    payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, paddingVertical: 16 },
    payTxt: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
});

export default WalletScreen;
