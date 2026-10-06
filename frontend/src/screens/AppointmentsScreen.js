import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const STATUS_COLOR = {
    scheduled: COLORS.primary,
    confirmed: COLORS.success,
    completed: COLORS.textMuted,
    cancelled: COLORS.danger,
    pending: COLORS.warning,
};

const STATUS_ICON = {
    scheduled: 'calendar',
    confirmed: 'checkmark-circle',
    completed: 'checkmark-done-circle',
    cancelled: 'close-circle',
    pending: 'time',
};

const AppointmentsScreen = ({ navigation }) => {
    const [tab, setTab] = useState('upcoming');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [showBookModal, setShowBookModal] = useState(false);

    const loadAppointments = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            const res = await api.get('/appointments?scope=' + (tab === 'upcoming' ? 'upcoming' : 'past'));
            const data = res.data?.data || res.data || [];
            setAppointments(Array.isArray(data) ? data : []);
        } catch (e) {
            setError('Could not load appointments.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tab]);

    React.useEffect(() => { loadAppointments(); }, [loadAppointments]);

    const onRefresh = () => { setRefreshing(true); loadAppointments(true); };

    const cancelAppointment = async (id) => {
        Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                    try {
                        await api.patch(`/appointments/${id}/cancel`);
                        loadAppointments(true);
                    } catch {
                        Alert.alert('Error', 'Could not cancel appointment. Please try again.');
                    }
                },
            },
        ]);
    };

    const upcoming = appointments.filter(a => ['scheduled', 'confirmed', 'pending'].includes(a.status));
    const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));
    const displayed = tab === 'upcoming' ? upcoming : past;

    return (
        <View style={s.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Appointments</Text>
                    <TouchableOpacity style={s.bookBtn} onPress={() => setShowBookModal(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={s.tabs}>
                    {['upcoming', 'past'].map(t => (
                        <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                            <Text style={[s.tabTxt, tab === t && { color: '#fff' }]}>
                                {t === 'upcoming' ? `Upcoming${upcoming.length ? ` · ${upcoming.length}` : ''}` : 'Past'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />}
                {error ? <Text style={s.errorTxt}>{error}</Text> : null}

                {!loading && displayed.length === 0 && (
                    <View style={s.empty}>
                        <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
                        <Text style={s.emptyTitle}>{tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}</Text>
                        {tab === 'upcoming' && (
                            <TouchableOpacity style={s.emptyBookBtn} onPress={() => setShowBookModal(true)}>
                                <Text style={s.emptyBookTxt}>Book an Appointment</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {!loading && displayed.map(apt => (
                    <AppointmentCard
                        key={apt._id}
                        apt={apt}
                        showCancel={tab === 'upcoming' && apt.status !== 'cancelled'}
                        onCancel={() => cancelAppointment(apt._id)}
                    />
                ))}
            </ScrollView>

            <BookModal
                visible={showBookModal}
                onClose={() => setShowBookModal(false)}
                onBooked={() => { setShowBookModal(false); setTab('upcoming'); loadAppointments(true); }}
            />
        </View>
    );
};

const AppointmentCard = ({ apt, showCancel, onCancel }) => {
    const color = STATUS_COLOR[apt.status] || COLORS.primary;
    const icon = STATUS_ICON[apt.status] || 'calendar';
    const apptDate = apt.appointmentDate || apt.date;
    const dateStr = apptDate ? new Date(apptDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const timeStr = apt.appointmentTime || apt.time || '';
    const doctorName = apt.doctorId ? `Dr. ${apt.doctorId.firstName || ''} ${apt.doctorId.lastName || ''}`.trim() : (apt.doctorName || 'Doctor');
    return (
        <View style={s.card}>
            <View style={[s.cardAccent, { backgroundColor: color }]} />
            <View style={s.cardContent}>
                <View style={s.cardTopRow}>
                    <View style={[s.statusIcon, { backgroundColor: color + '20' }]}>
                        <Ionicons name={icon} size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.doctorName}>{doctorName}</Text>
                        <Text style={s.specialty}>{apt.specialty || apt.type || 'General'}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[s.statusTxt, { color }]}>{apt.status}</Text>
                    </View>
                </View>

                <View style={s.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                    <Text style={s.dateTxt}>{dateStr}{timeStr ? `  ·  ${timeStr}` : ''}</Text>
                </View>

                {apt.reason && (
                    <Text style={s.reason} numberOfLines={2}>{apt.reason}</Text>
                )}

                {apt.location && (
                    <View style={s.locationRow}>
                        <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                        <Text style={s.locationTxt}>{apt.location}</Text>
                    </View>
                )}

                {(apt.status === 'completed' && apt.prescriptionId) && (
                    <View style={s.rxRow}>
                        <Ionicons name="document-text-outline" size={13} color={COLORS.primary} />
                        <Text style={s.rxTxt}>Prescription available</Text>
                    </View>
                )}

                {showCancel && (
                    <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
                        <Text style={s.cancelTxt}>Cancel Appointment</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const BookModal = ({ visible, onClose, onBooked }) => {
    const [reason, setReason] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [booking, setBooking] = useState(false);
    const [bookError, setBookError] = useState('');

    const submit = async () => {
        if (!reason.trim()) { setBookError('Please describe the reason for your visit.'); return; }
        if (!date.trim()) { setBookError('Please enter a preferred date (DD/MM/YYYY).'); return; }
        setBooking(true);
        setBookError('');
        try {
            await api.post('/appointments', {
                reason: reason.trim(),
                appointmentDate: date.trim(),
                appointmentTime: time.trim() || undefined,
                type: 'OPD',
            });
            setReason(''); setDate(''); setTime('');
            onBooked();
        } catch (e) {
            setBookError(e?.response?.data?.message || 'Booking failed. Try again.');
        } finally {
            setBooking(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
            <View style={s.sheet}>
                <View style={s.sheetHandle} />
                <Text style={s.sheetTitle}>Book Appointment</Text>

                <Text style={s.fieldLabel}>Reason for visit</Text>
                <TextInput
                    style={s.input}
                    placeholder="E.g. Fever, chest pain, follow-up..."
                    placeholderTextColor={COLORS.textMuted}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                <Text style={s.fieldLabel}>Preferred Date</Text>
                <TextInput
                    style={s.input}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={COLORS.textMuted}
                    value={date}
                    onChangeText={setDate}
                    keyboardType="number-pad"
                />

                <Text style={s.fieldLabel}>Preferred Time (optional)</Text>
                <TextInput
                    style={s.input}
                    placeholder="E.g. 10:00 AM"
                    placeholderTextColor={COLORS.textMuted}
                    value={time}
                    onChangeText={setTime}
                />

                {bookError ? <Text style={s.bookError}>{bookError}</Text> : null}

                <TouchableOpacity style={[s.bookSubmitBtn, booking && { opacity: 0.6 }]} onPress={submit} disabled={booking}>
                    {booking
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={s.bookSubmitTxt}>Request Appointment</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.sheetCancelBtn} onPress={onClose}>
                    <Text style={s.sheetCancelTxt}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: SIZES.xxl, color: '#fff', ...FONTS.bold },
    bookBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

    tabs: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: SIZES.radius, backgroundColor: COLORS.card, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabTxt: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.semiBold },

    errorTxt: { textAlign: 'center', color: COLORS.danger, margin: 24 },
    empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 12 },
    emptyTitle: { fontSize: SIZES.base, color: COLORS.textMuted, textAlign: 'center' },
    emptyBookBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
    emptyBookTxt: { color: '#fff', ...FONTS.semiBold },

    card: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 12, backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    cardAccent: { width: 4 },
    cardContent: { flex: 1, padding: 14, gap: 8 },
    cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    statusIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    doctorName: { fontSize: SIZES.sm, color: '#fff', ...FONTS.semiBold },
    specialty: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusTxt: { fontSize: SIZES.xs, ...FONTS.bold, textTransform: 'capitalize' },

    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateTxt: { fontSize: SIZES.xs, color: COLORS.textSecondary },
    reason: { fontSize: SIZES.xs, color: COLORS.textMuted, lineHeight: 16 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationTxt: { fontSize: SIZES.xs, color: COLORS.textMuted },
    rxRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rxTxt: { fontSize: SIZES.xs, color: COLORS.primary },
    cancelBtn: { marginTop: 4, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.danger + '50', paddingVertical: 8, alignItems: 'center' },
    cancelTxt: { color: COLORS.danger, fontSize: SIZES.xs, ...FONTS.semiBold },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
    sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
    sheetTitle: { fontSize: SIZES.xl, color: '#fff', ...FONTS.bold },
    fieldLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium },
    input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: SIZES.base },
    bookError: { fontSize: SIZES.sm, color: COLORS.danger },
    bookSubmitBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center' },
    bookSubmitTxt: { color: '#fff', ...FONTS.bold, fontSize: SIZES.base },
    sheetCancelBtn: { borderRadius: SIZES.radius, paddingVertical: 12, alignItems: 'center' },
    sheetCancelTxt: { color: COLORS.textMuted, ...FONTS.medium },
});

export default AppointmentsScreen;
