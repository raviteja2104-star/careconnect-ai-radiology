import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { labAPI } from '../services/api';

const LabCheckoutScreen = ({ navigation, route }) => {
    const { booking } = route.params;
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        // Simulate payment gateway delay
        setTimeout(async () => {
            try {
                // Update booking to fully paid
                await labAPI.updateBooking(booking._id, { amountPaid: booking.amountTotal });
                setSuccess(true);
            } catch (error) {
                Alert.alert('Payment Failed', 'Something went wrong during payment processing.');
            } finally {
                setLoading(false);
            }
        }, 2000);
    };

    if (success) {
        return (
            <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <View style={s.successCircle}>
                    <Ionicons name="checkmark" size={60} color="#fff" />
                </View>
                <Text style={s.successTitle}>Payment Successful!</Text>
                <Text style={s.successSub}>Your booking is confirmed.</Text>
                
                <View style={s.receiptCard}>
                    <Text style={s.receiptTitle}>Booking Receipt</Text>
                    <View style={s.receiptRow}>
                        <Text style={s.receiptLabel}>Booking ID</Text>
                        <Text style={s.receiptValue}>{booking._id.slice(-8).toUpperCase()}</Text>
                    </View>
                    <View style={s.receiptRow}>
                        <Text style={s.receiptLabel}>Amount Paid</Text>
                        <Text style={s.receiptValue}>₹{booking.amountTotal}</Text>
                    </View>
                    <View style={s.receiptRow}>
                        <Text style={s.receiptLabel}>Schedule</Text>
                        <Text style={s.receiptValue}>{booking.date} at {booking.time}</Text>
                    </View>
                </View>

                <TouchableOpacity style={s.doneBtn} onPress={() => navigation.navigate('Home')}>
                    <Text style={s.doneBtnText}>Back to Home</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Checkout</Text>
            </View>

            <View style={{ padding: 20 }}>
                <Text style={s.payTitle}>Select Payment Method</Text>
                
                <TouchableOpacity style={s.payOption} onPress={handlePayment}>
                    <Ionicons name="card" size={24} color={COLORS.primary} />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={s.payOptionTitle}>Credit / Debit Card</Text>
                        <Text style={s.payOptionSub}>Visa, Mastercard, RuPay</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={s.payOption} onPress={handlePayment}>
                    <Ionicons name="logo-paypal" size={24} color="#003087" />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={s.payOptionTitle}>UPI / Wallets</Text>
                        <Text style={s.payOptionSub}>GPay, PhonePe, Paytm</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity style={s.payOption} onPress={() => {
                    Alert.alert('Pay Later Selected', 'You can pay at the time of sample collection.', [
                        { text: 'OK', onPress: () => navigation.navigate('Home') }
                    ])
                }}>
                    <Ionicons name="cash" size={24} color="#66BB6A" />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={s.payOptionTitle}>Pay at Lab / Home</Text>
                        <Text style={s.payOptionSub}>Cash or Card on service</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

            </View>

            {loading && (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={s.loadingText}>Processing Payment...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginLeft: 16 },
    
    payTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
    payOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    payOptionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
    payOptionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    loadingText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 16 },

    successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#66BB6A', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#66BB6A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
    successSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 32 },

    receiptCard: { width: '100%', backgroundColor: COLORS.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', marginBottom: 32 },
    receiptTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    receiptLabel: { fontSize: 14, color: COLORS.textMuted },
    receiptValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },

    doneBtn: { width: '100%', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default LabCheckoutScreen;
