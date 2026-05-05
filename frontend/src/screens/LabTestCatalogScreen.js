import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { labAPI } from '../services/api';

const AVAILABLE_TESTS = [
    { id: 'T1', name: 'Complete Blood Count (CBC)', price: 400, category: 'Blood Test' },
    { id: 'T2', name: 'Lipid Profile', price: 600, category: 'Heart Health' },
    { id: 'T3', name: 'Thyroid Panel (T3, T4, TSH)', price: 800, category: 'Hormones' },
    { id: 'T4', name: 'HbA1c (Diabetes)', price: 500, category: 'Diabetes' },
    { id: 'T5', name: 'Vitamin D (25-OH)', price: 1200, category: 'Vitamins' },
];

const TIME_SLOTS = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:30 PM'];

const LabTestCatalogScreen = ({ navigation }) => {
    const [selectedTests, setSelectedTests] = useState([]);
    const [bookingType, setBookingType] = useState('Lab Visit'); // Lab Visit or Home Collection
    const [selectedDate, setSelectedDate] = useState('2026-05-07'); // Hardcoded for demo
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    const toggleTest = (test) => {
        setSelectedTests(prev => 
            prev.find(t => t.id === test.id) 
            ? prev.filter(t => t.id !== test.id) 
            : [...prev, test]
        );
    };

    const totalAmount = selectedTests.reduce((sum, test) => sum + test.price, 0) + (bookingType === 'Home Collection' ? 200 : 0);

    const handleBooking = async () => {
        if (selectedTests.length === 0) return Alert.alert('Error', 'Please select at least one test.');
        if (!selectedTime) return Alert.alert('Error', 'Please select a time slot.');

        setLoading(true);
        try {
            const res = await labAPI.createBooking({
                tests: selectedTests.map(t => t.name),
                amountTotal: totalAmount,
                amountPaid: 0, // Mocking Pay Later / Pending
                date: selectedDate,
                time: selectedTime,
                type: bookingType
            });

            if (res.data) {
                setBookingDetails(res.data);
                setBookingConfirmed(true);
            }
        } catch (error) {
            console.error('Booking Error', error);
            Alert.alert('Error', 'Failed to create booking.');
        } finally {
            setLoading(false);
        }
    };

    if (bookingConfirmed && bookingDetails) {
        return (
            <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="checkmark-circle" size={80} color="#66BB6A" />
                <Text style={s.successTitle}>Booking Confirmed!</Text>
                <Text style={s.successSub}>Your WhatsApp confirmation is on the way.</Text>
                
                <View style={s.receiptCard}>
                    <Text style={s.receiptId}>Booking ID: {bookingDetails._id.slice(-8).toUpperCase()}</Text>
                    <Text style={s.receiptText}>Type: {bookingDetails.type}</Text>
                    <Text style={s.receiptText}>Schedule: {bookingDetails.date} at {bookingDetails.time}</Text>
                    <Text style={s.receiptText}>Total Amount: ₹{bookingDetails.amountTotal}</Text>
                    <Text style={s.receiptText}>Status: <Text style={{color: '#FFA726'}}>Pending Payment</Text></Text>
                </View>

                <TouchableOpacity style={s.payBtn} onPress={() => {Alert.alert('Razorpay', 'Payment Gateway Integration Pending'); navigation.goBack()}}>
                    <Ionicons name="card" size={20} color="#fff" />
                    <Text style={s.payBtnText}>Pay Now (₹{bookingDetails.amountTotal})</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={s.doneBtn} onPress={() => navigation.goBack()}>
                    <Text style={s.doneBtnText}>Pay Later at Lab</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ marginLeft: 16 }}>
                    <Text style={s.greeting}>Book Lab Test</Text>
                    <Text style={s.sub}>Transparent Catalog & Smart Booking</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                {/* Catalog */}
                <Text style={s.sectionTitle}>Select Tests</Text>
                {AVAILABLE_TESTS.map(test => {
                    const isSelected = selectedTests.find(t => t.id === test.id);
                    return (
                        <TouchableOpacity 
                            key={test.id} 
                            style={[s.testCard, isSelected && s.testCardActive]}
                            onPress={() => toggleTest(test)}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[s.testName, isSelected && {color: COLORS.primary}]}>{test.name}</Text>
                                <Text style={s.testCat}>{test.category}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={s.testPrice}>₹{test.price}</Text>
                                <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={isSelected ? COLORS.primary : COLORS.border} />
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {/* Booking Type */}
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

                {/* Scheduling */}
                <Text style={s.sectionTitle}>Select Time Slot (May 7th)</Text>
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
            </ScrollView>

            {/* Bottom Bar */}
            {selectedTests.length > 0 && (
                <View style={s.bottomBar}>
                    <View>
                        <Text style={s.totalLabel}>Total Amount</Text>
                        <Text style={s.totalValue}>₹{totalAmount}</Text>
                        <Text style={s.totalSub}>{selectedTests.length} tests {bookingType === 'Home Collection' ? '+ Home Fee' : ''}</Text>
                    </View>
                    <TouchableOpacity style={s.bookBtn} onPress={handleBooking} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.bookBtnText}>Confirm Booking</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    greeting: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 12 },
    
    testCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
    testCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    testName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    testCat: { fontSize: 12, color: COLORS.textMuted },
    testPrice: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },

    typeRow: { flexDirection: 'row', gap: 12 },
    typeCard: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    typeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    typeText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginTop: 8 },

    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotBox: { width: '30%', paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
    slotBoxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    slotText: { fontSize: 13, fontWeight: '600', color: COLORS.text },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 12, color: COLORS.textMuted },
    totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    totalSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
    bookBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    bookBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    successTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
    successSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
    receiptCard: { width: '100%', backgroundColor: COLORS.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginTop: 30, marginBottom: 30 },
    receiptId: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 },
    receiptText: { fontSize: 14, color: COLORS.text, marginBottom: 8 },
    payBtn: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginBottom: 16 },
    payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    doneBtn: { paddingVertical: 12 },
    doneBtnText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' }
});

export default LabTestCatalogScreen;
