import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Image, TextInput, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';

const CATEGORIES = [
    { id: '1', name: '2nd Opinion', icon: 'people' },
    { id: '2', name: 'Health Packages', icon: 'medkit' },
    { id: '3', name: 'Specialists', icon: 'stethoscope' },
    { id: '4', name: 'Home Care', icon: 'home' },
];

const DOCTORS = [
    { id: 'D1', name: 'Dr. Anita Desai', spec: 'Senior Cardiologist', exp: '15+ Years Exp', rating: 4.9, img: 'https://randomuser.me/api/portraits/women/44.jpg', fee: 1500 },
    { id: 'D2', name: 'Dr. Vikram Singh', spec: 'Neurologist', exp: '12+ Years Exp', rating: 4.8, img: 'https://randomuser.me/api/portraits/men/32.jpg', fee: 1800 },
];

const PACKAGES = [
    { id: 'P1', name: 'Comprehensive Full Body Checkup', tests: 64, originalPrice: 4000, price: 1999, tag: 'Bestseller' },
    { id: 'P2', name: 'Advanced Cardiac Risk Profile', tests: 18, originalPrice: 3500, price: 1499, tag: 'Trending' },
];

const MarketplaceScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>CareConnect Marketplace</Text>
                    <Text style={s.sub}>Find the best care, instantly.</Text>
                </View>
                <TouchableOpacity style={s.cartBtn}>
                    <Ionicons name="cart-outline" size={24} color={COLORS.text} />
                    <View style={s.cartBadge}><Text style={s.cartBadgeText}>2</Text></View>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* Search */}
                <View style={s.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textMuted} />
                    <TextInput 
                        style={s.searchInput}
                        placeholder="Search doctors, tests, packages..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity style={s.filterBtn}>
                        <Ionicons name="options" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Promo Banner */}
                <View style={s.promoBanner}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.promoTitle}>Get a 2nd Opinion from Top Global Experts</Text>
                        <Text style={s.promoSub}>Upload your scans and get an AI + Expert review within 24hrs.</Text>
                        <TouchableOpacity style={s.promoBtn}>
                            <Text style={s.promoBtnText}>Book Now</Text>
                        </TouchableOpacity>
                    </View>
                    <Ionicons name="earth" size={60} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: -10, bottom: -10 }} />
                </View>

                {/* Categories */}
                <View style={s.categoriesContainer}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity key={cat.id} style={s.catBox}>
                            <View style={s.catIconBox}>
                                <Ionicons name={cat.icon} size={24} color={COLORS.primary} />
                            </View>
                            <Text style={s.catText}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Top Specialists */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Top Specialists</Text>
                    <TouchableOpacity><Text style={s.seeAll}>See All</Text></TouchableOpacity>
                </View>
                
                <FlatList 
                    data={DOCTORS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                    renderItem={({ item }) => (
                        <View style={s.docCard}>
                            <Image source={{ uri: item.img }} style={s.docImg} />
                            <View style={s.docInfo}>
                                <Text style={s.docName}>{item.name}</Text>
                                <Text style={s.docSpec}>{item.spec}</Text>
                                <View style={s.docRow}>
                                    <Ionicons name="star" size={12} color="#FFA726" />
                                    <Text style={s.docRating}>{item.rating}</Text>
                                    <Text style={s.docExp}> • {item.exp}</Text>
                                </View>
                                <TouchableOpacity style={s.bookDocBtn}>
                                    <Text style={s.bookDocText}>Consult ₹{item.fee}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />

                {/* Health Packages */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Curated Health Packages</Text>
                    <TouchableOpacity><Text style={s.seeAll}>See All</Text></TouchableOpacity>
                </View>

                {PACKAGES.map(pkg => (
                    <View key={pkg.id} style={s.pkgCard}>
                        <View style={s.pkgTag}><Text style={s.pkgTagText}>{pkg.tag}</Text></View>
                        <Text style={s.pkgName}>{pkg.name}</Text>
                        <Text style={s.pkgTests}>Includes {pkg.tests} parameters</Text>
                        <View style={s.pkgRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={s.pkgPrice}>₹{pkg.price}</Text>
                                <Text style={s.pkgOriginal}>₹{pkg.originalPrice}</Text>
                            </View>
                            <TouchableOpacity style={s.addBtn}>
                                <Text style={s.addBtnText}>Add to Cart</Text>
                            </TouchableOpacity>
                        </View>
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
    sub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    cartBtn: { position: 'relative', padding: 8 },
    cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF5350', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: COLORS.card, borderRadius: 12, paddingLeft: 12, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, height: 48, marginLeft: 8, color: COLORS.text, fontSize: 14 },
    filterBtn: { backgroundColor: COLORS.primary, padding: 14, borderTopRightRadius: 12, borderBottomRightRadius: 12 },

    promoBanner: { marginHorizontal: 16, marginBottom: 24, padding: 20, backgroundColor: '#6C63FF', borderRadius: 16, overflow: 'hidden' },
    promoTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8, width: '80%' },
    promoSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16, width: '90%' },
    promoBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    promoBtnText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 13 },

    categoriesContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 24 },
    catBox: { alignItems: 'center', width: '22%' },
    catIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    catText: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    seeAll: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

    docCard: { width: 260, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
    docImg: { width: '100%', height: 140, backgroundColor: '#f0f0f0' },
    docInfo: { padding: 16 },
    docName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    docSpec: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    docRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 16 },
    docRating: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginLeft: 4 },
    docExp: { fontSize: 12, color: COLORS.textMuted },
    bookDocBtn: { width: '100%', backgroundColor: COLORS.primary + '15', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    bookDocText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },

    pkgCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    pkgTag: { position: 'absolute', top: -10, left: 16, backgroundColor: '#FFA726', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    pkgTagText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
    pkgName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
    pkgTests: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 16 },
    pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pkgPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    pkgOriginal: { fontSize: 14, color: COLORS.textMuted, textDecorationLine: 'line-through', marginLeft: 8 },
    addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});

export default MarketplaceScreen;
