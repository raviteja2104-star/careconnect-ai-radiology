import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

const MOCK_PATIENTS = [
    { id: '1', name: 'Ravi Teja', age: 32, gender: 'Male', phone: '+91-9876543010' },
    { id: '2', name: 'Priya Sharma', age: 28, gender: 'Female', phone: '+91-9876543020' },
];

const MOCK_MEDICINES = [
    'Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg', 'Cetirizine 10mg',
    'Vitamin D3', 'Atorvastatin 10mg', 'Metformin 500mg'
];

const DigitalPrescriptionScreen = ({ navigation }) => {
    const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
    const [diagnosis, setDiagnosis] = useState('');
    const [medications, setMedications] = useState([]);
    
    // New medication form
    const [medName, setMedName] = useState('');
    const [dosage, setDosage] = useState('1-0-1');
    const [duration, setDuration] = useState('5 Days');
    const [instructions, setInstructions] = useState('After Food');

    const addMedication = () => {
        if (!medName) return Alert.alert('Error', 'Please enter medicine name');
        
        const newMed = {
            id: Date.now().toString(),
            name: medName,
            dosage,
            duration,
            instructions
        };
        
        setMedications([...medications, newMed]);
        setMedName('');
    };

    const removeMedication = (id) => {
        setMedications(medications.filter(m => m.id !== id));
    };

    const handleSendPrescription = () => {
        if (!diagnosis || medications.length === 0) {
            return Alert.alert('Incomplete', 'Please add a diagnosis and at least one medication.');
        }

        Alert.alert(
            'Prescription Sent',
            'The digital prescription has been sent to the patient and the local pharmacy successfully!',
            [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Digital Rx</Text>
                <TouchableOpacity style={s.saveTemplateBtn}>
                    <Ionicons name="bookmark" size={16} color={COLORS.primary} />
                    <Text style={s.saveTemplateText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                
                {/* Patient Selector (Simplified) */}
                <View style={s.card}>
                    <Text style={s.cardLabel}>Patient Details</Text>
                    <View style={s.patientRow}>
                        <View style={s.patientAvatar}>
                            <Text style={s.patientInitial}>{selectedPatient.name.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={s.patientName}>{selectedPatient.name}</Text>
                            <Text style={s.patientMeta}>{selectedPatient.age} yrs • {selectedPatient.gender}</Text>
                        </View>
                        <TouchableOpacity style={s.changeBtn}>
                            <Text style={s.changeText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Diagnosis */}
                <View style={s.card}>
                    <Text style={s.cardLabel}>Diagnosis & Notes</Text>
                    <TextInput 
                        style={s.textArea}
                        placeholder="E.g. Viral Fever, Upper Respiratory Tract Infection"
                        placeholderTextColor={COLORS.textMuted}
                        multiline
                        value={diagnosis}
                        onChangeText={setDiagnosis}
                    />
                </View>

                {/* Add Medication Form */}
                <View style={s.card}>
                    <Text style={s.cardLabel}>Add Medication</Text>
                    
                    <TextInput 
                        style={s.input}
                        placeholder="Search Medicine (e.g. Paracetamol 500mg)"
                        placeholderTextColor={COLORS.textMuted}
                        value={medName}
                        onChangeText={setMedName}
                    />

                    <View style={s.row}>
                        <View style={s.halfCol}>
                            <Text style={s.subLabel}>Dosage</Text>
                            <TextInput 
                                style={s.inputSmall}
                                value={dosage}
                                onChangeText={setDosage}
                            />
                        </View>
                        <View style={s.halfCol}>
                            <Text style={s.subLabel}>Duration</Text>
                            <TextInput 
                                style={s.inputSmall}
                                value={duration}
                                onChangeText={setDuration}
                            />
                        </View>
                    </View>

                    <Text style={s.subLabel}>Instructions</Text>
                    <TextInput 
                        style={s.input}
                        value={instructions}
                        onChangeText={setInstructions}
                    />

                    <TouchableOpacity style={s.addMedBtn} onPress={addMedication}>
                        <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                        <Text style={s.addMedText}>Add to Prescription</Text>
                    </TouchableOpacity>
                </View>

                {/* Medications List */}
                {medications.length > 0 && (
                    <View style={s.card}>
                        <Text style={s.cardLabel}>Prescribed ({medications.length})</Text>
                        {medications.map((med, index) => (
                            <View key={med.id} style={[s.medRow, index === medications.length - 1 && { borderBottomWidth: 0 }]}>
                                <Ionicons name="medical" size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={s.medNameText}>{med.name}</Text>
                                    <View style={s.medMetaRow}>
                                        <Text style={s.medMeta}>{med.dosage}</Text>
                                        <Text style={s.medDot}>•</Text>
                                        <Text style={s.medMeta}>{med.duration}</Text>
                                        <Text style={s.medDot}>•</Text>
                                        <Text style={s.medMeta}>{med.instructions}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => removeMedication(med.id)} style={{ padding: 4 }}>
                                    <Ionicons name="trash" size={18} color="#EF5350" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>

            {/* Bottom Actions */}
            <View style={s.bottomBar}>
                <TouchableOpacity style={s.printBtn}>
                    <Ionicons name="print" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={s.sendBtn} onPress={handleSendPrescription}>
                    <Ionicons name="paper-plane" size={20} color="#fff" />
                    <Text style={s.sendBtnText}>Send e-Prescription</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    saveTemplateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    saveTemplateText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13, marginLeft: 4 },

    card: { backgroundColor: COLORS.card, margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    cardLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    
    patientRow: { flexDirection: 'row', alignItems: 'center' },
    patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#42A5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    patientInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    patientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    patientMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    changeBtn: { marginLeft: 'auto', padding: 6 },
    changeText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },

    textArea: { backgroundColor: COLORS.background, borderRadius: 8, padding: 12, paddingTop: 12, height: 80, textAlignVertical: 'top', fontSize: 14, color: COLORS.text },
    
    input: { backgroundColor: COLORS.background, borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.text, marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    halfCol: { flex: 1 },
    subLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, fontWeight: '600' },
    inputSmall: { backgroundColor: COLORS.background, borderRadius: 8, padding: 10, fontSize: 14, color: COLORS.text },
    
    addMedBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary + '10', padding: 12, borderRadius: 8, marginTop: 8 },
    addMedText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },

    medRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    medNameText: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
    medMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    medMeta: { fontSize: 12, color: COLORS.textMuted },
    medDot: { fontSize: 12, color: COLORS.textMuted, marginHorizontal: 6 },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.card, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12 },
    printBtn: { width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
    sendBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default DigitalPrescriptionScreen;
