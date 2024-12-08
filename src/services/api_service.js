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

        const response = await axiosInstance.post('/files/upload-image', formData, {
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
        const response = await axiosInstance.post('/merchants/login', credentials);
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

// User signup
export const signupUser = async (userData) => {
    try {
        const response = await axiosInstance.post('/merchants/register', userData);
        return response.data;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
};

// Fetch all offers
export const fetchOffers = async () => {
    try {
        const response = await axiosInstance.get('/offers');
        return response.data;
    } catch (error) {
        console.error('Error fetching offers:', error);
        throw error;
    }
};

// Create a new offer
export const createOffer = async (offerData) => {
    try {
        const response = await axiosInstance.post('/offers', offerData);
        return response.data;
    } catch (error) {
        console.error('Error creating offer:', error);
        throw error;
    }
};

// Update an existing offer
export const updateOffer = async (offerId, offerData) => {
    try {
        const response = await axiosInstance.put(`/offers/${offerId}`, offerData);
        return response.data;
    } catch (error) {
        console.error('Error updating offer:', error);
        throw error;
    }
};

// Delete an offer
export const deleteOffer = async (offerId) => {
    try {
        const response = await axiosInstance.delete(`/offers/${offerId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting offer:', error);
        throw error;
    }
};

export const fetchBookings = async () => {
    try {
        const response = await axiosInstance.get('/bookings/store/eff53f50-b48a-11ef-915d-a3ac7236b7f5');
        return response.data;
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }
}

export const fetchSingleBooking = async (bookingId) => {
    try {
        const response = await axiosInstance.get(`/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching booking:', error);
        throw error;
    }
}

export const fetchStaff = async () => {
    try {
        const response = await axiosInstance.get('/staff/store/eff53f50-b48a-11ef-915d-a3ac7236b7f5');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const addStaff = async (staffData) => {
    try {
        const response = await axiosInstance.post('/staff', staffData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteStaff = async (staffId) => {
    try {
        await axiosInstance.delete(`/${staffId}`);
    } catch (error) {
        throw error;
    }
};

export const getStaffById = async (id) => {
    try {
        const response = await axiosInstance.get(`/staff/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const assignService = async (data) => {
    try {
        const response = await axiosInstance.post('/staff/assign-service', data);
        return response.data;
    } catch (error) {
        throw error;
    }
} 

export const getStaffAssignedServices = async (id) => {
    try {
        const response = await axiosInstance.get(`/staff/${id}/services`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getBookingsByStaffId = async (id) => {
    try {
        const response = await axiosInstance.get(`/staff/${id}/bookings`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Fetch all socials for a store
export const fetchSocials = async (storeId) => {
    try {
        const response = await axiosInstance.get(`/socials/${storeId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching socials:', error);
        throw error;
    }
};

// Create a new social media link
export const createSocial = async (socialData) => {
    try {
        const response = await axiosInstance.post('/socials', socialData);
        return response.data;
    } catch (error) {
        console.error('Error creating social media link:', error);
        throw error;
    }
};

// Update an existing social media link
export const updateSocial = async (socialId, socialData) => {
    try {
        const response = await axiosInstance.put(`/socials/${socialId}`, socialData);
        return response.data;
    } catch (error) {
        console.error('Error updating social media link:', error);
        throw error;
    }
};

// Delete a social media link
export const deleteSocial = async (socialId) => {
    try {
        const response = await axiosInstance.delete(`/socials/${socialId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting social media link:', error);
        throw error;
    }
};

export const fetchReviews = async () => {
    try {
        const response = await axiosInstance.get('/stores/eff53f50-b48a-11ef-915d-a3ac7236b7f5/reviews');
        return response.data;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
}