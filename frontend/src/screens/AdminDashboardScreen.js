import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import api from '../services/api';

const BACKEND = __DEV__ ? 'http://localhost:5000' : 'https://careconnect-iota-five.vercel.app';

const STATS_MOCK = {
    totalUsers: 1248,
    totalScans: 3892,
    totalConsultations: 7234,
    revenue: 1842600,
    activePatients: 342,
    activeDoctors: 28,
    activeRadiologists: 12,
    pendingScans: 47,
    emergencyAlerts: 3,
    systemUptime: '99.98%',
};

const USERS_MOCK = [
    { _id: '1', firstName: 'Ravi', lastName: 'Teja', email: 'ravi@careconnect.com', role: 'patient', isActive: true, createdAt: '2026-04-01' },
    { _id: '2', firstName: 'Raj', lastName: 'Sharma', email: 'dr.raj@careconnect.com', role: 'doctor', isActive: true, createdAt: '2026-03-15' },
    { _id: '3', firstName: 'Meera', lastName: 'Reddy', email: 'dr.meera@careconnect.com', role: 'radiologist', isActive: true, createdAt: '2026-03-20' },
    { _id: '4', firstName: 'Arjun', lastName: 'Tech', email: 'tech1@careconnect.com', role: 'lab_tech', isActive: true, createdAt: '2026-04-10' },
    { _id: '5', firstName: 'Priya', lastName: 'Sharma', email: 'priya@careconnect.com', role: 'patient', isActive: false, createdAt: '2026-02-20' },
];

const roleColors = {
    patient: '#42A5F5',
    doctor: '#66BB6A',
    radiologist: '#AB47BC',
    lab_tech: '#FFA726',
    admin: '#EF5350',
};

const AdminDashboardScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(STATS_MOCK);
    const [users, setUsers] = useState(USERS_MOCK);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await api.get('/dashboard/stats');
            if (res.success) setStats(res.data);
        } catch (_) {}
        setRefreshing(false);
    };

    const toggleUserStatus = (userId) => {
        Alert.alert('Confirm', 'Toggle user active status?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm', onPress: () => {
                    setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
                }
            },
        ]);
    };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: 'grid' },
        { key: 'users', label: 'Users', icon: 'people' },
        { key: 'system', label: 'System', icon: 'server' },
    ];

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: 'people', color: '#42A5F5' },
        { label: 'Total Scans', value: stats.totalScans.toLocaleString(), icon: 'scan', color: '#AB47BC' },
        { label: 'Consultations', value: stats.totalConsultations.toLocaleString(), icon: 'chatbubbles', color: '#66BB6A' },
        { label: 'Revenue (₹)', value: `₹${(stats.revenue / 100000).toFixed(1)}L`, icon: 'card', color: '#FFA726' },
        { label: 'Active Patients', value: stats.activePatients, icon: 'person', color: '#26A69A' },
        { label: 'Active Doctors', value: stats.activeDoctors, icon: 'medical', color: '#EC407A' },
        { label: 'Pending Scans', value: stats.pendingScans, icon: 'time', color: '#EF5350' },
        { label: 'System Uptime', value: stats.systemUptime, icon: 'pulse', color: '#66BB6A' },
    ];

    const systemItems = [
        { label: 'MongoDB Atlas', status: 'Connected', icon: 'server', color: '#66BB6A' },
        { label: 'Vercel Serverless', status: 'Healthy', icon: 'cloud', color: '#66BB6A' },
        { label: 'DICOM Storage', status: 'Active', icon: 'folder', color: '#66BB6A' },
        { label: 'AI Service', status: 'Offline (local)', icon: 'hardware-chip', color: '#FFA726' },
        { label: 'Razorpay Gateway', status: 'Test Mode', icon: 'card', color: '#FFA726' },
        { label: 'ABDM/ABHA', status: 'Sandbox', icon: 'shield-checkmark', color: '#42A5F5' },
        { label: 'Socket.IO', status: 'Dev Only', icon: 'radio', color: '#AB47BC' },
        { label: 'Emergency Alerts', value: `${stats.emergencyAlerts} Active`, icon: 'warning', color: '#EF5350' },
    ];

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Admin Dashboard</Text>
                    <Text style={s.sub}>CareConnect Healthcare OS</Text>
                </View>
                <View style={s.badge}>
                    <Ionicons name="shield-checkmark" size={16} color="#fff" />
                    <Text style={s.badgeText}>ADMIN</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
                {tabs.map(t => (
                    <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
                        <Ionicons name={t.icon} size={16} color={activeTab === t.key ? '#fff' : COLORS.textMuted} />
                        <Text style={[s.tabLabel, activeTab === t.key && s.tabLabelActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <>
                        <Text style={s.sectionTitle}>📊 Platform Statistics</Text>
                        <View style={s.statsGrid}>
                            {statCards.map((card, i) => (
                                <View key={i} style={[s.statCard, { borderLeftColor: card.color }]}>
                                    <View style={[s.statIcon, { backgroundColor: card.color + '20' }]}>
                                        <Ionicons name={card.icon} size={20} color={card.color} />
                                    </View>
                                    <Text style={s.statValue}>{card.value}</Text>
                                    <Text style={s.statLabel}>{card.label}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={s.sectionTitle}>🔔 Emergency Alerts</Text>
                        {[
                            { id: 'E001', patient: 'Ravi Teja', type: 'Cardiac Event', location: 'Hyderabad', time: '2m ago', severity: 'critical' },
                            { id: 'E002', patient: 'Priya Sharma', type: 'Fall Detected', location: 'Mumbai', time: '15m ago', severity: 'high' },
                            { id: 'E003', patient: 'Arjun Kumar', type: 'Breathing Difficulty', location: 'Delhi', time: '32m ago', severity: 'medium' },
                        ].map(alert => (
                            <View key={alert.id} style={s.alertCard}>
                                <View style={[s.alertDot, { backgroundColor: alert.severity === 'critical' ? '#EF5350' : alert.severity === 'high' ? '#FFA726' : '#FDD835' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.alertPatient}>{alert.patient} — {alert.type}</Text>
                                    <Text style={s.alertMeta}>{alert.location} · {alert.time}</Text>
                                </View>
                                <TouchableOpacity style={s.resolveBtn}>
                                    <Text style={s.resolveBtnText}>Resolve</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <>
                        <Text style={s.sectionTitle}>👥 User Management</Text>
                        <View style={s.roleStats}>
                            {Object.entries(roleColors).map(([role, color]) => (
                                <View key={role} style={[s.roleChip, { backgroundColor: color + '20', borderColor: color }]}>
                                    <Text style={[s.roleChipText, { color }]}>{role.replace('_', ' ').toUpperCase()}</Text>
                                </View>
                            ))}
                        </View>
                        {users.map(user => (
                            <View key={user._id} style={s.userCard}>
                                <View style={[s.userAvatar, { backgroundColor: (roleColors[user.role] || '#888') + '30' }]}>
                                    <Text style={[s.userAvatarText, { color: roleColors[user.role] || '#888' }]}>
                                        {user.firstName[0]}{user.lastName[0]}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.userName}>{user.firstName} {user.lastName}</Text>
                                    <Text style={s.userEmail}>{user.email}</Text>
                                    <View style={[s.rolePill, { backgroundColor: (roleColors[user.role] || '#888') + '20' }]}>
                                        <Text style={[s.rolePillText, { color: roleColors[user.role] || '#888' }]}>
                                            {user.role.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[s.toggleBtn, { backgroundColor: user.isActive ? '#66BB6A20' : '#EF535020' }]}
                                    onPress={() => toggleUserStatus(user._id)}
                                >
                                    <Ionicons name={user.isActive ? 'checkmark-circle' : 'close-circle'} size={20} color={user.isActive ? '#66BB6A' : '#EF5350'} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                )}

                {/* SYSTEM TAB */}
                {activeTab === 'system' && (
                    <>
                        <Text style={s.sectionTitle}>🖥️ System Health</Text>
                        {systemItems.map((item, i) => (
                            <View key={i} style={s.systemRow}>
                                <View style={[s.systemIcon, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon} size={18} color={item.color} />
                                </View>
                                <Text style={s.systemLabel}>{item.label}</Text>
                                <View style={[s.systemStatus, { backgroundColor: item.color + '20' }]}>
                                    <Text style={[s.systemStatusText, { color: item.color }]}>{item.status || item.value}</Text>
                                </View>
                            </View>
                        ))}

                        <Text style={s.sectionTitle}>⚡ Quick Actions</Text>
                        {[
                            { label: 'Re-seed Database', icon: 'refresh', color: '#42A5F5', action: () => Alert.alert('Info', 'Run: node backend/src/scripts/seed.js') },
                            { label: 'Deploy to Vercel', icon: 'cloud-upload', color: '#66BB6A', action: () => Alert.alert('Info', 'Run: npx vercel --prod --yes') },
                            { label: 'View MongoDB Atlas', icon: 'server', color: '#FFA726', action: () => Alert.alert('Info', 'Open: cloud.mongodb.com') },
                            { label: 'GitHub Repository', icon: 'logo-github', color: '#AB47BC', action: () => Alert.alert('Info', 'github.com/raviteja2104-star/careconnect-ai-radiology') },
                        ].map((action, i) => (
                            <TouchableOpacity key={i} style={s.actionRow} onPress={action.action}>
                                <View style={[s.actionIcon, { backgroundColor: action.color + '20' }]}>
                                    <Ionicons name={action.icon} size={18} color={action.color} />
                                </View>
                                <Text style={s.actionLabel}>{action.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF5350', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 12, gap: 8, paddingVertical: 8 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
    tabActive: { backgroundColor: COLORS.primary },
    tabLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
    tabLabelActive: { color: '#fff' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderLeftWidth: 3, gap: 6 },
    statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
    alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 10 },
    alertDot: { width: 10, height: 10, borderRadius: 5 },
    alertPatient: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    alertMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    resolveBtn: { backgroundColor: '#66BB6A20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    resolveBtnText: { color: '#66BB6A', fontSize: 12, fontWeight: '600' },
    roleStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    roleChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    roleChipText: { fontSize: 10, fontWeight: '700' },
    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    userAvatarText: { fontSize: 16, fontWeight: '700' },
    userName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    userEmail: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    rolePill: { marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    rolePillText: { fontSize: 10, fontWeight: '600' },
    toggleBtn: { padding: 8, borderRadius: 10 },
    systemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
    systemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    systemLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
    systemStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    systemStatusText: { fontSize: 11, fontWeight: '600' },
    actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
    actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
});

export default AdminDashboardScreen;
