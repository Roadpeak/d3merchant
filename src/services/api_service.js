import axiosInstance from "./axiosInstance";
import merchantAuthService from "./merchantAuthService";

// Enhanced API service with better error handling and auth integration

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = merchantAuthService.getToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

// Helper function to handle API errors
const handleApiError = (error, context = '') => {
    console.error(`API Error ${context}:`, error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
        merchantAuthService.logout();
        throw new Error('Session expired. Please log in again.');
    }
    
    // Handle other HTTP errors
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your connection.');
    }
    
    // Handle specific 404 errors for services
    if (error.response?.status === 404 && context.includes('services')) {
        throw new Error('Services not found for your store. Please check if you have created a store first.');
    }
    
    throw error;
};

// Helper function to get merchant's store ID
const getMerchantStoreId = async () => {
    try {
        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found');
        }

        // First try to get stores for this merchant
        const stores = await getMerchantStores();
        if (stores && stores.length > 0) {
            return stores[0].id;
        }
        
        // If no stores found, throw a more helpful error
        throw new Error('No store found. Please create a store first before adding services.');
    } catch (error) {
        console.error('Error getting merchant store ID:', error);
        throw error;
    }
};

// ===== MERCHANT AUTH SERVICES =====

// Merchant login
export const loginUser = async (credentials) => {
    try {
        const response = await axiosInstance.post('/merchants/login', credentials);
        return response.data;
    } catch (error) {
        handleApiError(error, 'logging in');
    }
};

// Merchant signup
export const signupUser = async (userData) => {
    try {
        const response = await axiosInstance.post('/merchants/register', userData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'signing up');
    }
};

