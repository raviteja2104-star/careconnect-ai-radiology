import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Image, TextInput, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

const TOP_TESTS = [
    { id: 'T1', name: 'Complete Blood Count (CBC)', price: 400, original: 550, tat: '12 hrs' },
    { id: 'T2', name: 'Lipid Profile', price: 600, original: 800, tat: '24 hrs' },
    { id: 'T3', name: 'Thyroid Panel (T3, T4, TSH)', price: 800, original: 1000, tat: '24 hrs' },
    { id: 'T4', name: 'HbA1c (Diabetes)', price: 500, original: 650, tat: '12 hrs' },
];

const PACKAGES = [
    { id: 'P1', name: 'Comprehensive Full Body Checkup', tests: 64, originalPrice: 4000, price: 1999, tag: 'Bestseller', image: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png' },
    { id: 'P2', name: 'Advanced Cardiac Risk Profile', tests: 18, originalPrice: 3500, price: 1499, tag: 'Trending', image: 'https://cdn-icons-png.flaticon.com/512/2966/2966453.png' },
];

const CATEGORIES = [
    { id: 'c1', name: 'Fever', icon: 'thermometer' },
    { id: 'c2', name: 'Diabetes', icon: 'water' },
    { id: 'c3', name: 'Heart', icon: 'heart' },
    { id: 'c4', name: 'Women', icon: 'woman' },
];

const LabHomeScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={s.greeting}>Diagnostics & Tests</Text>
                    <Text style={s.sub}>NABL Accredited Labs</Text>
                </View>
                <TouchableOpacity style={s.cartBtn} onPress={() => navigation.navigate('LabCart')}>
                    <Ionicons name="cart-outline" size={24} color={COLORS.text} />
                    <View style={s.cartBadge}><Text style={s.cartBadgeText}>0</Text></View>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* Search */}
                <View style={s.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textMuted} />
                    <TextInput 
                        style={s.searchInput}
                        placeholder="Search for tests, packages, or conditions..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Promo Banner */}
                <View style={s.promoBanner}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.promoTitle}>Free Home Sample Collection</Text>
                        <Text style={s.promoSub}>On all orders above ₹999. Get accurate reports within 24 hours.</Text>
                        <TouchableOpacity style={s.promoBtn}>
                            <Text style={s.promoBtnText}>Upload Prescription</Text>
                        </TouchableOpacity>
                    </View>
                    <Ionicons name="bicycle" size={60} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: 0, bottom: -10 }} />
                </View>

                {/* Categories */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Browse by Condition</Text>
                </View>
                <View style={s.categoriesContainer}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity key={cat.id} style={s.catBox} onPress={() => navigation.navigate('LabTestCatalog')}>
                            <View style={s.catIconBox}>
                                <Ionicons name={cat.icon} size={24} color={COLORS.primary} />
                            </View>
                            <Text style={s.catText}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Popular Packages */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Popular Health Packages</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('LabTestCatalog')}><Text style={s.seeAll}>See All</Text></TouchableOpacity>
                </View>
                
                <FlatList 
                    data={PACKAGES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                    renderItem={({ item }) => (
                        <View style={s.pkgCard}>
                            <View style={s.pkgTag}><Text style={s.pkgTagText}>{item.tag}</Text></View>
                            <Image source={{ uri: item.image }} style={s.pkgImg} />
                            <Text style={s.pkgName}>{item.name}</Text>
                            <Text style={s.pkgTests}>Includes {item.tests} parameters</Text>
                            <View style={s.pkgRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={s.pkgPrice}>₹{item.price}</Text>
                                    <Text style={s.pkgOriginal}>₹{item.originalPrice}</Text>
                                </View>
                                <TouchableOpacity style={s.addBtn}>
                                    <Text style={s.addBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />

                {/* Frequent Tests */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Frequently Booked Tests</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('LabTestCatalog')}><Text style={s.seeAll}>See All</Text></TouchableOpacity>
                </View>

                {TOP_TESTS.map(test => (
                    <View key={test.id} style={s.testCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.testName}>{test.name}</Text>
                            <Text style={s.testMeta}>Reports in {test.tat}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={s.pkgPrice}>₹{test.price}</Text>
                                <Text style={s.pkgOriginal}>₹{test.original}</Text>
                            </View>
                            <TouchableOpacity style={s.addBtnSmall}>
                                <Text style={s.addBtnTextSmall}>Add</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    greeting: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    cartBtn: { position: 'relative', padding: 8 },
    cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF5350', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, height: 48, marginLeft: 8, color: COLORS.text, fontSize: 14 },

    promoBanner: { marginHorizontal: 16, marginBottom: 24, padding: 20, backgroundColor: '#42A5F5', borderRadius: 16, overflow: 'hidden' },
    promoTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8, width: '80%' },
    promoSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 16, width: '90%' },
    promoBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    promoBtnText: { color: '#42A5F5', fontWeight: 'bold', fontSize: 13 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    seeAll: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

    categoriesContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 24 },
    catBox: { alignItems: 'center', width: '22%' },
    catIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    catText: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

    pkgCard: { width: 260, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    pkgTag: { position: 'absolute', top: -10, left: 16, backgroundColor: '#EF5350', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, zIndex: 1 },
    pkgTagText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
    pkgImg: { width: 40, height: 40, marginBottom: 12, opacity: 0.8 },
    pkgName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    pkgTests: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, marginBottom: 16 },
    pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
    pkgPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    pkgOriginal: { fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'line-through', marginLeft: 6 },
    addBtn: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
    addBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },

    testCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    testName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    testMeta: { fontSize: 12, color: COLORS.textMuted },
    addBtnSmall: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
    addBtnTextSmall: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
});

export default LabHomeScreen;
