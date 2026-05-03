import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const DRUG_CATALOG = [
    { id: 1, name: 'Amoxicillin 500mg', generic: 'Amoxicillin', category: 'Antibiotic', form: 'Capsule', pack: '21 caps', price: 189, stock: 145, rx: true, manufacturer: 'Cipla Ltd' },
    { id: 2, name: 'Pantocid DSR', generic: 'Pantoprazole + Domperidone', category: 'Gastrointestinal', form: 'Capsule', pack: '15 caps', price: 198, stock: 62, rx: true, manufacturer: 'Sun Pharma' },
    { id: 3, name: 'Dolo 650', generic: 'Paracetamol', category: 'Analgesic', form: 'Tablet', pack: '15 tabs', price: 30, stock: 320, rx: false, manufacturer: 'Micro Labs' },
    { id: 4, name: 'Azithromycin 500mg', generic: 'Azithromycin', category: 'Antibiotic', form: 'Tablet', pack: '3 tabs', price: 112, stock: 89, rx: true, manufacturer: 'Zydus Cadila' },
    { id: 5, name: 'Metformin 500mg', generic: 'Metformin HCl', category: 'Antidiabetic', form: 'Tablet', pack: '30 tabs', price: 45, stock: 200, rx: true, manufacturer: 'USV Ltd' },
    { id: 6, name: 'Atorvastatin 10mg', generic: 'Atorvastatin', category: 'Cardiovascular', form: 'Tablet', pack: '30 tabs', price: 125, stock: 98, rx: true, manufacturer: 'Ranbaxy' },
    { id: 7, name: 'Cetirizine 10mg', generic: 'Cetirizine', category: 'Antihistamine', form: 'Tablet', pack: '10 tabs', price: 22, stock: 450, rx: false, manufacturer: 'Cipla Ltd' },
    { id: 8, name: 'Insulin Glargine 100IU', generic: 'Insulin Glargine', category: 'Antidiabetic', form: 'Injection', pack: '1 pen', price: 1450, stock: 15, rx: true, manufacturer: 'Sanofi' },
    { id: 9, name: 'Ibuprofen 400mg', generic: 'Ibuprofen', category: 'NSAID', form: 'Tablet', pack: '10 tabs', price: 35, stock: 280, rx: false, manufacturer: 'Abbott' },
    { id: 10, name: 'Omeprazole 20mg', generic: 'Omeprazole', category: 'Gastrointestinal', form: 'Capsule', pack: '15 caps', price: 68, stock: 175, rx: false, manufacturer: 'Dr. Reddy\'s' },
];

const CATEGORIES = ['All', 'Antibiotic', 'Analgesic', 'Gastrointestinal', 'Antidiabetic', 'Cardiovascular', 'NSAID', 'Antihistamine'];