// Get merchant profile
export const getProfile = async (merchantId) => {
    try {
        const response = await axiosInstance.get(`/merchants/${merchantId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching profile');
    }
};

// Update merchant profile
export const updateProfile = async (merchantId, profileData) => {
    try {
        const response = await axiosInstance.put(`/merchants/${merchantId}`, profileData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'updating profile');
    }
};

// Request password reset
export const requestPasswordReset = async (email) => {
    try {
        const response = await axiosInstance.post('/merchants/request-password-reset', { email });
        return response.data;
    } catch (error) {
        handleApiError(error, 'requesting password reset');
    }
};

// Reset password
export const resetPassword = async (email, otp, newPassword) => {
    try {
        const response = await axiosInstance.post('/merchants/reset-password', {
            email,
            otp,
            newPassword
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'resetting password');
    }
};

// ===== STORE SERVICES =====

// Create store (enhanced with better error handling)
export const createStore = async (storeData) => {
    try {
        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found. Please log in again.');
        }

        const storeDataWithMerchant = {
            ...storeData,
            merchant_id: merchant.id
        };

        const response = await axiosInstance.post('/stores', storeDataWithMerchant, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'creating store');
    }
};

// Get merchant's stores
export const getMerchantStores = async () => {
    try {
        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found');
        }

        const response = await axiosInstance.get(`/stores/merchant/${merchant.id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching merchant stores');
    }
};

// Update store
export const updateStore = async (storeId, storeData) => {
    try {
        const response = await axiosInstance.put(`/stores/${storeId}`, storeData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'updating store');
    }
};

// ===== SERVICES =====

// Fetch all services for current merchant - FIXED VERSION
export const fetchServices = async () => {
    try {
        console.log('🔍 Starting fetchServices...');
        
        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found. Please log in again.');
        }

        console.log('👤 Merchant found:', merchant.id);

        // Try multiple endpoints to fetch services
        let services = [];
        
        try {
            // Option 1: Try to get services by store ID
            const storeId = await getMerchantStoreId();
            console.log('🏪 Store ID found:', storeId);
            
            const response = await axiosInstance.get(`/services/store/${storeId}`, {
                headers: getAuthHeaders()
            });
            services = response.data?.services || response.data || [];
            console.log('✅ Services from store endpoint:', services);
            
        } catch (storeError) {
            console.log('⚠️ Store-based service fetch failed, trying direct approach:', storeError.message);
            
            try {
                // Option 2: Try to get all services and filter by merchant
                const response = await axiosInstance.get('/services', {
                    headers: getAuthHeaders()
                });
                const allServices = response.data?.services || response.data || [];
                
                // If we have stores, filter services by store
                try {
                    const stores = await getMerchantStores();
                    const storeIds = stores.map(store => store.id);
                    services = allServices.filter(service => storeIds.includes(service.store_id));
                } catch {
                    // If we can't get stores, return all services (assuming they belong to the merchant)
                    services = allServices;
                }
                
                console.log('✅ Services from general endpoint:', services);
                
            } catch (generalError) {
                console.log('⚠️ General service fetch failed:', generalError.message);
                throw new Error('Unable to fetch services. Please ensure you have created a store first.');
            }
        }

        return { 
            services: Array.isArray(services) ? services : [],
            message: services.length === 0 ? 'No services found' : undefined
        };
        
    } catch (error) {
        console.error('❌ fetchServices error:', error);
        handleApiError(error, 'fetching services');
    }
};

// Fetch service by ID
export const fetchServiceById = async (serviceId) => {
    try {
        const response = await axiosInstance.get(`/services/${serviceId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching service');
    }
};

// Create a new service
export const createService = async (serviceData) => {
    try {
        // Ensure we have a store_id
        if (!serviceData.store_id) {
            const storeId = await getMerchantStoreId();
            serviceData.store_id = storeId;
        }

        const response = await axiosInstance.post('/services', serviceData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'creating service');
    }
};

// Update service
export const updateService = async (serviceId, serviceData) => {
    try {
        const response = await axiosInstance.put(`/services/${serviceId}`, serviceData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'updating service');
    }
};

// Delete service
export const deleteService = async (serviceId) => {
    try {
        const response = await axiosInstance.delete(`/services/${serviceId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'deleting service');
    }
};

// ===== OFFERS =====

// Fetch all offers for current merchant
export const fetchOffers = async () => {
    try {
        const storeId = await getMerchantStoreId();
        const response = await axiosInstance.get(`/offers/store/${storeId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching offers');
    }
};

// Create a new offer
export const createOffer = async (offerData) => {
    try {
        const response = await axiosInstance.post('/offers', offerData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'creating offer');
    }
};

// Update an existing offer
export const updateOffer = async (offerId, offerData) => {
    try {
        const response = await axiosInstance.put(`/offers/${offerId}`, offerData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'updating offer');
    }
};

// Delete an offer
export const deleteOffer = async (offerId) => {
    try {
        const response = await axiosInstance.delete(`/offers/${offerId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'deleting offer');
    }
};

// ===== BOOKINGS =====

// Fetch bookings for current merchant's store
export const fetchBookings = async () => {
    try {
        const storeId = await getMerchantStoreId();
        const response = await axiosInstance.get(`/bookings/store/${storeId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching bookings');
    }
};

// Fetch single booking
export const fetchSingleBooking = async (bookingId) => {
    try {
        const response = await axiosInstance.get(`/bookings/${bookingId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching booking');
    }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const response = await axiosInstance.put(`/bookings/${bookingId}/status`, { status }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'updating booking status');
    }
};

// ===== FILE UPLOAD =====

// Upload an image with better error handling
export const uploadImage = async (file, folder = 'general') => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size must be less than 5MB');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await axiosInstance.post('/files/upload-image', formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'uploading image');
    }
};

// ===== STAFF MANAGEMENT =====

// Fetch all staff (updated to handle both store-specific and general queries)
export const fetchStaff = async (storeId = null) => {
    try {
        let endpoint;
        
        if (storeId) {
            // If specific store ID provided, use it
            endpoint = `/staff/store/${storeId}`;
        } else {
            // Get staff for merchant's store
            const merchantStoreId = await getMerchantStoreId();
            endpoint = `/staff/store/${merchantStoreId}`;
        }
        
        const response = await axiosInstance.get(endpoint, {
            headers: getAuthHeaders()
        });
        
        // Handle different response formats from the backend
        const staffData = response.data?.staff || response.data || [];
        return Array.isArray(staffData) ? staffData : [];
    } catch (error) {
        handleApiError(error, 'fetching staff');
    }
};

// Get all staff (for admin views)
export const getAllStaff = async () => {
    try {
        const response = await axiosInstance.get('/staff', {
            headers: getAuthHeaders()
        });
        
        const data = response.data;
        // Handle paginated response
        if (data.staff) {
            return data.staff;
        }
        return Array.isArray(data) ? data : [];
    } catch (error) {
        handleApiError(error, 'fetching all staff');
    }
};

// Add/Create staff member (updated with better error handling)
export const createStaff = async (staffData) => {
    try {
      console.log('Creating staff with data:', staffData); // Debug log
      
      // Don't send storeId if it's not properly set
      const payload = {
        name: staffData.name,
        email: staffData.email,
        phoneNumber: staffData.phoneNumber,
        // Only include storeId if it's a valid UUID
        ...(staffData.storeId && staffData.storeId !== 'undefined' ? { storeId: staffData.storeId } : {})
      };
      
      console.log('Sending payload:', payload); // Debug log
      
      const response = await axiosInstance.post('/staff', payload, {
        headers: getAuthHeaders()
      });
      
      console.log('Staff creation response:', response.data); // Debug log
      
      return response.data;
    } catch (error) {
      console.error('Create staff error:', error.response?.data || error.message);
      handleApiError(error, 'creating staff');
    }
  };
// Update staff member
export const updateStaff = async (staffId, staffData) => {
    try {
        const response = await axiosInstance.put(`/staff/${staffId}`, staffData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'updating staff');
    }
};

// Delete staff member (updated with better error handling)
export const deleteStaff = async (staffId) => {
    try {
        const response = await axiosInstance.delete(`/staff/${staffId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'deleting staff');
    }
};

// Get staff by ID (updated with better error handling)
export const getStaffById = async (staffId) => {
    try {
        const response = await axiosInstance.get(`/staff/${staffId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching staff member');
    }
};

// Assign staff to service
export const assignStaffToService = async (staffId, serviceId) => {
    try {
        const response = await axiosInstance.post('/staff/assign-service', 
            { staffId, serviceId }, 
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'assigning staff to service');
    }
};

// Unassign staff from service
export const unassignStaffFromService = async (staffId, serviceId) => {
    try {
        const response = await axiosInstance.post('/staff/unassign-service', 
            { staffId, serviceId }, 
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, 'unassigning staff from service');
    }
};

// Get services assigned to a staff member
export const getStaffServices = async (staffId) => {
    try {
        const response = await axiosInstance.get(`/staff/${staffId}/services`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching staff services');
    }
};

// Get bookings for a staff member
export const getStaffBookings = async (staffId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (params.status) queryParams.append('status', params.status);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.page) queryParams.append('page', params.page);

        const url = `/staff/${staffId}/bookings${queryParams.toString() ? `?${queryParams}` : ''}`;
        
        const response = await axiosInstance.get(url, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching staff bookings');
    }
};

// Get staff members assigned to a service
export const getServiceStaff = async (serviceId) => {
    try {
        const response = await axiosInstance.get(`/staff/service/${serviceId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching service staff');
    }
};

// Bulk assign staff to multiple services
export const bulkAssignStaff = async (staffId, serviceIds) => {
    try {
        const promises = serviceIds.map(serviceId => 
            assignStaffToService(staffId, serviceId)
        );
        const results = await Promise.allSettled(promises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return {
            success: true,
            message: `Assigned ${successful} services successfully. ${failed} assignments failed.`,
            successful,
            failed,
            details: results
        };
    } catch (error) {
        handleApiError(error, 'bulk assigning staff');
    }
};

// Update staff status (convenience function)
export const updateStaffStatus = async (staffId, status) => {
    try {
        return await updateStaff(staffId, { status });
    } catch (error) {
        handleApiError(error, 'updating staff status');
    }
};

// Get staff statistics
export const getStaffStats = async () => {
    try {
        const storeId = await getMerchantStoreId();
        const staff = await fetchStaff(storeId);
        
        const stats = {
            total: staff.length,
            active: staff.filter(s => s.status === 'active').length,
            suspended: staff.filter(s => s.status === 'suspended').length,
            inactive: staff.filter(s => s.status === 'inactive').length
        };
        
        return stats;
    } catch (error) {
        handleApiError(error, 'calculating staff statistics');
    }
};

// ===== SOCIALS =====

// Fetch all socials for current merchant's store
export const fetchSocials = async () => {
    try {
        const storeId = await getMerchantStoreId();
        const response = await axiosInstance.get(`/socials/${storeId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching social media links');
    }
};

// Create a new social media link
export const createSocial = async (socialData) => {
    try {
        const response = await axiosInstance.post('/socials', socialData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'creating social media link');
    }
};

// Update an existing social media link
export const updateSocial = async (socialId, socialData) => {
    try {
        const response = await axiosInstance.put(`/socials/${socialId}`, socialData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'updating social media link');
    }
};

// Delete a social media link
export const deleteSocial = async (socialId) => {
    try {
        const response = await axiosInstance.delete(`/socials/${socialId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'deleting social media link');
    }
};

// ===== REVIEWS =====

// Fetch reviews for current merchant's store
export const fetchReviews = async () => {
    try {
        const storeId = await getMerchantStoreId();
        const response = await axiosInstance.get(`/stores/${storeId}/reviews`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching reviews');
    }
};

// Respond to a review
export const respondToReview = async (reviewId, response) => {
    try {
        const responseData = await axiosInstance.post(`/reviews/${reviewId}/respond`, 
            { response }, 
            { headers: getAuthHeaders() }
        );
        return responseData.data;
    } catch (error) {
        handleApiError(error, 'responding to review');
    }
};

// ===== ANALYTICS =====

// Get merchant analytics
export const getAnalytics = async (timeRange = '7d') => {
    try {
        const storeId = await getMerchantStoreId();
        const response = await axiosInstance.get(`/analytics/store/${storeId}?range=${timeRange}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching analytics');
    }
};

// ===== FORMS =====

// Create form
export const createForm = async (formData) => {
    try {
        const response = await axiosInstance.post('/forms', formData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'creating form');
    }
};

// ===== UTILITY FUNCTIONS =====

// Test API connection
export const testConnection = async () => {
    try {
        const response = await axiosInstance.get('/health');
        return response.data;
    } catch (error) {
        handleApiError(error, 'testing connection');
    }
};

// Get dashboard summary data
export const getDashboardData = async () => {
    try {
        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found');
        }

        // Fetch multiple data sources in parallel with error handling
        const [bookingsResult, servicesResult, offersResult] = await Promise.allSettled([
            fetchBookings(),
            fetchServices(),
            fetchOffers()
        ]);

        return {
            bookings: bookingsResult.status === 'fulfilled' ? bookingsResult.value : { bookings: [] },
            services: servicesResult.status === 'fulfilled' ? servicesResult.value : { services: [] },
            offers: offersResult.status === 'fulfilled' ? offersResult.value : { offers: [] }
        };
    } catch (error) {
        handleApiError(error, 'fetching dashboard data');
    }
};

// Refresh auth token if needed
export const refreshAuthToken = async () => {
    try {
        const currentToken = merchantAuthService.getToken();
        if (!currentToken) {
            throw new Error('No token to refresh');
        }

        const response = await axiosInstance.post('/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${currentToken}` }
        });

        // Update stored auth data with new token
        const authData = merchantAuthService.getAuthData();
        if (authData) {
            authData.token = response.data.access_token;
            merchantAuthService.storeAuthData(authData);
        }

        return response.data;
    } catch (error) {
        handleApiError(error, 'refreshing token');
    }
};

// ===== DEFAULT EXPORT =====

export default {
    // Auth
    loginUser,
    signupUser,
    getProfile,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    
    // Stores
    createStore,
    getMerchantStores,
    updateStore,
    
    // Services
    fetchServices,
    fetchServiceById,
    createService,
    updateService,
    deleteService,
    
    // Offers
    fetchOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    
    // Bookings
    fetchBookings,
    fetchSingleBooking,
    updateBookingStatus,
    
    // Staff - Updated and Expanded
    fetchStaff,
    getAllStaff,
    // addStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffById,
    assignStaffToService,
    unassignStaffFromService,
    getStaffServices,
    getStaffBookings,
    getServiceStaff,
    bulkAssignStaff,
    updateStaffStatus,
    getStaffStats,
    
    // Socials
    fetchSocials,
    createSocial,
    updateSocial,
    deleteSocial,
    
    // Reviews
    fetchReviews,
    respondToReview,
    
    // Analytics
    getAnalytics,
    
    // Files
    uploadImage,
    
    // Forms
    createForm,
    
    // Dashboard
    getDashboardData,
    
    // Utilities
    testConnection,
    refreshAuthToken
};