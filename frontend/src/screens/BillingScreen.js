import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const STATUS_COLOR = {
    paid: COLORS.success,
    pending: COLORS.warning,
    partial: COLORS.primary,
    overdue: COLORS.danger,
    cancelled: COLORS.textMuted,
    refunded: COLORS.textMuted,
};

const STATUS_ICON = {
    paid: 'checkmark-circle',
    pending: 'time',
    partial: 'pie-chart',
    overdue: 'alert-circle',
    cancelled: 'close-circle',
    refunded: 'refresh-circle',
};

const BillingScreen = ({ navigation }) => {
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const loadInvoices = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            const res = await api.get('/billing/invoices');
            const data = res.data?.data || res.data || [];
            setInvoices(Array.isArray(data) ? data : []);
            setSummary(res.data?.summary || null);
        } catch {
            setError('Could not load billing information.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    React.useEffect(() => { loadInvoices(); }, [loadInvoices]);

    const onRefresh = () => { setRefreshing(true); loadInvoices(true); };

    const totalDue = invoices
        .filter(i => ['pending', 'partial', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + (i.balanceDue || i.amount || 0), 0);

    return (
        <View style={s.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Billing</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Summary card */}
                {!loading && totalDue > 0 && (
                    <View style={s.dueCard}>
                        <View style={s.dueGlow} />
                        <Text style={s.dueLabel}>OUTSTANDING BALANCE</Text>
                        <Text style={s.dueAmount}>₹{totalDue.toLocaleString('en-IN')}</Text>
                        <Text style={s.dueHint}>Pay at the billing counter or online</Text>
                    </View>
                )}

                {summary && (
                    <View style={s.statsRow}>
                        <StatTile label="Total Invoices" value={summary.total || invoices.length} />
                        <StatTile label="Paid" value={summary.paid || 0} color={COLORS.success} />
                        <StatTile label="Pending" value={summary.pending || 0} color={COLORS.warning} />
                    </View>
                )}

                {/* Invoice list */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Invoice History</Text>
                </View>

                {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />}
                {error ? <Text style={s.errorTxt}>{error}</Text> : null}

                {!loading && invoices.length === 0 && (
                    <View style={s.empty}>
                        <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
                        <Text style={s.emptyTitle}>No invoices found</Text>
                        <Text style={s.emptySubtitle}>Your billing history will appear here</Text>
                    </View>
                )}

                {!loading && invoices.map(inv => (
                    <InvoiceCard
                        key={inv._id}
                        inv={inv}
                        expanded={expandedId === inv._id}
                        onToggle={() => setExpandedId(expandedId === inv._id ? null : inv._id)}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const StatTile = ({ label, value, color }) => (
    <View style={s.statTile}>
        <Text style={[s.statValue, color && { color }]}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
    </View>
);

const InvoiceCard = ({ inv, expanded, onToggle }) => {
    const color = STATUS_COLOR[inv.status] || COLORS.primary;
    const icon = STATUS_ICON[inv.status] || 'receipt';
    const dateStr = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const items = inv.items || [];

    return (
        <View style={s.card}>
            <TouchableOpacity style={s.cardHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={[s.iconWrap, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.invId}>{inv.invoiceNumber || inv._id?.slice(-6)?.toUpperCase()}</Text>
                    <Text style={s.invDate}>{dateStr}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={s.invAmount}>₹{(inv.totalAmount || inv.amount || 0).toLocaleString('en-IN')}</Text>
                    <View style={[s.statusBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[s.statusTxt, { color }]}>{inv.status}</Text>
                    </View>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {expanded && (
                <View style={s.cardBody}>
                    {/* Line items */}
                    {items.length > 0 && (
                        <>
                            <Text style={s.lineItemsLabel}>Items</Text>
                            {items.map((item, i) => (
                                <View key={i} style={s.lineItem}>
                                    <Text style={s.lineItemName} numberOfLines={1}>{item.description || item.name}</Text>
                                    <Text style={s.lineItemAmt}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                                </View>
                            ))}
                            <View style={s.divider} />
                        </>
                    )}

                    {/* Totals */}
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>Subtotal</Text>
                        <Text style={s.totalVal}>₹{(inv.subtotal || inv.totalAmount || inv.amount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    {inv.discount > 0 && (
                        <View style={s.totalRow}>
                            <Text style={[s.totalLabel, { color: COLORS.success }]}>Discount</Text>
                            <Text style={[s.totalVal, { color: COLORS.success }]}>-₹{inv.discount.toLocaleString('en-IN')}</Text>
                        </View>
                    )}
                    {inv.tax > 0 && (
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Tax</Text>
                            <Text style={s.totalVal}>₹{inv.tax.toLocaleString('en-IN')}</Text>
                        </View>
                    )}
                    <View style={[s.totalRow, { marginTop: 4 }]}>
                        <Text style={[s.totalLabel, { color: '#fff', ...FONTS.bold }]}>Total</Text>
                        <Text style={[s.totalVal, { color: '#fff', ...FONTS.bold }]}>₹{(inv.totalAmount || inv.amount || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    {inv.balanceDue > 0 && (
                        <View style={[s.totalRow, { marginTop: 8 }]}>
                            <Text style={[s.totalLabel, { color: COLORS.warning }]}>Balance Due</Text>
                            <Text style={[s.totalVal, { color: COLORS.warning, ...FONTS.bold }]}>₹{inv.balanceDue.toLocaleString('en-IN')}</Text>
                        </View>
                    )}

                    {inv.paidAt && (
                        <Text style={s.paidNote}>
                            Paid on {new Date(inv.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                    )}

                    {inv.paymentMethod && (
                        <View style={s.payMethodRow}>
                            <Ionicons name="card-outline" size={13} color={COLORS.textMuted} />
                            <Text style={s.payMethodTxt}>{inv.paymentMethod}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },

    dueCard: { marginHorizontal: 24, marginBottom: 20, backgroundColor: COLORS.warning + '15', borderRadius: SIZES.radiusXl, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.warning + '40' },
    dueGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.warning + '15', top: -50, right: -30 },
    dueLabel: { fontSize: SIZES.xs, color: COLORS.warning, ...FONTS.bold, letterSpacing: 1, textTransform: 'uppercase' },
    dueAmount: { fontSize: 36, color: '#fff', ...FONTS.bold, marginTop: 4 },
    dueHint: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.6)', marginTop: 8 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 20 },
    statTile: { flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    statValue: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    statLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

    sectionHeader: { paddingHorizontal: 24, marginBottom: 12 },
    sectionTitle: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },

    errorTxt: { textAlign: 'center', color: COLORS.danger, margin: 24 },
    empty: { alignItems: 'center', paddingTop: 48, gap: 10 },
    emptyTitle: { fontSize: SIZES.base, color: COLORS.textMuted },
    emptySubtitle: { fontSize: SIZES.sm, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 32 },

    card: { marginHorizontal: 24, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    invId: { fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold },
    invDate: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    invAmount: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    statusBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
    statusTxt: { fontSize: 10, ...FONTS.bold, textTransform: 'capitalize' },

    cardBody: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 14, gap: 8 },
    lineItemsLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
    lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lineItemName: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, marginRight: 12 },
    lineItemAmt: { fontSize: SIZES.sm, color: '#fff', ...FONTS.medium },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: SIZES.sm, color: COLORS.textMuted },
    totalVal: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium },
    paidNote: { fontSize: SIZES.xs, color: COLORS.success, marginTop: 4 },
    payMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    payMethodTxt: { fontSize: SIZES.xs, color: COLORS.textMuted },
});

export default BillingScreen;
