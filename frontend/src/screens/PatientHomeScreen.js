import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { patientAPI } from '../services/api';

const PatientHomeScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState({ unreadCount: 0 });

    useEffect(() => {
        loadUser();
        loadNotifications();
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    };

    const loadNotifications = async () => {
        try {
            const res = await patientAPI.getNotifications();
            if (res.success) setNotifications(res.data);
        } catch (e) {
            // Offline mode
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, []);

    const menuItems = [
        {
            id: 'health',
            icon: 'heart',
            title: 'Health Status',
            subtitle: 'Normal',
            color: COLORS.success,
            bgColor: 'rgba(76, 175, 80, 0.15)',
            onPress: () => { },
        },
        {
            id: 'symptoms',
            icon: 'chatbubbles',
            title: 'Check Symptoms',
            subtitle: 'AI Assistant',
            color: COLORS.primary,
            bgColor: COLORS.primaryGlow,
            onPress: () => navigation.navigate('SymptomChecker'),
        },
        {
            id: 'doctor',
            icon: 'person',
            title: 'Consult Doctor',
            subtitle: 'Book now',
            color: COLORS.secondary,
            bgColor: 'rgba(30, 136, 229, 0.15)',
            onPress: () => navigation.navigate('DoctorList'),
        },
        {
            id: 'scan',
            icon: 'scan',
            title: 'Upload Scan',
            subtitle: 'CT / MRI / X-ray',
            color: '#AB47BC',
            bgColor: 'rgba(171, 71, 188, 0.15)',
            onPress: () => navigation.navigate('UploadScan'),
        },
        {
            id: 'reports',
            icon: 'document-text',
            title: 'My Reports',
            subtitle: 'View results',
            color: COLORS.info,
            bgColor: 'rgba(66, 165, 245, 0.15)',
            onPress: () => navigation.navigate('Reports'),
        },
        {
            id: 'pharmacy',
            icon: 'medkit',
            title: 'Order Medicine',
            subtitle: 'Quick refills',
            color: '#26A69A',
            bgColor: 'rgba(38, 166, 154, 0.15)',
            onPress: () => { },
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hi {user?.firstName || 'there'} 👋</Text>
                        <Text style={styles.subGreeting}>How are you feeling today?</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notifButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
                        {notifications.unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{notifications.unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                        <Ionicons name="heart" size={20} color={COLORS.success} />
                        <Text style={styles.statValue}>72</Text>
                        <Text style={styles.statLabel}>Heart Rate</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(66, 165, 245, 0.1)' }]}>
                        <Ionicons name="water" size={20} color={COLORS.info} />
                        <Text style={styles.statValue}>98%</Text>
                        <Text style={styles.statLabel}>SpO2</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(255, 167, 38, 0.1)' }]}>
                        <Ionicons name="thermometer" size={20} color={COLORS.warning} />
                        <Text style={styles.statValue}>36.6°</Text>
                        <Text style={styles.statLabel}>Temp</Text>
                    </View>
                </View>

                {/* Menu grid */}
                <View style={styles.menuGrid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.menuCard} onPress={item.onPress} activeOpacity={0.7}>
                            <View style={[styles.menuIconContainer, { backgroundColor: item.bgColor }]}>
                                <Ionicons name={item.icon} size={28} color={item.color} />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Emergency SOS */}
                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={() => navigation.navigate('Emergency')}
                    activeOpacity={0.8}
                >
                    <View style={styles.sosContent}>
                        <Ionicons name="alert-circle" size={28} color={COLORS.white} />
                        <View>
                            <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
                            <Text style={styles.sosSubtitle}>Tap for immediate help</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.paddingLg,
        paddingTop: 60,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: SIZES.xxl,
        color: COLORS.white,
        ...FONTS.bold,
    },
    subGreeting: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    notifButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: COLORS.danger,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 10,
        color: COLORS.white,
        ...FONTS.bold,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.paddingLg,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 14,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statValue: {
        fontSize: SIZES.xl,
        color: COLORS.white,
        ...FONTS.bold,
        marginTop: 6,
    },
    statLabel: {
        fontSize: SIZES.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SIZES.paddingLg,
        gap: 12,
        marginBottom: 24,
    },
    menuCard: {
        width: '47%',
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    menuIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    menuTitle: {
        fontSize: SIZES.base,
        color: COLORS.white,
        ...FONTS.semiBold,
    },
    menuSubtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    sosButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.danger,
        marginHorizontal: SIZES.paddingLg,
        borderRadius: SIZES.radiusLg,
        padding: 20,
        marginBottom: 100,
    },
    sosContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    sosTitle: {
        fontSize: SIZES.lg,
        color: COLORS.white,
        ...FONTS.bold,
    },
    sosSubtitle: {
        fontSize: SIZES.sm,
        color: 'rgba(255,255,255,0.8)',
    },
});

export default PatientHomeScreen;
