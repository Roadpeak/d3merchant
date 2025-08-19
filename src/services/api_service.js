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
            throw new Error('Merchant information not found. Please log in again.');
        }

        console.log('🔍 Getting stores for merchant:', merchant.id);

        // Try to get stores for this merchant
        const storesResponse = await getMerchantStores();
        const stores = storesResponse?.stores || storesResponse || [];

        console.log('🏪 Found stores:', stores.length);

        if (stores && stores.length > 0) {
            console.log('✅ Using store:', stores[0].name, '(' + stores[0].id + ')');
            return stores[0].id;
        }

        // If no stores found, throw a more specific error
        throw new Error('No store found for this merchant');
    } catch (error) {
        console.error('❌ Error getting merchant store ID:', error);
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

export const getMerchantStores = async () => {
    try {
        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found');
        }

        console.log('🏪 Fetching stores for merchant:', merchant.id);

        // Use the correct endpoint that matches your store routes
        const response = await axiosInstance.get('/stores/merchant/my-stores', {
            headers: getAuthHeaders()
        });

        console.log('✅ Stores fetched successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching merchant stores:', error);
        handleApiError(error, 'fetching merchant stores');
        throw error;
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

// ===== OFFERS FUNCTIONS (FIXED) =====

// Fetch all offers for current merchant - ENHANCED VERSION
export const fetchOffers = async () => {
    try {
        console.log('🔍 Starting fetchOffers...');

        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found. Please log in again.');
        }

        console.log('👤 Merchant found:', merchant.id);

        // Get merchant's stores first
        let storeId;
        try {
            const storesResponse = await getMerchantStores();
            const stores = storesResponse?.stores || storesResponse || [];

            if (stores.length === 0) {
                console.log('⚠️ No stores found for merchant');
                return {
                    offers: [],
                    message: 'No store found. Please create a store first.'
                };
            }

            storeId = stores[0].id; // Use first store
            console.log('🏪 Using store ID:', storeId);

        } catch (storeError) {
            console.error('❌ Store check failed:', storeError);
            return {
                offers: [],
                error: 'Unable to get store information',
                message: 'Please ensure you have created a store first.'
            };
        }

        // Now fetch offers using the correct endpoint with store_id parameter
        try {
            console.log('📋 Fetching offers for store:', storeId);

            // Option 1: Use the store-specific endpoint
            const response = await axiosInstance.get(`/offers/store/${storeId}`, {
                headers: getAuthHeaders()
            });

            const offers = response.data?.offers || [];
            console.log('✅ Offers fetched successfully:', offers.length);

            return {
                offers: Array.isArray(offers) ? offers : [],
                message: offers.length === 0 ? 'No offers found. Create your first offer!' : undefined
            };

        } catch (offerError) {
            console.log('⚠️ Store-specific offer fetch failed, trying general endpoint...');

            // Option 2: Use general endpoint with store_id parameter
            try {
                const response = await axiosInstance.get(`/offers?store_id=${storeId}`, {
                    headers: getAuthHeaders()
                });

                const offers = response.data?.offers || [];
                console.log('✅ Offers from general endpoint:', offers.length);

                return {
                    offers: Array.isArray(offers) ? offers : [],
                    message: offers.length === 0 ? 'No offers found. Create your first offer!' : undefined
                };

            } catch (generalError) {
                console.error('❌ General offer fetch also failed:', generalError);

                return {
                    offers: [],
                    error: generalError.message,
                    message: 'Unable to load offers. Please try again.'
                };
            }
        }

    } catch (error) {
        console.error('❌ fetchOffers error:', error);

        return {
            offers: [],
            error: error.message,
            message: 'Failed to load offers. Please check your connection and try again.'
        };
    }
};

// Create a new offer - ENHANCED VERSION
export const createOffer = async (offerData) => {
    try {
        console.log('📝 Creating offer:', offerData);

        // Validate required fields
        if (!offerData.service_id || !offerData.discount || !offerData.expiration_date) {
            throw new Error('Service, discount, and expiration date are required');
        }

        // Ensure we have a valid expiration date
        const expirationDate = new Date(offerData.expiration_date);
        if (expirationDate <= new Date()) {
            throw new Error('Expiration date must be in the future');
        }

        const response = await axiosInstance.post('/offers', offerData, {
            headers: getAuthHeaders()
        });

        console.log('✅ Offer created successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Create offer error:', error);
        handleApiError(error, 'creating offer');
    }
};

// Update an existing offer
export const updateOffer = async (offerId, offerData) => {
    try {
        console.log('🔄 Updating offer:', offerId, offerData);

        const response = await axiosInstance.put(`/offers/${offerId}`, offerData, {
            headers: getAuthHeaders()
        });

        console.log('✅ Offer updated successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Update offer error:', error);
        handleApiError(error, 'updating offer');
    }
};

// Delete an offer
export const deleteOffer = async (offerId) => {
    try {
        console.log('🗑️ Deleting offer:', offerId);

        const response = await axiosInstance.delete(`/offers/${offerId}`, {
            headers: getAuthHeaders()
        });

        console.log('✅ Offer deleted successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Delete offer error:', error);
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

// ===== FILE UPLOAD (FIXED) =====

// Upload an image with better error handling and endpoint detection
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
        formData.append('file', file); // Your server expects 'file' field
        formData.append('folder', folder);

        console.log('📤 Uploading image:', file.name, 'Size:', file.size);

        // Use the correct endpoint path from your server routes
        const response = await axiosInstance.post('/upload/files/upload-image', formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('✅ Upload response:', response.data);

        // Your server returns { message, url }
        return {
            fileUrl: response.data.url,
            url: response.data.url,
            data: { url: response.data.url }
        };
    } catch (error) {
        console.error('❌ Upload error:', error);

        // If the main upload fails, provide a fallback
        if (error.response?.status === 404) {
            console.log('⚠️ Upload endpoint not found, using base64 fallback');

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        fileUrl: e.target.result,
                        url: e.target.result,
                        data: { url: e.target.result }
                    });
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });
        }

        handleApiError(error, 'uploading image');
    }
};

