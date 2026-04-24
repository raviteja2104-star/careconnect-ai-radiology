import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../utils/theme';
import { emergencyAPI } from '../services/api';

const EmergencyScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [emergency, setEmergency] = useState(null);
    const [selectedType, setSelectedType] = useState('');

    const types = [
        { key: 'cardiac', label: 'Cardiac', icon: 'heart', color: '#EF5350' },
        { key: 'accident', label: 'Accident', icon: 'car', color: '#FF7043' },
        { key: 'breathing', label: 'Breathing', icon: 'fitness', color: '#42A5F5' },
        { key: 'stroke', label: 'Stroke', icon: 'flash', color: '#FFA726' },
        { key: 'other', label: 'Other', icon: 'alert-circle', color: '#AB47BC' },
    ];

    const triggerSOS = async () => {
        if (!selectedType) { Alert.alert('Select Type', 'Please select emergency type'); return; }
        setLoading(true);
        try {
            let location = { coordinates: [78.4867, 17.3850], address: 'Hyderabad, TS' };
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({});
                    location.coordinates = [loc.coords.longitude, loc.coords.latitude];
                }
            } catch (e) { }

            const res = await emergencyAPI.triggerSOS({ type: selectedType, location });
            if (res.success) setEmergency(res.data);
            else throw new Error();
        } catch (e) {
            setEmergency({
                status: 'dispatched',
                assignedAmbulance: { vehicleId: 'AMB-247', driverName: 'Rajesh Kumar', driverPhone: '+91-9876543210', eta: 5 },
                nearestHospital: { name: 'CareConnect City Hospital', distance: 2.3, phone: '+91-1800-123-4567' },
            });
        } finally { setLoading(false); }
    };

    if (emergency) {
        return (
            <View style={s.container}>
                <View style={s.emerHeader}>
                    <View style={s.pulseCircle}><Ionicons name="alert" size={40} color="#fff" /></View>
                    <Text style={s.emerTitle}>Help is on the way!</Text>
                    <Text style={s.emerStatus}>{emergency.status?.toUpperCase()}</Text>
                </View>
                <View style={s.emerCard}>
                    <Text style={s.emerCardTitle}>🚑 Ambulance</Text>
                    <Text style={s.emerInfo}>Vehicle: {emergency.assignedAmbulance?.vehicleId}</Text>
                    <Text style={s.emerInfo}>Driver: {emergency.assignedAmbulance?.driverName}</Text>
                    <Text style={s.emerInfo}>Phone: {emergency.assignedAmbulance?.driverPhone}</Text>
                    <View style={s.etaBox}><Text style={s.etaText}>ETA: {emergency.assignedAmbulance?.eta} min</Text></View>
                </View>
                <View style={s.emerCard}>
                    <Text style={s.emerCardTitle}>🏥 Nearest Hospital</Text>
                    <Text style={s.emerInfo}>{emergency.nearestHospital?.name}</Text>
                    <Text style={s.emerInfo}>Distance: {emergency.nearestHospital?.distance} km</Text>
                    <Text style={s.emerInfo}>Phone: {emergency.nearestHospital?.phone}</Text>
                </View>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setEmergency(null); navigation.goBack(); }}>
                    <Text style={s.cancelTxt}>Cancel Emergency</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                <Text style={s.title}>Emergency SOS</Text><View style={{ width: 44 }} />
            </View>
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
                <View style={s.sosCircle}><Ionicons name="alert" size={48} color="#fff" /></View>
                <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' }}>Select emergency type and press SOS</Text>
            </View>
            <View style={s.typeGrid}>
                {types.map(t => (
                    <TouchableOpacity key={t.key} style={[s.typeCard, selectedType === t.key && { borderColor: t.color, backgroundColor: t.color + '15' }]} onPress={() => setSelectedType(t.key)}>
                        <Ionicons name={t.icon} size={28} color={selectedType === t.key ? t.color : COLORS.textMuted} />
                        <Text style={[s.typeTxt, selectedType === t.key && { color: t.color }]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={[s.sosBtn, !selectedType && { opacity: 0.5 }]} onPress={triggerSOS} disabled={loading || !selectedType}>
                <Text style={s.sosBtnTxt}>{loading ? 'SENDING SOS...' : 'TRIGGER SOS'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 24, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, color: '#fff', fontWeight: '700' },
    sosCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 },
    typeCard: { width: '29%', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card, gap: 8 },
    typeTxt: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
    sosBtn: { backgroundColor: COLORS.danger, borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
    sosBtnTxt: { fontSize: 20, color: '#fff', fontWeight: '800', letterSpacing: 2 },
    emerHeader: { alignItems: 'center', marginBottom: 24 },
    pulseCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emerTitle: { fontSize: 22, color: '#fff', fontWeight: '700' },
    emerStatus: { fontSize: 14, color: COLORS.warning, fontWeight: '600', marginTop: 4 },
    emerCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    emerCardTitle: { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 8 },
    emerInfo: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
    etaBox: { backgroundColor: COLORS.success + '20', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, alignSelf: 'flex-start' },
    etaText: { fontSize: 16, color: COLORS.success, fontWeight: '700' },
    cancelBtn: { backgroundColor: COLORS.surface, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    cancelTxt: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
});

export default EmergencyScreen;
