import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

const MOCK_APPOINTMENTS = [
    { id: '1', doc: 'Dr. Raj Sharma', spec: 'General Physician', time: '10:30 AM, Today', type: 'Video Consult', status: 'upcoming', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: '2', doc: 'Dr. Anita Desai', spec: 'Cardiologist', time: '04:00 PM, Tomorrow', type: 'In-Clinic', status: 'upcoming', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: '3', doc: 'Dr. Vikram Singh', spec: 'Neurologist', time: '11:00 AM, May 2', type: 'Video Consult', status: 'completed', img: 'https://randomuser.me/api/portraits/men/45.jpg' },
];

const VideoConsultationScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('upcoming');

    const filtered = MOCK_APPOINTMENTS.filter(a => a.status === activeTab);

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <Text style={s.headerTitle}>My Consultations</Text>
                <TouchableOpacity style={s.addBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={s.addBtnText}>Book New</Text>
                </TouchableOpacity>
            </View>

            <View style={s.tabs}>
                <TouchableOpacity style={[s.tab, activeTab === 'upcoming' && s.activeTab]} onPress={() => setActiveTab('upcoming')}>
                    <Text style={[s.tabText, activeTab === 'upcoming' && s.activeTabText]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.tab, activeTab === 'completed' && s.activeTab]} onPress={() => setActiveTab('completed')}>
                    <Text style={[s.tabText, activeTab === 'completed' && s.activeTabText]}>Completed</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.scroll}>
                {filtered.map(apt => (
                    <View key={apt.id} style={s.card}>
                        <View style={s.cardTop}>
                            <Image source={{uri: apt.img}} style={s.docImg} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={s.docName}>{apt.doc}</Text>
                                <Text style={s.docSpec}>{apt.spec}</Text>
                                <View style={s.typeBox}>
                                    <Ionicons name={apt.type === 'Video Consult' ? 'videocam' : 'business'} size={12} color={COLORS.primary} />
                                    <Text style={s.typeText}>{apt.type}</Text>
                                </View>
                            </View>
                            <View style={s.timeBox}>
                                <Text style={s.timeText}>{apt.time.split(',')[0]}</Text>
                                <Text style={s.dateText}>{apt.time.split(',')[1]}</Text>
                            </View>
                        </View>

                        {apt.status === 'upcoming' ? (
                            <View style={s.actionRow}>
                                <TouchableOpacity style={s.cancelBtn}>
                                    <Text style={s.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.joinBtn, apt.type === 'In-Clinic' && {backgroundColor: '#FFA726'}]}>
                                    <Ionicons name={apt.type === 'Video Consult' ? "videocam" : "navigate"} size={16} color="#fff" />
                                    <Text style={s.joinText}>{apt.type === 'Video Consult' ? 'Join Call' : 'Get Directions'}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={s.actionRow}>
                                <TouchableOpacity style={s.cancelBtn}>
                                    <Text style={[s.cancelText, { color: COLORS.primary }]}>View Prescription</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.joinBtn}>
                                    <Text style={s.joinText}>Book Again</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
                
                {filtered.length === 0 && (
                    <Text style={s.emptyText}>No {activeTab} consultations found.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    addBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
    tabs: { flexDirection: 'row', margin: 16, backgroundColor: COLORS.card, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: COLORS.border },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 6 },
    activeTab: { backgroundColor: COLORS.primary + '15' },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
    activeTabText: { color: COLORS.primary },
    scroll: { padding: 16 },
    
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    cardTop: { flexDirection: 'row', marginBottom: 16 },
    docImg: { width: 50, height: 50, borderRadius: 25 },
    docName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    docSpec: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    typeBox: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: COLORS.primary + '10', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    typeText: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginLeft: 4 },
    timeBox: { alignItems: 'flex-end' },
    timeText: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
    dateText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    
    actionRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
    cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.background },
    cancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
    joinBtn: { flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.primary },
    joinText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
    emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted }
});

export default VideoConsultationScreen;