// Alternative: Simple upload without multiple endpoints
export const uploadImageSimple = async (file, folder = 'services') => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Create a simple base64 data URL as fallback
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    fileUrl: e.target.result, // Base64 data URL
                    url: e.target.result,
                    data: { url: e.target.result }
                });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('❌ Simple upload error:', error);
        throw error;
    }
};

// ===== STAFF MANAGEMENT (UPDATED) =====

// Fetch all staff with optional filtering parameters
export const fetchStaff = async (params = {}) => {
    try {
        console.log('🔍 Fetching staff with params:', params);

        let endpoint = '/staff';
        const queryParams = new URLSearchParams();

        // Add query parameters
        if (params.storeId) queryParams.append('storeId', params.storeId);
        if (params.branchId) queryParams.append('branchId', params.branchId);
        if (params.status) queryParams.append('status', params.status);
        if (params.role) queryParams.append('role', params.role);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const queryString = queryParams.toString();
        if (queryString) {
            endpoint += `?${queryString}`;
        }

        console.log('🔗 Staff API endpoint:', endpoint);

        const response = await axiosInstance.get(endpoint, {
            headers: getAuthHeaders()
        });

        console.log('📊 Staff API response:', response.data);

        // Handle different response formats
        const data = response.data;
        if (data.staff) {
            return data; // Return full response with pagination
        }
        return { staff: Array.isArray(data) ? data : [] };

    } catch (error) {
        console.error('❌ Error fetching staff:', error);
        handleApiError(error, 'fetching staff');
    }
};

