import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const MOCK_REMINDERS = [
    { id: 1, med: 'Amoxicillin 250mg', time: '08:00 AM', meal: 'After Food', active: true },
    { id: 2, med: 'Vitamin D3', time: '12:00 PM', meal: 'With Food', active: true },
    { id: 3, med: 'Atorvastatin 10mg', time: '09:00 PM', meal: 'Before Sleep', active: false },
];

const HealthProfileScreen = ({ navigation }) => {
    const [reminders, setReminders] = useState(MOCK_REMINDERS);

    const toggleReminder = (id) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>My Health Profile</Text>
                    <Text style={s.sub}>ABDM Compliant Records</Text>
                </View>
                <TouchableOpacity style={s.iconBtn}>
                    <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                
                {/* Digital Health ID (ABHA) */}
                <Text style={s.sectionTitle}>Digital Health ID (ABHA)</Text>
                <View style={s.abhaCard}>
                    <View style={s.abhaHeader}>
                        <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/National_Health_Authority_%28India%29_logo.png'}} style={s.abhaLogo} />
                        <Text style={s.abhaTitle}>Ayushman Bharat Health Account</Text>
                    </View>
                    <View style={s.abhaContent}>
                        <View style={s.qrPlaceholder}>
                            <Ionicons name="qr-code" size={50} color={COLORS.text} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={s.abhaName}>Ravi Teja</Text>
                            <Text style={s.abhaNumber}>ABHA: 91-4452-8821-9011</Text>
                            <Text style={s.abhaAddress}>ravi.abha@sbx</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={s.shareBtn}>
                        <Ionicons name="share-social" size={14} color="#fff" />
                        <Text style={s.shareBtnText}>Share ABHA QR at Clinic</Text>
                    </TouchableOpacity>
                </View>

                {/* Health Records Shortcut */}
                <Text style={s.sectionTitle}>Smarter Health Records</Text>
                <View style={s.recordsGrid}>
                    <TouchableOpacity style={s.recordBox} onPress={() => navigation.navigate('Records')}>
                        <View style={[s.recordIcon, { backgroundColor: '#42A5F520' }]}>
                            <Ionicons name="document-text" size={24} color="#42A5F5" />
                        </View>
                        <Text style={s.recordLabel}>Lab Reports</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.recordBox}>
                        <View style={[s.recordIcon, { backgroundColor: '#AB47BC20' }]}>
                            <Ionicons name="scan" size={24} color="#AB47BC" />
                        </View>
                        <Text style={s.recordLabel}>Radiology Scans</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.recordBox}>
                        <View style={[s.recordIcon, { backgroundColor: '#66BB6A20' }]}>
                            <Ionicons name="medical" size={24} color="#66BB6A" />
                        </View>
                        <Text style={s.recordLabel}>Prescriptions</Text>
                    </TouchableOpacity>
                </View>

                {/* Smart Medicine Reminders */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Smart Medicine Reminders</Text>
                    <TouchableOpacity>
                        <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
                
                {reminders.map(rem => (
                    <View key={rem.id} style={[s.reminderCard, !rem.active && { opacity: 0.6 }]}>
                        <View style={[s.timeBox, rem.active ? { backgroundColor: COLORS.primary } : { backgroundColor: COLORS.border }]}>
                            <Text style={s.timeText}>{rem.time}</Text>
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 12 }}>
                            <Text style={s.medName}>{rem.med}</Text>
                            <Text style={s.medMeal}>{rem.meal}</Text>
                        </View>
                        <Switch 
                            value={rem.active}
                            onValueChange={() => toggleReminder(rem.id)}
                            trackColor={{ false: "#767577", true: COLORS.primaryGlow }}
                            thumbColor={rem.active ? COLORS.primary : "#f4f3f4"}
                        />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    iconBtn: { padding: 8, backgroundColor: COLORS.background, borderRadius: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    
    abhaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    abhaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    abhaLogo: { width: 30, height: 30, resizeMode: 'contain' },
    abhaTitle: { fontSize: 13, fontWeight: '700', color: '#333' },
    abhaContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    qrPlaceholder: { width: 80, height: 80, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    abhaName: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    abhaNumber: { fontSize: 14, color: '#444', marginTop: 4, fontWeight: '600' },
    abhaAddress: { fontSize: 12, color: '#666', marginTop: 2 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0056b3', paddingVertical: 12, borderRadius: 8 },
    shareBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    recordsGrid: { flexDirection: 'row', gap: 12 },
    recordBox: { flex: 1, backgroundColor: COLORS.card, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    recordIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    recordLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

    reminderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
    timeBox: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    timeText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
    medName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    medMeal: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});

export default HealthProfileScreen;
