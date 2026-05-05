import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../utils/theme';
import { authAPI } from '../services/api';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState('patient');

    const roles = [
        { key: 'patient', label: 'Patient', icon: 'person' },
        { key: 'doctor', label: 'Doctor', icon: 'medical' },
        { key: 'radiologist', label: 'Radiologist', icon: 'scan' },
        { key: 'admin', label: 'Admin', icon: 'shield-checkmark' },
        { key: 'lab_tech', label: 'Lab Tech', icon: 'flask' },
    ];

    const quickLogins = {
        patient: { email: 'ravi@careconnect.com', password: 'password123' },
        doctor: { email: 'dr.raj@careconnect.com', password: 'password123' },
        radiologist: { email: 'dr.meera@careconnect.com', password: 'password123' },
        admin: { email: 'admin@careconnect.com', password: 'admin123' },
        lab_tech: { email: 'tech1@careconnect.com', password: 'password123' },
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.login(email, password);
            if (response.success) {
                await AsyncStorage.setItem('authToken', response.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                navigation.replace('Main', { user: response.data.user });
            }
        } catch (error) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (role) => {
        const creds = quickLogins[role];
        setEmail(creds.email);
        setPassword(creds.password);
        setSelectedRole(role);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Logo area */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="medical" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.appName}>CareConnect</Text>
                    <Text style={styles.tagline}>Connected Healthcare, Powered by AI</Text>
                </View>

                {/* Role selector */}
                <View style={styles.roleContainer}>
                    {roles.map((role) => (
                        <TouchableOpacity
                            key={role.key}
                            style={[styles.roleButton, selectedRole === role.key && styles.roleButtonActive]}
                            onPress={() => handleQuickLogin(role.key)}
                        >
                            <Ionicons
                                name={role.icon}
                                size={20}
                                color={selectedRole === role.key ? COLORS.white : COLORS.textSecondary}
                            />
                            <Text
                                style={[styles.roleLabel, selectedRole === role.key && styles.roleLabelActive]}
                            >
                                {role.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Login form */}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email address"
                            placeholderTextColor={COLORS.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={COLORS.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={COLORS.textMuted}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Sign In</Text>
                                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Register link */}
                <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerText}>
                        Don't have an account? <Text style={styles.registerHighlight}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>

                {/* Quick login hint */}
                <View style={styles.hintContainer}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.hintText}>Tap a role above to auto-fill demo credentials</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SIZES.paddingLg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryGlow,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    appName: {
        fontSize: SIZES.title,
        color: COLORS.white,
        ...FONTS.bold,
    },
    tagline: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8,
    },
    roleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: SIZES.radiusFull,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    roleButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    roleLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },
    roleLabelActive: {
        color: COLORS.white,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: SIZES.base,
        color: COLORS.textPrimary,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        height: 56,
        gap: 8,
        marginTop: 8,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        fontSize: SIZES.lg,
        color: COLORS.white,
        ...FONTS.semiBold,
    },
    registerLink: {
        alignItems: 'center',
        marginTop: 24,
    },
    registerText: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
    },
    registerHighlight: {
        color: COLORS.primary,
        ...FONTS.semiBold,
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 6,
    },
    hintText: {
        fontSize: SIZES.xs,
        color: COLORS.textMuted,
    },
});

export default LoginScreen;
