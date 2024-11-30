import axiosInstance from "./axiosInstance";

// Fetch all services
export const fetchServices = async () => {
    try {
        const response = await axiosInstance.get('/services');
        return response.data;
    } catch (error) {
        console.error('Error fetching services:', error);
        throw error;
    }
};

// Create a new service
export const createService = async (serviceData) => {
    try {
        const response = await axiosInstance.post('/services', serviceData);
        return response.data;
    } catch (error) {
        console.error('Error creating service:', error);
        throw error;
    }
};

// Upload an image
export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// User login
export const loginUser = async (credentials) => {
    try {
        const response = await axiosInstance.post('/login', credentials);
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

// User signup
export const signupUser = async (userData) => {
    try {
        const response = await axiosInstance.post('/register', userData);
        return response.data;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
};
