import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    TextInput, ActivityIndicator, Modal, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const SPECIALISTS = [
    {
        id: '1', name: 'Dr. Sarah Wilson', specialization: 'Neuroradiology',
        rating: 4.9, reviews: 284, fee: 45, tat: '2–4 hrs',
        badge: 'Top Rated', languages: ['English', 'Hindi'],
        bio: '15 years experience in neurovascular imaging and brain tumor analysis.',
        modalities: ['CT', 'MRI'], available: true, avatar: 'SW',
    },
    {
        id: '2', name: 'Dr. James Chen', specialization: 'Cardiothoracic',
        rating: 4.8, reviews: 192, fee: 60, tat: '1–3 hrs',
        badge: 'Emergency', languages: ['English'],
        bio: 'Expert in cardiac CT, pulmonary embolism and thoracic trauma imaging.',
        modalities: ['CT', 'XRAY'], available: true, avatar: 'JC',
    },
    {
        id: '3', name: 'Dr. Priya Verma', specialization: 'Musculoskeletal',
        rating: 5.0, reviews: 319, fee: 35, tat: '4–6 hrs',
        badge: 'Certified', languages: ['English', 'Telugu', 'Tamil'],
        bio: 'Specialises in joint, sports and trauma MRI reporting across all age groups.',
        modalities: ['MRI', 'XRAY'], available: true, avatar: 'PV',
    },
    {
        id: '4', name: 'Dr. Arjun Mehta', specialization: 'Abdominal Radiology',
        rating: 4.7, reviews: 148, fee: 50, tat: '3–5 hrs',
        badge: 'Certified', languages: ['English', 'Hindi', 'Gujarati'],
        bio: 'Focussed on liver, pancreas, and oncology CT/MRI interpretation.',
        modalities: ['CT', 'MRI'], available: false, avatar: 'AM',
    },
    {
        id: '5', name: 'Dr. Aiko Tanaka', specialization: 'Paediatric Radiology',
        rating: 4.9, reviews: 207, fee: 55, tat: '2–4 hrs',
        badge: 'Top Rated', languages: ['English', 'Japanese'],
        bio: 'Specialist in paediatric CT, MRI and X-ray reporting. Low-dose protocol expert.',
        modalities: ['CT', 'MRI', 'XRAY'], available: true, avatar: 'AT',
    },
];

const SPECIALTIES = ['All', 'Neuro', 'Cardio', 'MSK', 'Abdominal', 'Paediatric', 'Emergency AI'];

const getBadgeColor = (badge) => ({
    'Top Rated': '#FFB300',
    'Emergency': COLORS.danger,
    'Certified': COLORS.primary,
}[badge] || COLORS.textMuted);

