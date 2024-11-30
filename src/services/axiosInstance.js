import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor for responses (e.g., handling global errors)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optionally handle global errors here
        return Promise.reject(error);
    }
);

export default axiosInstance;
