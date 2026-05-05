import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, RefreshControl, Alert, TextInput,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const MOCK_BOOKINGS = [
    { id: 'BKG-001', patient: 'Rahul Verma', phone: '+91-9876543011', tests: ['Complete Blood Count', 'Lipid Profile'], amountTotal: 1500, amountPaid: 500, amountDue: 1000, date: '2026-05-06', time: '09:00 AM', status: 'confirmed', type: 'Lab Visit' },
    { id: 'BKG-002', patient: 'Sneha Patel', phone: '+91-9876543022', tests: ['Thyroid Panel', 'HbA1c'], amountTotal: 1200, amountPaid: 1200, amountDue: 0, date: '2026-05-06', time: '10:30 AM', status: 'sample_collected', type: 'Home Collection' },
    { id: 'BKG-003', patient: 'Amit Singh', phone: '+91-9876543033', tests: ['MRI Spine', 'Vitamin D'], amountTotal: 6500, amountPaid: 0, amountDue: 6500, date: '2026-05-07', time: '02:15 PM', status: 'pending_payment', type: 'Lab Visit' },
    { id: 'BKG-004', patient: 'Pooja Reddy', phone: '+91-9876543044', tests: ['Liver Function Test'], amountTotal: 800, amountPaid: 800, amountDue: 0, date: '2026-05-05', time: '11:00 AM', status: 'report_ready', type: 'Home Collection' },
];

const statusColors = {
    confirmed: '#42A5F5',
    sample_collected: '#AB47BC',
    pending_payment: '#FFA726',
    report_ready: '#66BB6A',
    cancelled: '#EF5350'
};

