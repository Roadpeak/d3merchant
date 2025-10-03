// services/axiosInstance.js - Updated with consistent API key handling
import axios from 'axios';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://api.discoun3ree.com/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        try {
            // Always add API key if available
            const apiKey = import.meta.env.VITE_API_KEY;
            if (apiKey) {
                config.headers['x-api-key'] = apiKey;
                console.log('✅ API key added to request');
            } else {
                console.warn('⚠️ VITE_API_KEY not found in environment variables');
            }

            // Add auth token from cookies (your existing logic)
            const encryptedData = Cookies.get('auth_data');
            const secretKey = import.meta.env.VITE_SECRET_KEY;

            if (encryptedData && secretKey) {
                const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
                const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                if (decryptedData.token) {
                    config.headers.Authorization = `Bearer ${decryptedData.token}`;
                    console.log('✅ Auth token added to request');
                }
            }
        } catch (error) {
            console.error('Error in request interceptor:', error);
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for handling auth errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized request - clearing auth data');
            Cookies.remove('auth_data');
            // Redirect to login
            if (window.location.pathname !== '/accounts/sign-in') {
                window.location.href = '/accounts/sign-in';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