const MarketplaceScreen = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [activeSpecialty, setActiveSpecialty] = useState('All');
    const [selected, setSelected] = useState(null);
    const [requesting, setRequesting] = useState(false);
    const [walletCredits] = useState(1250);

    const filtered = SPECIALISTS.filter(d =>
        (activeSpecialty === 'All' || d.specialization.toLowerCase().includes(activeSpecialty.toLowerCase())) &&
        (d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase()))
    );

    const handleRequest = async () => {
        setRequesting(true);
        setTimeout(() => {
            setRequesting(false);
            setSelected(null);
            navigation.navigate('PatientHome');
        }, 2000);
    };

    const renderSpecialist = ({ item }) => (
        <TouchableOpacity style={[s.card, !item.available && s.cardDisabled]} onPress={() => item.available && setSelected(item)}>
            <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: COLORS.primaryGlow }]}>
                    <Text style={s.avatarTxt}>{item.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={s.nameRow}>
                        <Text style={s.name}>{item.name}</Text>
                        {!item.available && <View style={s.unavailBadge}><Text style={s.unavailTxt}>Offline</Text></View>}
                    </View>
                    <Text style={s.spec}>{item.specialization}</Text>
                    <View style={s.badgeRow}>
                        <View style={[s.badge, { backgroundColor: getBadgeColor(item.badge) + '20' }]}>
                            <Text style={[s.badgeTxt, { color: getBadgeColor(item.badge) }]}>{item.badge}</Text>
                        </View>
                        <View style={s.ratingRow}>
                            <Ionicons name="star" size={11} color="#FFB300" />
                            <Text style={s.rating}>{item.rating} ({item.reviews})</Text>
                        </View>
                    </View>
                </View>
            </View>

            <Text style={s.bio} numberOfLines={2}>{item.bio}</Text>

            <View style={s.cardBottom}>
                <View style={s.modalRow}>
                    {item.modalities.map(m => (
                        <View key={m} style={s.modBadge}><Text style={s.modTxt}>{m}</Text></View>
                    ))}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.fee}>₹{item.fee} Credits</Text>
                    <Text style={s.tat}>{item.tat} TAT</Text>
                </View>
            </View>

            {item.available && (
                <TouchableOpacity style={s.reqBtn} onPress={() => setSelected(item)}>
                    <Ionicons name="paper-plane" size={14} color="#fff" />
                    <Text style={s.reqTxt}>Request Opinion</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.title}>Marketplace</Text>
                    <Text style={s.subtitle}>Verified Radiology Specialists</Text>
                </View>
                <View style={s.walletBadge}>
                    <Ionicons name="wallet" size={14} color={COLORS.primary} />
                    <Text style={s.walletTxt}>₹{walletCredits.toLocaleString()}</Text>
                </View>
            </View>

            {/* Search */}
            <View style={s.searchBar}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} />
                <TextInput
                    style={s.searchInput}
                    placeholder="Search specialist or condition..."
                    placeholderTextColor={COLORS.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Specialty Chips */}
            <FlatList
                horizontal data={SPECIALTIES} keyExtractor={i => i}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 8, marginBottom: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[s.chip, activeSpecialty === item && s.chipActive]}
                        onPress={() => setActiveSpecialty(item)}
                    >
                        <Text style={[s.chipTxt, activeSpecialty === item && { color: '#fff' }]}>{item}</Text>
                    </TouchableOpacity>
                )}
            />

            <FlatList
                data={filtered}
                keyExtractor={i => i.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                renderItem={renderSpecialist}
                ListEmptyComponent={<Text style={s.empty}>No specialists found</Text>}
            />

            {/* Second Opinion Modal */}
            <Modal visible={!!selected} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <TouchableOpacity style={s.modalClose} onPress={() => setSelected(null)}>
                            <Ionicons name="close" size={22} color={COLORS.textMuted} />
                        </TouchableOpacity>

                        <View style={[s.avatar, { alignSelf: 'center', marginBottom: 12, backgroundColor: COLORS.primaryGlow }]}>
                            <Text style={[s.avatarTxt, { fontSize: 22 }]}>{selected?.avatar}</Text>
                        </View>
                        <Text style={[s.name, { textAlign: 'center', fontSize: 18 }]}>{selected?.name}</Text>
                        <Text style={[s.spec, { textAlign: 'center', marginBottom: 20 }]}>{selected?.specialization}</Text>

                        <View style={s.modalInfoRow}>
                            <View style={s.modalInfoItem}>
                                <Ionicons name="star" size={16} color="#FFB300" />
                                <Text style={s.modalInfoVal}>{selected?.rating}</Text>
                                <Text style={s.modalInfoLabel}>Rating</Text>
                            </View>
                            <View style={s.modalInfoItem}>
                                <Ionicons name="timer" size={16} color={COLORS.primary} />
                                <Text style={s.modalInfoVal}>{selected?.tat}</Text>
                                <Text style={s.modalInfoLabel}>TAT</Text>
                            </View>
                            <View style={s.modalInfoItem}>
                                <Ionicons name="wallet" size={16} color={COLORS.warning} />
                                <Text style={[s.modalInfoVal, { color: COLORS.warning }]}>₹{selected?.fee}</Text>
                                <Text style={s.modalInfoLabel}>Credits</Text>
                            </View>
                        </View>

                        <View style={s.creditWarning}>
                            <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                            <Text style={s.creditTxt}>
                                ₹{selected?.fee} credits will be deducted from your wallet (Balance: ₹{walletCredits})
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[s.confirmBtn, requesting && { opacity: 0.7 }]}
                            onPress={handleRequest}
                            disabled={requesting}
                        >
                            {requesting
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Ionicons name="paper-plane" size={18} color="#fff" />
                                    <Text style={s.confirmTxt}>Confirm & Send Case</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingTop: 60 },
    title: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },
    subtitle: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2 },
    walletBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primary + '40', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    walletTxt: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.bold },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 24, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 12 },
    searchInput: { flex: 1, fontSize: SIZES.md, color: '#fff' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipTxt: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium },
    card: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
    cardDisabled: { opacity: 0.5 },
    cardTop: { flexDirection: 'row', gap: 14, marginBottom: 10 },
    avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary + '40' },
    avatarTxt: { fontSize: 16, color: COLORS.primary, ...FONTS.bold },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    name: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    spec: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 6 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeTxt: { fontSize: 10, ...FONTS.bold },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    rating: { fontSize: 11, color: COLORS.textMuted },
    unavailBadge: { backgroundColor: COLORS.border, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    unavailTxt: { fontSize: 9, color: COLORS.textMuted, ...FONTS.bold },
    bio: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 12 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
    modalRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    modBadge: { backgroundColor: COLORS.primaryGlow, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    modTxt: { fontSize: 10, color: COLORS.primary, ...FONTS.bold },
    fee: { fontSize: SIZES.lg, color: COLORS.warning, ...FONTS.bold },
    tat: { fontSize: 10, color: COLORS.textMuted },
    reqBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 12 },
    reqTxt: { fontSize: SIZES.sm, color: '#fff', ...FONTS.bold },
    empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: 60, fontSize: SIZES.base },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 },
    modalClose: { alignSelf: 'flex-end', marginBottom: 8 },
    modalInfoRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 16, marginBottom: 16 },
    modalInfoItem: { alignItems: 'center', gap: 4 },
    modalInfoVal: { fontSize: SIZES.md, color: '#fff', ...FONTS.bold },
    modalInfoLabel: { fontSize: 10, color: COLORS.textMuted },
    creditWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.primaryGlow, borderRadius: SIZES.radius, padding: 12, marginBottom: 20 },
    creditTxt: { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },
    confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusLg, paddingVertical: 16 },
    confirmTxt: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
});

export default MarketplaceScreen;
