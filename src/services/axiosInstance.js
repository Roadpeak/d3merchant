// services/axiosInstance.js - Updated with consistent API key handling
import axios from 'axios';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
    withCredentials: true, // CRITICAL: Required for HttpOnly cookies to work with cross-origin requests
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
            } else {
                console.warn('⚠️ VITE_API_KEY not found in environment variables');
            }

            // Try to get token from multiple sources
            let token = null;
            const secretKey = import.meta.env.VITE_SECRET_KEY;

            // 1. Try encrypted merchant_auth cookie first
            const encryptedData = Cookies.get('merchant_auth');
            if (encryptedData && secretKey) {
                try {
                    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
                    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    if (decryptedData.token) {
                        token = decryptedData.token;
                    }
                } catch (decryptError) {
                    // Silent - try fallback
                }
            }

            // 2. Try fallback unencrypted cookie
            if (!token) {
                const fallbackData = Cookies.get('merchant_auth_fallback');
                if (fallbackData) {
                    try {
                        const parsed = JSON.parse(fallbackData);
                        if (parsed.token) {
                            token = parsed.token;
                        }
                    } catch (parseError) {
                        // Silent - try next fallback
                    }
                }
            }

            // 3. Try localStorage as final fallback (for cross-origin cookie issues)
            if (!token) {
                token = localStorage.getItem('merchant_access_token');
            }

            // Add Authorization header if we have a token
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
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
            // Clear all auth storage
            Cookies.remove('merchant_auth', { path: '/' });
            Cookies.remove('merchant_auth_fallback', { path: '/' });
            localStorage.removeItem('merchant_access_token');
            // Redirect to login
            if (window.location.pathname !== '/accounts/sign-in') {
                window.location.href = '/accounts/sign-in';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;