import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { labAPI } from '../services/api';

const TIME_SLOTS = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:30 PM'];

const LabCartScreen = ({ navigation, route }) => {
    // In a real app, this would come from a Redux store or Context API
    const [cart, setCart] = useState([
        { id: 'T1', name: 'Complete Blood Count (CBC)', price: 400 },
        { id: 'T2', name: 'Lipid Profile', price: 600 }
    ]);
    
    const [bookingType, setBookingType] = useState('Home Collection');
    const [selectedDate, setSelectedDate] = useState('2026-05-07');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);

    const subTotal = cart.reduce((sum, item) => sum + item.price, 0);
    const homeFee = bookingType === 'Home Collection' ? 200 : 0;
    const totalAmount = subTotal + homeFee;

    const handleCheckout = async () => {
        if (cart.length === 0) return Alert.alert('Error', 'Your cart is empty');
        if (!selectedTime) return Alert.alert('Error', 'Please select a time slot.');

        setLoading(true);
        try {
            const res = await labAPI.createBooking({
                tests: cart.map(t => t.name),
                amountTotal: totalAmount,
                amountPaid: 0, 
                date: selectedDate,
                time: selectedTime,
                type: bookingType
            });

            if (res.data) {
                // Navigate to a success screen or checkout screen
                navigation.navigate('LabCheckout', { booking: res.data });
            }
        } catch (error) {
            console.error('Booking Error', error);
            Alert.alert('Error', 'Failed to create booking.');
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    if (cart.length === 0) {
        return (
            <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="cart-outline" size={64} color={COLORS.textMuted} />
                <Text style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 16 }}>Your cart is empty</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Browse Tests</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Review Booking</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                
                {/* Cart Items */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Tests Included</Text>
                    {cart.map((item, i) => (
                        <View key={i} style={s.cartItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.itemName}>{item.name}</Text>
                                <Text style={s.itemPrice}>₹{item.price}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                                <Ionicons name="trash-outline" size={20} color="#EF5350" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={s.addMoreBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="add" size={16} color={COLORS.primary} />
                        <Text style={s.addMoreText}>Add more tests</Text>
                    </TouchableOpacity>
                </View>

                {/* Collection Type */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Collection Type</Text>
                    <View style={s.typeRow}>
                        <TouchableOpacity 
                            style={[s.typeCard, bookingType === 'Lab Visit' && s.typeCardActive]}
                            onPress={() => setBookingType('Lab Visit')}
                        >
                            <Ionicons name="business" size={24} color={bookingType === 'Lab Visit' ? COLORS.primary : COLORS.textMuted} />
                            <Text style={[s.typeText, bookingType === 'Lab Visit' && {color: COLORS.primary}]}>Lab Visit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[s.typeCard, bookingType === 'Home Collection' && s.typeCardActive]}
                            onPress={() => setBookingType('Home Collection')}
                        >
                            <Ionicons name="home" size={24} color={bookingType === 'Home Collection' ? COLORS.primary : COLORS.textMuted} />
                            <Text style={[s.typeText, bookingType === 'Home Collection' && {color: COLORS.primary}]}>Home Sample</Text>
                            <Text style={{fontSize: 10, color: COLORS.textMuted}}>+₹200 fee</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Patient Address if Home Collection */}
                {bookingType === 'Home Collection' && (
                    <View style={s.card}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={s.sectionTitle}>Collection Address</Text>
                            <TouchableOpacity><Text style={{color: COLORS.primary, fontSize: 13, fontWeight: 'bold'}}>Change</Text></TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="location" size={20} color={COLORS.textMuted} />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.text }}>Home</Text>
                                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>Plot 45, Tech Park, City, 500081</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Scheduling */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Select Time Slot</Text>
                    <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>May 7th, 2026</Text>
                    <View style={s.slotGrid}>
                        {TIME_SLOTS.map(slot => (
                            <TouchableOpacity 
                                key={slot} 
                                style={[s.slotBox, selectedTime === slot && s.slotBoxActive]}
                                onPress={() => setSelectedTime(slot)}
                            >
                                <Text style={[s.slotText, selectedTime === slot && {color: '#fff'}]}>{slot}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Bill Summary */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Bill Summary</Text>
                    <View style={s.billRow}>
                        <Text style={s.billText}>M.R.P Total</Text>
                        <Text style={s.billText}>₹{subTotal + 300}</Text> 
                    </View>
                    <View style={s.billRow}>
                        <Text style={s.billText}>Discount</Text>
                        <Text style={[s.billText, {color: '#66BB6A'}]}>- ₹300</Text>
                    </View>
                    <View style={s.billRow}>
                        <Text style={s.billText}>Item Total</Text>
                        <Text style={s.billText}>₹{subTotal}</Text>
                    </View>
                    {bookingType === 'Home Collection' && (
                        <View style={s.billRow}>
                            <Text style={s.billText}>Home Collection Fee</Text>
                            <Text style={s.billText}>₹200</Text>
                        </View>
                    )}
                    <View style={[s.billRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 4 }]}>
                        <Text style={s.billTotal}>To Pay</Text>
                        <Text style={s.billTotal}>₹{totalAmount}</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Bar */}
            <View style={s.bottomBar}>
                <View>
                    <Text style={s.totalLabel}>Amount to Pay</Text>
                    <Text style={s.totalValue}>₹{totalAmount}</Text>
                </View>
                <TouchableOpacity style={s.bookBtn} onPress={handleCheckout} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.bookBtnText}>Proceed to Pay</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginLeft: 16 },
    
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
    
    cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
    itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    itemPrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
    addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    addMoreText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13, marginLeft: 4 },

    typeRow: { flexDirection: 'row', gap: 12 },
    typeCard: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    typeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    typeText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginTop: 8 },

    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotBox: { width: '30%', paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
    slotBoxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    slotText: { fontSize: 13, fontWeight: '600', color: COLORS.text },

    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    billText: { fontSize: 14, color: COLORS.textMuted },
    billTotal: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 12, color: COLORS.textMuted },
    totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    bookBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    bookBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

export default LabCartScreen;