const SmartBookingScreen = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [bookings, setBookings] = useState(MOCK_BOOKINGS);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showStatementModal, setShowStatementModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const onRefresh = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 1000));
        setRefreshing(false);
    };

    const updateStatus = (id, newStatus) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        Alert.alert('Success', `Booking status updated to ${newStatus.replace('_', ' ')}`);
    };

    const handlePayment = (id, amountDue) => {
        Alert.alert('Record Payment', `Record payment of ₹${amountDue}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: () => {
                setBookings(prev => prev.map(b => b.id === id ? { ...b, amountPaid: b.amountTotal, amountDue: 0, status: 'confirmed' } : b));
                Alert.alert('Payment Recorded', 'Payment has been successfully recorded.');
            }}
        ]);
    };

    const sendWhatsApp = (phone, type) => {
        Alert.alert('WhatsApp Integrated', `Sending ${type} to ${phone} via WhatsApp API...`);
    };

    const generateStatement = (booking) => {
        setSelectedBooking(booking);
        setShowStatementModal(true);
    };

    const filteredBookings = bookings.filter(b => 
        (activeTab === 'all' || 
        (activeTab === 'upcoming' && ['confirmed', 'pending_payment'].includes(b.status)) ||
        (activeTab === 'completed' && ['report_ready', 'sample_collected'].includes(b.status))) &&
        (b.patient.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalDue = bookings.reduce((sum, b) => sum + b.amountDue, 0);
    const todayAppointments = bookings.filter(b => b.date === '2026-05-06').length;

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>SmartCarePlus Booking</Text>
                    <Text style={s.sub}>Automated scheduling & payment tracking</Text>
                </View>
                <View style={s.badge}>
                    <Ionicons name="calendar" size={14} color="#fff" />
                    <Text style={s.badgeText}>SMART BOOKING</Text>
                </View>
            </View>

            {/* Quick Stats */}
            <View style={s.statsContainer}>
                <View style={[s.statBox, { borderLeftColor: '#42A5F5' }]}>
                    <Text style={s.statValue}>{todayAppointments}</Text>
                    <Text style={s.statLabel}>Today's Visits</Text>
                </View>
                <View style={[s.statBox, { borderLeftColor: '#FFA726' }]}>
                    <Text style={s.statValue}>₹{totalDue}</Text>
                    <Text style={s.statLabel}>Total Due</Text>
                </View>
                <View style={[s.statBox, { borderLeftColor: '#66BB6A' }]}>
                    <Text style={s.statValue}>{bookings.filter(b => b.status === 'report_ready').length}</Text>
                    <Text style={s.statLabel}>Reports Ready</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={s.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.textMuted} />
                <TextInput 
                    style={s.searchInput}
                    placeholder="Search by Patient Name or Booking ID..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
                {['upcoming', 'completed', 'all'].map(tab => (
                    <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
                        <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>{tab.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView 
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {filteredBookings.map(bkg => (
                    <View key={bkg.id} style={s.card}>
                        <View style={s.cardHeader}>
                            <View>
                                <Text style={s.cardTitle}>{bkg.patient}</Text>
                                <Text style={s.cardSub}>{bkg.id} · {bkg.type}</Text>
                            </View>
                            <View style={[s.pill, { backgroundColor: (statusColors[bkg.status] || '#888') + '20' }]}>
                                <Text style={[s.pillText, { color: statusColors[bkg.status] || '#888' }]}>{bkg.status.replace('_', ' ').toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={s.dateTimeRow}>
                            <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                            <Text style={s.metaText}>{bkg.date}</Text>
                            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
                            <Text style={s.metaText}>{bkg.time}</Text>
                        </View>

                        <View style={s.testsContainer}>
                            {bkg.tests.map((test, i) => (
                                <View key={i} style={s.testChip}>
                                    <Text style={s.testChipText}>{test}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={s.paymentRow}>
                            <View>
                                <Text style={s.paymentLabel}>Total Amount</Text>
                                <Text style={s.paymentValue}>₹{bkg.amountTotal}</Text>
                            </View>
                            <View>
                                <Text style={s.paymentLabel}>Paid</Text>
                                <Text style={[s.paymentValue, { color: '#66BB6A' }]}>₹{bkg.amountPaid}</Text>
                            </View>
                            <View>
                                <Text style={s.paymentLabel}>Due</Text>
                                <Text style={[s.paymentValue, { color: bkg.amountDue > 0 ? '#EF5350' : COLORS.text }]}>₹{bkg.amountDue}</Text>
                            </View>
                        </View>

                        <View style={s.actionsContainer}>
                            {bkg.amountDue > 0 ? (
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#FFA726' }]} onPress={() => handlePayment(bkg.id, bkg.amountDue)}>
                                    <Ionicons name="card" size={16} color="#fff" />
                                    <Text style={s.actionBtnText}>Collect Payment</Text>
                                </TouchableOpacity>
                            ) : null}

                            {bkg.status === 'confirmed' ? (
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#AB47BC' }]} onPress={() => updateStatus(bkg.id, 'sample_collected')}>
                                    <Ionicons name="flask" size={16} color="#fff" />
                                    <Text style={s.actionBtnText}>Sample Collected</Text>
                                </TouchableOpacity>
                            ) : null}

                            {bkg.status === 'sample_collected' ? (
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#66BB6A' }]} onPress={() => updateStatus(bkg.id, 'report_ready')}>
                                    <Ionicons name="document-text" size={16} color="#fff" />
                                    <Text style={s.actionBtnText}>Mark Report Ready</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <View style={s.utilityActions}>
                            <TouchableOpacity style={s.utilityBtn} onPress={() => sendWhatsApp(bkg.phone, 'Booking Confirmation')}>
                                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                                <Text style={[s.utilityBtnText, { color: '#25D366' }]}>WhatsApp Alert</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.utilityBtn} onPress={() => generateStatement(bkg)}>
                                <Ionicons name="document" size={16} color={COLORS.primary} />
                                <Text style={[s.utilityBtnText, { color: COLORS.primary }]}>View Statement</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Statement Modal */}
            {selectedBooking && (
                <Modal visible={showStatementModal} animationType="slide" transparent={true}>
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Text style={s.modalTitle}>Detailed Statement</Text>
                                <TouchableOpacity onPress={() => setShowStatementModal(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={s.modalBody}>
                                <View style={s.statementBrand}>
                                    <Ionicons name="hardware-chip" size={32} color={COLORS.primary} />
                                    <Text style={s.statementBrandTitle}>SmartCarePlus Diagnostics</Text>
                                    <Text style={s.statementBrandSub}>Automated Billing Statement</Text>
                                </View>
                                
                                <View style={s.statementSection}>
                                    <Text style={s.statementLabel}>Patient Details</Text>
                                    <Text style={s.statementValue}>{selectedBooking.patient}</Text>
                                    <Text style={s.statementSubValue}>Phone: {selectedBooking.phone}</Text>
                                    <Text style={s.statementSubValue}>Booking ID: {selectedBooking.id}</Text>
                                </View>

                                <View style={s.statementSection}>
                                    <Text style={s.statementLabel}>Itemized Billing</Text>
                                    {selectedBooking.tests.map((t, i) => (
                                        <View key={i} style={s.statementRow}>
                                            <Text style={s.statementRowText}>{t}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={s.statementSection}>
                                    <Text style={s.statementLabel}>Payment History</Text>
                                    <View style={s.statementRow}>
                                        <Text style={s.statementRowText}>Total Amount</Text>
                                        <Text style={s.statementRowValue}>₹{selectedBooking.amountTotal}</Text>
                                    </View>
                                    <View style={s.statementRow}>
                                        <Text style={s.statementRowText}>Amount Paid</Text>
                                        <Text style={[s.statementRowValue, { color: '#66BB6A' }]}>₹{selectedBooking.amountPaid}</Text>
                                    </View>
                                    <View style={[s.statementRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 }]}>
                                        <Text style={[s.statementRowText, { fontWeight: 'bold' }]}>Balance Due</Text>
                                        <Text style={[s.statementRowValue, { color: '#EF5350', fontWeight: 'bold' }]}>₹{selectedBooking.amountDue}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={s.downloadBtn} onPress={() => {Alert.alert('Downloaded', 'Statement saved as PDF'); setShowStatementModal(false);}}>
                                    <Ionicons name="download" size={20} color="#fff" />
                                    <Text style={s.downloadBtnText}>Download PDF Statement</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    greeting: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    statsContainer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: COLORS.background },
    statBox: { flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border },
    statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, height: 44, marginLeft: 8, color: COLORS.text, fontSize: 14 },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
    tabActive: { backgroundColor: COLORS.primary + '20' },
    tabLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
    tabLabelActive: { color: COLORS.primary },
    card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    pillText: { fontSize: 10, fontWeight: '700' },
    dateTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    metaText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 4 },
    testsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
    testChip: { backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
    testChipText: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.background, padding: 12, borderRadius: 10, marginBottom: 16 },
    paymentLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
    paymentValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    actionsContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
    actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    utilityActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
    utilityBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
    utilityBtnText: { fontSize: 13, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.background, height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    modalBody: { flex: 1 },
    statementBrand: { alignItems: 'center', marginBottom: 30, padding: 20, backgroundColor: COLORS.card, borderRadius: 12 },
    statementBrandTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 10 },
    statementBrandSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    statementSection: { marginBottom: 24 },
    statementLabel: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    statementValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    statementSubValue: { fontSize: 13, color: COLORS.textMuted, marginBottom: 2 },
    statementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    statementRowText: { fontSize: 14, color: COLORS.text },
    statementRowValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginTop: 20, marginBottom: 40 },
    downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default SmartBookingScreen;