const PharmacyScreen = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showDrug, setShowDrug] = useState(null);
    const [activeTab, setActiveTab] = useState('shop');
    const [orders, setOrders] = useState([
        { id: 'ORD-4421', items: 'Pantocid DSR, Nexpro Fast 40mg', total: 342, status: 'packed', date: '3 May 2026', tracking: 'Out for delivery' },
        { id: 'ORD-4420', items: 'Amoxicillin 500mg', total: 189, status: 'delivered', date: '1 May 2026', tracking: 'Delivered' },
    ]);

    const filtered = DRUG_CATALOG.filter(d => {
        const matchCat = category === 'All' || d.category === category;
        const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.generic.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const addToCart = (drug, qty = 1) => {
        const existing = cart.find(c => c.id === drug.id);
        if (existing) {
            setCart(cart.map(c => c.id === drug.id ? { ...c, qty: c.qty + qty } : c));
        } else {
            setCart([...cart, { ...drug, qty }]);
        }
        setShowDrug(null);
    };

    const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));
    const updateQty = (id, delta) => {
        setCart(cart.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
    };

    const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const cartCount = cart.reduce((s, c) => s + c.qty, 0);

    const placeOrder = () => {
        if (cart.length === 0) return;
        const rxItems = cart.filter(c => c.rx);
        if (rxItems.length > 0) {
            Alert.alert('Prescription Required', `${rxItems.map(r => r.name).join(', ')} require a valid prescription. Upload or link your e-prescription to proceed.`, [
                { text: 'Upload Rx', onPress: () => {} },
                { text: 'Continue (Demo)', onPress: () => finalizeOrder() },
            ]);
        } else {
            finalizeOrder();
        }
    };

    const finalizeOrder = () => {
        const newOrder = {
            id: `ORD-${Date.now().toString().slice(-4)}`,
            items: cart.map(c => c.name).join(', '),
            total: cartTotal,
            status: 'pending',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            tracking: 'Processing',
        };
        setOrders([newOrder, ...orders]);
        setCart([]);
        setShowCart(false);
        Alert.alert('Order Placed! 🎉', `Order ${newOrder.id} placed successfully.\nTotal: ₹${cartTotal}\nEstimated delivery: 2-4 hours`);
    };

    const OS = s => ({ pending: COLORS.warning, packed: COLORS.primary, shipped: COLORS.info || COLORS.primary, delivered: COLORS.success }[s] || COLORS.textMuted);

    return (
        <View style={ps.root}>
            {/* Header */}
            <View style={ps.header}>
                <TouchableOpacity style={ps.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={ps.title}>E-Pharmacy</Text>
                    <Text style={ps.sub}>Order medicines · Doorstep delivery</Text>
                </View>
                <TouchableOpacity style={ps.cartBtn} onPress={() => setShowCart(true)}>
                    <Ionicons name="cart" size={20} color={COLORS.primary} />
                    {cartCount > 0 && <View style={ps.cartBadge}><Text style={ps.cartBadgeTxt}>{cartCount}</Text></View>}
                </TouchableOpacity>
            </View>

            {/* Tab bar */}
            <View style={ps.tabBar}>
                {['shop', 'orders', 'prescriptions'].map(t => (
                    <TouchableOpacity key={t} style={[ps.tab, activeTab === t && ps.tabActive]} onPress={() => setActiveTab(t)}>
                        <Text style={[ps.tabTxt, activeTab === t && { color: COLORS.primary }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'shop' && <>
                {/* Search */}
                <View style={ps.searchRow}>
                    <Ionicons name="search" size={16} color={COLORS.textMuted} />
                    <TextInput style={ps.searchInput} placeholder="Search medicine, generic name..." placeholderTextColor={COLORS.textMuted}
                        value={search} onChangeText={setSearch} />
                    {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={COLORS.textMuted} /></TouchableOpacity>}
                </View>

                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ps.catBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                    {CATEGORIES.map(c => (
                        <TouchableOpacity key={c} style={[ps.catChip, category === c && ps.catChipOn]} onPress={() => setCategory(c)}>
                            <Text style={[ps.catTxt, category === c && { color: '#fff' }]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Drug list */}
                <ScrollView style={ps.list} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
                    {filtered.map(d => (
                        <TouchableOpacity key={d.id} style={ps.drugCard} onPress={() => setShowDrug(d)}>
                            <View style={[ps.drugIcon, { backgroundColor: d.rx ? COLORS.primary + '20' : COLORS.success + '20' }]}>
                                <Ionicons name={d.form === 'Injection' ? 'flask' : 'medical'} size={20} color={d.rx ? COLORS.primary : COLORS.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={ps.drugName}>{d.name}</Text>
                                    {d.rx && <View style={ps.rxBadge}><Text style={ps.rxTxt}>Rx</Text></View>}
                                </View>
                                <Text style={ps.drugGeneric}>{d.generic} · {d.manufacturer}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <Text style={ps.drugPrice}>₹{d.price}</Text>
                                    <Text style={ps.drugPack}>{d.pack}</Text>
                                    <Text style={[ps.drugStock, d.stock < 20 && { color: COLORS.danger }]}>{d.stock < 20 ? `Only ${d.stock} left` : 'In Stock'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={ps.addBtn} onPress={() => addToCart(d)}>
                                <Ionicons name="add" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </>}

            {activeTab === 'orders' && (
                <ScrollView style={ps.list} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
                    {orders.map(o => (
                        <View key={o.id} style={ps.orderCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.bold }}>{o.id}</Text>
                                <View style={{ backgroundColor: OS(o.status) + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: OS(o.status) + '40' }}>
                                    <Text style={{ fontSize: 9, color: OS(o.status), ...FONTS.bold }}>{o.status.toUpperCase()}</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary }}>{o.items}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                                <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{o.date}</Text>
                                <Text style={{ fontSize: SIZES.base, color: COLORS.primary, ...FONTS.bold }}>₹{o.total}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                <Ionicons name="location" size={12} color={OS(o.status)} />
                                <Text style={{ fontSize: SIZES.xs, color: OS(o.status) }}>{o.tracking}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {activeTab === 'prescriptions' && (
                <ScrollView style={ps.list} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    <View style={{ backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }}>
                        <Ionicons name="document-text" size={48} color={COLORS.primary} />
                        <Text style={{ fontSize: SIZES.lg, color: '#fff', ...FONTS.bold, marginTop: 12 }}>Upload Prescription</Text>
                        <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 }}>Upload a photo of your prescription to order medicines that require Rx verification.</Text>
                        <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}>
                            <Text style={{ fontSize: SIZES.md, color: '#fff', ...FONTS.bold }}>📷 Upload Photo</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: SIZES.md, color: '#fff', ...FONTS.bold, marginTop: 24, marginBottom: 12 }}>E-Prescriptions from Doctors</Text>
                    {[
                        { doctor: 'Dr. Raj Sharma', date: '24 Apr 2026', items: 3, status: 'active' },
                        { doctor: 'Dr. Anita Desai', date: '15 Apr 2026', items: 2, status: 'used' },
                    ].map((rx, i) => (
                        <View key={i} style={ps.orderCard}>
                            <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.bold }}>{rx.doctor}</Text>
                            <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{rx.date} · {rx.items} medicines</Text>
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                <Ionicons name="cart" size={14} color={rx.status === 'active' ? COLORS.primary : COLORS.textMuted} />
                                <Text style={{ fontSize: SIZES.sm, color: rx.status === 'active' ? COLORS.primary : COLORS.textMuted, ...FONTS.semiBold }}>
                                    {rx.status === 'active' ? 'Order Now' : 'Already Ordered'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Cart Modal */}
            <Modal visible={showCart} transparent animationType="slide">
                <View style={ps.modOverlay}>
                    <View style={ps.modCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                            <Text style={{ fontSize: SIZES.xl, color: '#fff', ...FONTS.bold }}>Your Cart ({cartCount})</Text>
                            <TouchableOpacity onPress={() => setShowCart(false)}><Ionicons name="close" size={22} color={COLORS.textMuted} /></TouchableOpacity>
                        </View>
                        {cart.length === 0 ? (
                            <View style={{ alignItems: 'center', padding: 32 }}>
                                <Ionicons name="cart-outline" size={48} color={COLORS.textMuted} />
                                <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Cart is empty</Text>
                            </View>
                        ) : <>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {cart.map(c => (
                                    <View key={c.id} style={ps.cartItem}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: SIZES.base, color: '#fff', ...FONTS.semiBold }}>{c.name}</Text>
                                            <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{c.pack} · ₹{c.price}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <TouchableOpacity onPress={() => updateQty(c.id, -1)} style={ps.qtyBtn}>
                                                <Ionicons name="remove" size={14} color="#fff" />
                                            </TouchableOpacity>
                                            <Text style={{ color: '#fff', ...FONTS.bold, minWidth: 20, textAlign: 'center' }}>{c.qty}</Text>
                                            <TouchableOpacity onPress={() => updateQty(c.id, 1)} style={ps.qtyBtn}>
                                                <Ionicons name="add" size={14} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => removeFromCart(c.id)}>
                                                <Ionicons name="trash" size={16} color={COLORS.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                            <View style={ps.cartSummary}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ color: COLORS.textMuted }}>Subtotal</Text>
                                    <Text style={{ color: '#fff', ...FONTS.bold }}>₹{cartTotal}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ color: COLORS.textMuted }}>Delivery</Text>
                                    <Text style={{ color: COLORS.success, ...FONTS.bold }}>FREE</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 8 }} />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ color: '#fff', ...FONTS.bold, fontSize: SIZES.lg }}>Total</Text>
                                    <Text style={{ color: COLORS.primary, ...FONTS.bold, fontSize: SIZES.lg }}>₹{cartTotal}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={ps.checkoutBtn} onPress={placeOrder}>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={{ fontSize: SIZES.lg, color: '#fff', ...FONTS.bold }}>Place Order · ₹{cartTotal}</Text>
                            </TouchableOpacity>
                        </>}
                    </View>
                </View>
            </Modal>

            {/* Drug detail modal */}
            <Modal visible={!!showDrug} transparent animationType="fade">
                <View style={ps.modOverlay}>
                    <View style={[ps.modCard, { maxHeight: '60%' }]}>
                        {showDrug && <>
                            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => setShowDrug(null)}>
                                <Ionicons name="close" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="medical" size={28} color={COLORS.primary} />
                                </View>
                                <Text style={{ fontSize: SIZES.xl, color: '#fff', ...FONTS.bold }}>{showDrug.name}</Text>
                                <Text style={{ fontSize: SIZES.sm, color: COLORS.textMuted }}>{showDrug.generic}</Text>
                            </View>
                            {[
                                ['Category', showDrug.category], ['Form', showDrug.form], ['Pack', showDrug.pack],
                                ['Manufacturer', showDrug.manufacturer], ['Stock', showDrug.stock > 20 ? 'In Stock' : `${showDrug.stock} left`],
                            ].map(([k, v], i) => (
                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                                    <Text style={{ color: COLORS.textMuted, fontSize: SIZES.sm }}>{k}</Text>
                                    <Text style={{ color: '#fff', fontSize: SIZES.sm, ...FONTS.semiBold }}>{v}</Text>
                                </View>
                            ))}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                                <Text style={{ fontSize: SIZES.xxl, color: COLORS.primary, ...FONTS.bold }}>₹{showDrug.price}</Text>
                                <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}
                                    onPress={() => addToCart(showDrug)}>
                                    <Ionicons name="cart" size={18} color="#fff" />
                                    <Text style={{ color: '#fff', ...FONTS.bold }}>Add to Cart</Text>
                                </TouchableOpacity>
                            </View>
                        </>}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const ps = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    sub: { fontSize: SIZES.xs, color: COLORS.textMuted },
    cartBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    cartBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
    cartBadgeTxt: { fontSize: 9, color: '#fff', ...FONTS.bold },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabTxt: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.semiBold },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, fontSize: SIZES.md, color: '#fff' },
    catBar: { maxHeight: 44, marginTop: 10, marginBottom: 4 },
    catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    catChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    catTxt: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.semiBold },
    list: { flex: 1 },
    drugCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 12, alignItems: 'center' },
    drugIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    drugName: { fontSize: SIZES.base, color: '#fff', ...FONTS.bold },
    drugGeneric: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    drugPrice: { fontSize: SIZES.base, color: COLORS.primary, ...FONTS.bold },
    drugPack: { fontSize: SIZES.xs, color: COLORS.textMuted },
    drugStock: { fontSize: SIZES.xs, color: COLORS.success, ...FONTS.semiBold },
    rxBadge: { backgroundColor: COLORS.warning + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: COLORS.warning + '40' },
    rxTxt: { fontSize: 8, color: COLORS.warning, ...FONTS.bold },
    addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary + '40' },
    orderCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 10 },
    modOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
    modCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    cartSummary: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 16, marginTop: 16 },
    checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, marginTop: 12 },
});

export default PharmacyScreen;
