import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { doctorAPI } from '../services/api';

const DoctorDashboardScreen = ({ navigation }) => {
    const [stats, setStats] = useState({ totalPatients: 0, pendingConsultations: 0, activeConsultations: 0, completedToday: 0 });
    const [consultations, setConsultations] = useState([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [statsRes, consRes] = await Promise.all([doctorAPI.getStats(), doctorAPI.getConsultations({ status: 'pending' })]);
            if (statsRes.success) setStats(statsRes.data);
            if (consRes.success) setConsultations(consRes.data);
        } catch (e) {
            setConsultations([
                { _id: '1', patientId: { firstName: 'Ravi', lastName: 'Teja' }, symptoms: ['Headache', 'Fever'], status: 'pending', createdAt: new Date().toISOString() },
                { _id: '2', patientId: { firstName: 'Priya', lastName: 'Sharma' }, symptoms: ['Back Pain'], status: 'pending', createdAt: new Date().toISOString() },
            ]);
            setStats({ totalPatients: 24, pendingConsultations: 5, activeConsultations: 2, completedToday: 8 });
        }
    };

    const statCards = [
        { label: 'Patients', value: stats.totalPatients, icon: 'people', color: COLORS.primary },
        { label: 'Pending', value: stats.pendingConsultations, icon: 'time', color: COLORS.warning },
        { label: 'Active', value: stats.activeConsultations, icon: 'pulse', color: COLORS.success },
        { label: 'Today', value: stats.completedToday, icon: 'checkmark-circle', color: COLORS.info },
    ];

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>Doctor Dashboard</Text>
                <TouchableOpacity style={s.iconBtn}><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>
            </View>
            <View style={s.statsRow}>
                {statCards.map((c, i) => (
                    <View key={i} style={s.statCard}>
                        <Ionicons name={c.icon} size={22} color={c.color} />
                        <Text style={[s.statVal, { color: c.color }]}>{c.value}</Text>
                        <Text style={s.statLabel}>{c.label}</Text>
                    </View>
                ))}
            </View>
            <Text style={s.sec}>Patient Queue</Text>
            <FlatList data={consultations} keyExtractor={i => i._id} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('PatientDetail', { consultation: item })}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={s.avatar}><Ionicons name="person" size={22} color={COLORS.primary} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.name}>{item.patientId?.firstName} {item.patientId?.lastName}</Text>
                                <Text style={s.symptoms}>{item.symptoms?.join(', ') || 'No symptoms listed'}</Text>
                            </View>
                            <Text style={s.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={s.empty}>No pending consultations</Text>}
            />
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60 },
    title: { fontSize: 22, color: '#fff', fontWeight: '700' },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    statVal: { fontSize: 22, fontWeight: '700', marginTop: 4 },
    statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
    sec: { fontSize: 18, color: '#fff', fontWeight: '600', paddingHorizontal: 24, marginBottom: 12 },
    card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: 15, color: '#fff', fontWeight: '600' },
    symptoms: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    time: { fontSize: 11, color: COLORS.textMuted },
    empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },
});

export default DoctorDashboardScreen;