// Fetch staff for a specific store (convenience function)
export const fetchStaffByStore = async (storeId) => {
    try {
        console.log('🏪 Fetching staff for store:', storeId);

        const response = await axiosInstance.get(`/staff/store/${storeId}`, {
            headers: getAuthHeaders()
        });

        console.log('✅ Store staff response:', response.data);

        // Handle different response formats from the backend
        const staffData = response.data?.staff || response.data || [];
        return { staff: Array.isArray(staffData) ? staffData : [] };
    } catch (error) {
        console.error('❌ Error fetching store staff:', error);
        handleApiError(error, 'fetching store staff');
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

// Create staff member (updated with better validation)
export const createStaff = async (staffData) => {
    try {
        console.log('👤 Creating staff with data:', staffData);

        // Validate required fields
        if (!staffData.name || !staffData.email) {
            throw new Error('Name and email are required');
        }

        // Ensure we have a store_id
        let payload = { ...staffData };
        if (!payload.storeId && !payload.store_id) {
            const storeId = await getMerchantStoreId();
            payload.storeId = storeId;
        }

        console.log('📤 Sending staff payload:', payload);

        const response = await axiosInstance.post('/staff', payload, {
            headers: getAuthHeaders()
        });

        console.log('✅ Staff creation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Create staff error:', error);
        handleApiError(error, 'creating staff');
    }
};

// Update staff member
export const updateStaff = async (staffId, staffData) => {
    try {
        console.log('🔄 Updating staff:', staffId, 'with data:', staffData);

        const response = await axiosInstance.put(`/staff/${staffId}`, staffData, {
            headers: getAuthHeaders()
        });

        console.log('✅ Staff update response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Update staff error:', error);
        handleApiError(error, 'updating staff');
    }
};

// Delete staff member
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

// Get staff by ID
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

// ===== CLIENT MANAGEMENT SERVICES =====

// Fetch store followers
export const fetchStoreFollowers = async (storeId) => {
    try {
        console.log('📋 Fetching followers for store:', storeId);

        const response = await axiosInstance.get(`/follow/store/${storeId}/followers`, {
            headers: getAuthHeaders()
        });

        console.log('✅ Store followers response:', response.data);

        // Handle different response formats from the backend
        const followersData = response.data?.followers || response.data?.data || response.data || [];
        return {
            success: true,
            followers: Array.isArray(followersData) ? followersData : []
        };
    } catch (error) {
        console.error('❌ Error fetching store followers:', error);
        handleApiError(error, 'fetching store followers');
    }
};

// Get all followers for current merchant's store (convenience method)
export const fetchMyStoreFollowers = async () => {
    try {
        const storeId = await getMerchantStoreId();
        return fetchStoreFollowers(storeId);
    } catch (error) {
        handleApiError(error, 'fetching my store followers');
    }
};

// Enhanced booking fetching with customer details
export const fetchBookingsWithCustomers = async () => {
    try {
        console.log('👥 Fetching bookings with customer details');

        const response = await axiosInstance.get('/bookings', {
            headers: getAuthHeaders(),
            params: {
                include: 'user,service,offer',
                includeCustomerDetails: true
            }
        });

        console.log('✅ Bookings with customers response:', response.data);

        const bookingsData = response.data?.bookings || response.data?.data || response.data || [];
        return {
            success: true,
            bookings: Array.isArray(bookingsData) ? bookingsData : []
        };
    } catch (error) {
        console.error('❌ Error fetching bookings with customers:', error);
        handleApiError(error, 'fetching bookings with customers');
    }
};

// Get customer analytics for the merchant's store
export const getCustomerAnalytics = async () => {
    try {
        console.log('📊 Fetching customer analytics');

        const storeId = await getMerchantStoreId();
        const response = await axiosInstance.get(`/analytics/customers/${storeId}`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        console.error('❌ Error fetching customer analytics:', error);
        // Return empty analytics if endpoint doesn't exist
        return {
            success: true,
            analytics: {
                totalCustomers: 0,
                totalFollowers: 0,
                newThisMonth: 0,
                repeatCustomers: 0
            }
        };
    }
};

// Send bulk email to clients
export const sendBulkEmail = async (recipients, subject, message, emailType = 'marketing') => {
    try {
        console.log('📧 Sending bulk email to:', recipients.length, 'recipients');

        const response = await axiosInstance.post('/communications/bulk-email', {
            recipients,
            subject,
            message,
            emailType,
            senderType: 'merchant'
        }, {
            headers: getAuthHeaders()
        });

        console.log('✅ Bulk email sent successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error sending bulk email:', error);
        handleApiError(error, 'sending bulk email');
    }
};

// Get client communication history
export const getClientCommunications = async (clientId, clientType = 'user') => {
    try {
        const response = await axiosInstance.get(`/communications/client/${clientId}`, {
            headers: getAuthHeaders(),
            params: { clientType }
        });

        return response.data;
    } catch (error) {
        console.error('❌ Error fetching client communications:', error);
        handleApiError(error, 'fetching client communications');
    }
};

// Update client VIP status
export const updateClientVipStatus = async (clientId, isVip, reason = '') => {
    try {
        console.log('⭐ Updating VIP status for client:', clientId, 'to:', isVip);

        const response = await axiosInstance.put(`/clients/${clientId}/vip-status`, {
            isVip,
            reason
        }, {
            headers: getAuthHeaders()
        });

        console.log('✅ VIP status updated successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Error updating VIP status:', error);
        handleApiError(error, 'updating VIP status');
    }
};

// Add client notes
export const addClientNote = async (clientId, note, noteType = 'general') => {
    try {
        const response = await axiosInstance.post(`/clients/${clientId}/notes`, {
            note,
            noteType,
            addedBy: 'merchant'
        }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handleApiError(error, 'adding client note');
    }
};

// Get client notes
export const getClientNotes = async (clientId) => {
    try {
        const response = await axiosInstance.get(`/clients/${clientId}/notes`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handleApiError(error, 'fetching client notes');
    }
};

// Block/unblock client
export const updateClientBlockStatus = async (clientId, isBlocked, reason = '') => {
    try {
        console.log('🚫 Updating block status for client:', clientId, 'to:', isBlocked);

        const response = await axiosInstance.put(`/clients/${clientId}/block-status`, {
            isBlocked,
            reason
        }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        handleApiError(error, 'updating client block status');
    }
};

// Export client data
export const exportClientData = async (filters = {}, format = 'csv') => {
    try {
        console.log('📤 Exporting client data with filters:', filters);

        const response = await axiosInstance.post('/clients/export', {
            filters,
            format,
            includeFollowers: true,
            includeCustomers: true
        }, {
            headers: getAuthHeaders(),
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `clients-export-${new Date().toISOString().split('T')[0]}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Export completed successfully' };
    } catch (error) {
        handleApiError(error, 'exporting client data');
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
    refreshAuthToken,

 // Client Management - NEW
    fetchStoreFollowers,
    fetchMyStoreFollowers,
    fetchBookingsWithCustomers,
    getCustomerAnalytics,
    sendBulkEmail,
    getClientCommunications,
    updateClientVipStatus,
    addClientNote,
    getClientNotes,
    updateClientBlockStatus,
    exportClientData,

};