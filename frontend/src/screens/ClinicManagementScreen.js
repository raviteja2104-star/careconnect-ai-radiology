import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const MOCK_CLINICS = [
    { id: 'C-01', name: 'CareConnect City Hospital', role: 'Primary Consult', isActive: true, appointmentsToday: 12 },
    { id: 'C-02', name: 'Sunrise Health Clinic', role: 'Evening Practice', isActive: false, appointmentsToday: 4 },
];

const ClinicManagementScreen = () => {
    const [clinics, setClinics] = useState(MOCK_CLINICS);
    const [smartBillingEnabled, setSmartBillingEnabled] = useState(true);

    const toggleClinic = (id) => {
        setClinics(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Clinic Manager</Text>
                    <Text style={s.sub}>Multi-location practice setup</Text>
                </View>
                <View style={s.badge}>
                    <Ionicons name="business" size={14} color="#fff" />
                    <Text style={s.badgeText}>DOCTOR</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                
                {/* Digital Clinic Profile */}
                <View style={s.profileCard}>
                    <View style={s.qrPlaceholder}>
                        <Ionicons name="qr-code" size={50} color={COLORS.primary} />
                        <Text style={s.qrText}>Patient Scan</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={s.docName}>Dr. Raj Sharma</Text>
                        <Text style={s.docSpec}>General Physician</Text>
                        <View style={s.waBox}>
                            <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                            <Text style={s.waText}>WhatsApp Appointments ON</Text>
                        </View>
                    </View>
                </View>

                {/* Multi-Clinic Locations */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>My Clinics & Hospitals</Text>
                    <TouchableOpacity>
                        <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {clinics.map(clinic => (
                    <View key={clinic.id} style={[s.clinicCard, clinic.isActive ? { borderColor: COLORS.primary, borderWidth: 1 } : {}]}>
                        <View style={s.clinicRow}>
                            <View style={[s.clinicIcon, clinic.isActive ? { backgroundColor: COLORS.primary } : { backgroundColor: COLORS.border }]}>
                                <Ionicons name="business" size={20} color="#fff" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={s.clinicName}>{clinic.name}</Text>
                                <Text style={s.clinicRole}>{clinic.role}</Text>
                                <Text style={s.clinicAppt}>{clinic.appointmentsToday} appointments today</Text>
                            </View>
                            <Switch 
                                value={clinic.isActive}
                                onValueChange={() => toggleClinic(clinic.id)}
                                trackColor={{ false: "#767577", true: COLORS.primaryGlow }}
                                thumbColor={clinic.isActive ? COLORS.primary : "#f4f3f4"}
                            />
                        </View>
                    </View>
                ))}

                {/* Smart Billing */}
                <Text style={s.sectionTitle}>Smart Billing & Payments</Text>
                <View style={s.billingCard}>
                    <View style={s.billingHeader}>
                        <View>
                            <Text style={s.billingTitle}>Automated Invoicing</Text>
                            <Text style={s.billingSub}>Auto-generate bills post-consult</Text>
                        </View>
                        <Switch 
                            value={smartBillingEnabled}
                            onValueChange={setSmartBillingEnabled}
                            trackColor={{ false: "#767577", true: "#66BB6A" }}
                        />
                    </View>
                    
                    {smartBillingEnabled && (
                        <View style={s.billingStats}>
                            <View style={s.statBox}>
                                <Text style={s.statVal}>₹12,500</Text>
                                <Text style={s.statLabel}>Today's Revenue</Text>
                            </View>
                            <View style={[s.statBox, { borderLeftWidth: 1, borderLeftColor: COLORS.border }]}>
                                <Text style={[s.statVal, { color: '#EF5350' }]}>₹3,200</Text>
                                <Text style={s.statLabel}>Pending Dues</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Quick Action */}
                <TouchableOpacity style={s.prescriptionBtn}>
                    <Ionicons name="create" size={20} color="#fff" />
                    <Text style={s.prescriptionBtnText}>Write Digital Prescription</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 24, marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
    
    profileCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    qrPlaceholder: { width: 80, height: 80, backgroundColor: COLORS.background, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' },
    qrText: { fontSize: 10, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
    docName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    docSpec: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    waBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#25D36620', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginTop: 10, alignSelf: 'flex-start' },
    waText: { fontSize: 11, color: '#25D366', fontWeight: 'bold' },

    clinicCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    clinicRow: { flexDirection: 'row', alignItems: 'center' },
    clinicIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    clinicName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    clinicRole: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    clinicAppt: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 4 },

    billingCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    billingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    billingTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    billingSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    billingStats: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
    statBox: { flex: 1, paddingLeft: 10 },
    statVal: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

    prescriptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, marginTop: 32 },
    prescriptionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ClinicManagementScreen;
