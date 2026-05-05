import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Switch, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const MOCK_INVENTORY = [
    { id: 'MED-01', name: 'Paracetamol 500mg', stock: 1200, threshold: 500, status: 'in_stock' },
    { id: 'MED-02', name: 'Amoxicillin 250mg', stock: 45, threshold: 100, status: 'low_stock' },
    { id: 'MED-03', name: 'Ibuprofen 400mg', stock: 0, threshold: 200, status: 'out_of_stock' },
    { id: 'MED-04', name: 'Cetirizine 10mg', stock: 350, threshold: 150, status: 'in_stock' },
];

const PharmacistDashboardScreen = () => {
    const [deliveryEnabled, setDeliveryEnabled] = useState(true);
    const [deliveryRadius, setDeliveryRadius] = useState(5); // km
    const [inventory, setInventory] = useState(MOCK_INVENTORY);

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <View>
                    <Text style={s.greeting}>Pharmacy Hub</Text>
                    <Text style={s.sub}>SmartCarePlus Partner</Text>
                </View>
                <View style={s.badge}>
                    <Ionicons name="medical" size={14} color="#fff" />
                    <Text style={s.badgeText}>PHARMACIST</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                
                {/* Digital Profile + QR */}
                <View style={s.profileCard}>
                    <View style={s.qrPlaceholder}>
                        <Ionicons name="qr-code" size={64} color={COLORS.primary} />
                        <Text style={s.qrText}>Scan for Store Profile</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={s.storeName}>City Care Pharmacy</Text>
                        <Text style={s.storeId}>Store ID: PHARM-8821</Text>
                        <View style={s.ratingRow}>
                            <Ionicons name="star" size={14} color="#FFA726" />
                            <Text style={s.ratingText}>4.8 (124 reviews)</Text>
                        </View>
                        <TouchableOpacity style={s.shareBtn}>
                            <Ionicons name="share-social" size={14} color="#fff" />
                            <Text style={s.shareBtnText}>Share Digital Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Delivery Radius */}
                <Text style={s.sectionTitle}>Delivery Settings</Text>
                <View style={s.settingCard}>
                    <View style={s.settingRow}>
                        <View>
                            <Text style={s.settingTitle}>Home Delivery Active</Text>
                            <Text style={s.settingSub}>Accepting orders from patients</Text>
                        </View>
                        <Switch 
                            value={deliveryEnabled} 
                            onValueChange={setDeliveryEnabled}
                            trackColor={{ false: "#767577", true: "#66BB6A" }}
                        />
                    </View>
                    
                    {deliveryEnabled && (
                        <View style={s.radiusControl}>
                            <Text style={s.radiusLabel}>Delivery Radius: {deliveryRadius} km</Text>
                            <View style={s.radiusButtons}>
                                <TouchableOpacity style={s.radBtn} onPress={() => setDeliveryRadius(Math.max(1, deliveryRadius - 1))}>
                                    <Ionicons name="remove" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <View style={s.radDisplay}><Text style={s.radText}>{deliveryRadius}</Text></View>
                                <TouchableOpacity style={s.radBtn} onPress={() => setDeliveryRadius(Math.min(20, deliveryRadius + 1))}>
                                    <Ionicons name="add" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Inventory Alerts */}
                <Text style={s.sectionTitle}>Smart Inventory Alerts</Text>
                {inventory.map((item, index) => (
                    <View key={index} style={[
                        s.inventoryCard, 
                        item.status === 'out_of_stock' ? {borderLeftColor: '#EF5350', borderLeftWidth: 3} : 
                        item.status === 'low_stock' ? {borderLeftColor: '#FFA726', borderLeftWidth: 3} : {}
                    ]}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.itemName}>{item.name}</Text>
                            <Text style={s.itemMeta}>Threshold: {item.threshold} units</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[
                                s.itemStock, 
                                item.status === 'out_of_stock' ? {color: '#EF5350'} : 
                                item.status === 'low_stock' ? {color: '#FFA726'} : {color: '#66BB6A'}
                            ]}>
                                {item.stock} in stock
                            </Text>
                            {item.status !== 'in_stock' && (
                                <TouchableOpacity style={s.restockBtn}>
                                    <Text style={s.restockText}>Auto-Reorder</Text>
                                </TouchableOpacity>
                            )}
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
    sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#26A69A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 12 },
    
    profileCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    qrPlaceholder: { width: 100, height: 100, backgroundColor: COLORS.background, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' },
    qrText: { fontSize: 10, color: COLORS.primary, marginTop: 4, textAlign: 'center', fontWeight: '600' },
    storeName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    storeId: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 10 },
    ratingText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
    shareBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    settingCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    settingSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    radiusControl: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
    radiusLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
    radiusButtons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    radBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    radDisplay: { width: 60, alignItems: 'center' },
    radText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },

    inventoryCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    itemName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    itemMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    itemStock: { fontSize: 14, fontWeight: '800' },
    restockBtn: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.background, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
    restockText: { fontSize: 10, color: COLORS.text, fontWeight: '600' },
});

export default PharmacistDashboardScreen;
