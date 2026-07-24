import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.appWrapper}>
                <AppNavigator />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Dark background for the web margins
        alignItems: 'center',       // Centers the app vertically/horizontally
    },
    appWrapper: {
        flex: 1,
        width: '100%',
        // On web, restrict the width to look like a mobile device
        ...(Platform.OS === 'web' && {
            maxWidth: 480, 
            overflow: 'hidden',
            boxShadow: '0px 0px 20px rgba(0,0,0,0.5)',
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: '#1E293B'
        })
    }
});
