import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { pharmacyAPI } from '../services/api';

const PharmacyOrdersScreen = () => {
    const [activeTab, setActiveTab] = useState('new');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await pharmacyAPI.getOrders({ status: 'all' });
            if (res.success) setOrders(res.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load pharmacy orders');
        } finally {
            setLoading(false);
        }
    };

    const filtered = orders.filter(o => {
        if (activeTab === 'new') return o.status === 'new';
        if (activeTab === 'packing') return o.status === 'packing';
        return ['ready', 'out_for_delivery', 'delivered'].includes(o.status);
    });

    const updateStatus = async (id, newStatus) => {
        try {
            await pharmacyAPI.updateOrderStatus(id, newStatus);
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>Pharmacy Orders</Text>
                    <Text style={s.sub}>e-Prescriptions & Refills</Text>
                </View>
                <View style={s.badge}>
                    <Text style={s.badgeText}>{orders.filter(o => o.status === 'new').length} New</Text>
                </View>
            </View>

            <View style={s.tabs}>
                {['new', 'packing', 'history'].map(tab => (
                    <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.activeTab]} onPress={() => setActiveTab(tab)}>
                        <Text style={[s.tabText, activeTab === tab && s.activeTabText]}>{tab.toUpperCase()}</Text>
                        {tab === 'new' && orders.filter(o => o.status === 'new').length > 0 && (
                            <View style={s.dot} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={s.scroll}>
                {filtered.map(order => (
                    <View key={order._id} style={s.card}>
                        <View style={s.cardHeader}>
                            <View>
                                <Text style={s.patientName}>{order.patientName}</Text>
                                <Text style={s.orderMeta}>{order.orderId} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                            </View>
                            <View style={[s.pill, order.status === 'new' && {backgroundColor: '#EF5350'}]}>
                                <Text style={s.pillText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={s.rxBox}>
                            <View style={s.rxTitleRow}>
                                <Ionicons name="document-text" size={16} color={COLORS.primary} />
                                <Text style={s.rxTitle}>{order.type || 'Digital Rx'} {order.doctorName ? `from ${order.doctorName}` : ''}</Text>
                            </View>
                            {(order.medicines || []).map((m, i) => (
                                <Text key={i} style={s.medItem}>• {m}</Text>
                            ))}
                        </View>

                        <View style={s.deliveryBox}>
                            <Ionicons name={order.isDelivery ? "bicycle" : "walk"} size={16} color={COLORS.textMuted} />
                            <Text style={s.deliveryText}>{order.isDelivery ? `Deliver to: ${order.address || 'Saved Address'}` : 'Self Pickup at Store'}</Text>
                        </View>

                        <View style={s.actionRow}>
                            {order.status === 'new' && (
                                <>
                                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.background }]} onPress={() => Alert.alert('Reject', 'Reject order?')}>
                                        <Text style={[s.actionText, { color: COLORS.text }]}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => updateStatus(order._id, 'packing')}>
                                        <Text style={[s.actionText, { color: '#fff' }]}>Accept & Pack</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {order.status === 'packing' && (
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#FFA726' }]} onPress={() => updateStatus(order._id, order.isDelivery ? 'out_for_delivery' : 'ready')}>
                                    <Text style={[s.actionText, { color: '#fff' }]}>{order.isDelivery ? 'Assign Rider' : 'Mark Ready for Pickup'}</Text>
                                </TouchableOpacity>
                            )}
                            {order.status === 'out_for_delivery' && (
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#66BB6A' }]} onPress={() => updateStatus(order._id, 'delivered')}>
                                    <Text style={[s.actionText, { color: '#fff' }]}>Mark Delivered</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
                
                {filtered.length === 0 && (
                    <Text style={s.emptyText}>No orders found.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { backgroundColor: '#EF5350', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    
    tabs: { flexDirection: 'row', backgroundColor: COLORS.card, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 14, flexDirection: 'row', justifyContent: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
    activeTabText: { color: COLORS.primary },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5350', marginLeft: 4, marginTop: -6 },
    
    scroll: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    patientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    orderMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    pill: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    pillText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

    rxBox: { backgroundColor: COLORS.primary + '05', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary + '20', marginBottom: 12 },
    rxTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    rxTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary, marginLeft: 6 },
    medItem: { fontSize: 14, color: COLORS.text, marginBottom: 4, marginLeft: 22 },

    deliveryBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    deliveryText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 8 },

    actionRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
    actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
    actionText: { fontSize: 14, fontWeight: 'bold' },

    emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted }
});

export default PharmacyOrdersScreen;
