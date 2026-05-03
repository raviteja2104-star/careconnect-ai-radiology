import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import SymptomCheckerScreen from '../screens/SymptomCheckerScreen';
import UploadScanScreen from '../screens/UploadScanScreen';
import ReportsScreen from '../screens/ReportsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import DoctorDashboardScreen from '../screens/DoctorDashboardScreen';
import RadiologistDashboardScreen from '../screens/RadiologistDashboardScreen';
import ReportEditorScreen from '../screens/ReportEditorScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import WalletScreen from '../screens/WalletScreen';
import ScanViewerScreen from '../screens/ScanViewerScreen';
import ReportViewerScreen from '../screens/ReportViewerScreen';
import DiagnosticCenterScreen from '../screens/DiagnosticCenterScreen';
import WorklistScreen from '../screens/WorklistScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import TeleradiologyScreen from '../screens/TeleradiologyScreen';
import { COLORS } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────────────────
// Patient bottom tab navigator
// ─────────────────────────────────────────────────────────
const PatientTabs = () => (
    <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            height: 64,
            paddingBottom: 10,
            paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
            const icons = {
                Home: 'home',
                Reports: 'document-text',
                Marketplace: 'storefront',
                Wallet: 'wallet',
            };
            return <Ionicons name={icons[route.name] || 'home'} size={22} color={color} />;
        },
    })}>
        <Tab.Screen name="Home" component={PatientHomeScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
        <Tab.Screen name="Wallet" component={WalletScreen} />
    </Tab.Navigator>
);

// ─────────────────────────────────────────────────────────
// Doctor bottom tab navigator
// ─────────────────────────────────────────────────────────
const DoctorTabs = () => (
    <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 64, paddingBottom: 10, paddingTop: 4 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
            const icons = { Dashboard: 'grid', Scans: 'scan', Analytics: 'bar-chart', Wallet: 'wallet' };
            return <Ionicons name={icons[route.name] || 'grid'} size={22} color={color} />;
        },
    })}>
        <Tab.Screen name="Dashboard" component={DoctorDashboardScreen} />
        <Tab.Screen name="Scans" component={ReportsScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Wallet" component={WalletScreen} />
    </Tab.Navigator>
);

// ─────────────────────────────────────────────────────────
// Radiologist bottom tab navigator
// ─────────────────────────────────────────────────────────
const RadiologistTabs = () => (
    <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 64, paddingBottom: 10, paddingTop: 4 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
            const icons = {
                Worklist: 'list',
                Teleradiology: 'radio',
                Upload: 'cloud-upload',
                Analytics: 'bar-chart',
                Wallet: 'wallet',
            };
            return <Ionicons name={icons[route.name] || 'list'} size={22} color={color} />;
        },
    })}>
        <Tab.Screen name="Worklist" component={WorklistScreen} />
        <Tab.Screen name="Teleradiology" component={TeleradiologyScreen} />
        <Tab.Screen name="Upload" component={DiagnosticCenterScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Wallet" component={WalletScreen} />
    </Tab.Navigator>
);

// ─────────────────────────────────────────────────────────
// Role router — picks the right tab set from login params
// ─────────────────────────────────────────────────────────
const MainScreen = ({ route }) => {
    const user = route.params?.user;
    if (user?.role === 'doctor') return <DoctorTabs />;
    if (user?.role === 'radiologist') return <RadiologistTabs />;
    return <PatientTabs />;
};

// ─────────────────────────────────────────────────────────
// Root stack — all top-level modals and deep-link screens
// ─────────────────────────────────────────────────────────
const AppNavigator = () => (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainScreen} />

            {/* Shared modals / detail screens */}
            <Stack.Screen name="SymptomChecker" component={SymptomCheckerScreen} />
            <Stack.Screen name="UploadScan" component={UploadScanScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="ReportEditor" component={ReportEditorScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="ScanViewer" component={ScanViewerScreen} />
            <Stack.Screen name="ReportViewer" component={ReportViewerScreen} />
            <Stack.Screen name="DiagnosticCenter" component={DiagnosticCenterScreen} />
            <Stack.Screen name="Worklist" component={WorklistScreen} />
            <Stack.Screen name="Teleradiology" component={TeleradiologyScreen} />

            {/* Stubs — replace with proper screens when ready */}
            <Stack.Screen name="DoctorList" component={PatientHomeScreen} />
            <Stack.Screen name="Notifications" component={PatientHomeScreen} />
            <Stack.Screen name="ScanDetail" component={ReportsScreen} />
            <Stack.Screen name="PatientDetail" component={DoctorDashboardScreen} />
            <Stack.Screen name="PatientHome" component={PatientHomeScreen} />
        </Stack.Navigator>
    </NavigationContainer>
);

export default AppNavigator;
