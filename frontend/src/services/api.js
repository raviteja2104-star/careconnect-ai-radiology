import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (__DEV__) {
        // Android Emulator considers localhost to be its own device, so we use 10.0.2.2 to bridge to host OS.
        return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
    }
    return 'https://careconnect-iota-five.vercel.app/api'; // Live Vercel backend
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            AsyncStorage.removeItem('authToken');
            AsyncStorage.removeItem('user');
        }
        return Promise.reject(error.response?.data || error);
    }
);

// Auth APIs
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

export const labAPI = {
    createBooking: (data) => api.post('/lab/bookings', data),
    getBookings: () => api.get('/lab/bookings'),
    updateBooking: (id, data) => api.put(`/lab/bookings/${id}`, data),
};

// Patient APIs
export const patientAPI = {
    checkSymptoms: (data) => api.post('/patient/check-symptoms', data),
    bookConsultation: (data) => api.post('/patient/consultation', data),
    getConsultations: (params) => api.get('/patient/consultations', { params }),
    getReports: () => api.get('/patient/reports'),
    getDoctors: (params) => api.get('/patient/doctors', { params }),
    getNotifications: () => api.get('/patient/notifications'),
    markNotificationRead: (id) => api.put(`/patient/notifications/${id}/read`),
    uploadScan: (formData) =>
        api.post('/patient/upload-scan', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

// Doctor APIs
export const doctorAPI = {
    getPatients: () => api.get('/doctor/patients'),
    getPatientHistory: (patientId) => api.get(`/doctor/patients/${patientId}/history`),
    getConsultations: (params) => api.get('/doctor/consultations', { params }),
    updateConsultation: (id, data) => api.put(`/doctor/consultations/${id}`, data),
    requestScan: (data) => api.post('/doctor/request-scan', data),
    viewScanReport: (id) => api.get(`/doctor/scans/${id}`),
    getStats: () => api.get('/doctor/stats'),
};

// Radiology APIs
export const radiologyAPI = {
    uploadScan: (formData) =>
        api.post('/radiology/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    listScans: (params) => api.get('/radiology/list', { params }),
    getScan: (id) => api.get(`/radiology/${id}`),
    submitReport: (data) => api.post('/radiology/report', data),
    assignRadiologist: (id, data) => api.put(`/radiology/${id}/assign`, data),
    getStats: () => api.get('/radiology/stats'),
};

// Emergency APIs
export const emergencyAPI = {
    triggerSOS: (data) => api.post('/emergency/sos', data),
    getStatus: (id) => api.get(`/emergency/${id}`),
    getHistory: () => api.get('/emergency/history'),
};

export default api;
