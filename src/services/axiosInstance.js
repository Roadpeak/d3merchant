import axios from 'axios';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        try {
            const apiKey = import.meta.env.VITE_API_KEY;
            if (apiKey) {
                config.headers['api-key'] = apiKey;
            }

            const encryptedData = Cookies.get('auth_data');
            const secretKey = import.meta.env.VITE_SECRET_KEY;

            if (encryptedData) {
                const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
                const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                if (decryptedData.token) {
                    config.headers.Authorization = `Bearer ${decryptedData.token}`;
                }
            }
        } catch (error) {
            console.error('Error decrypting token or setting API key:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;
