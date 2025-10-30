// bookingApiService.js - Dedicated API service for booking operations

import axiosInstance from "./axiosInstance";
import merchantAuthService from "./merchantAuthService";

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = merchantAuthService.getToken();
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_KEY || 'API_KEY_12345ABCDEF!@#67890-xyZQvTPOl'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};


// Helper function to handle API errors
const handleApiError = (error, context = '') => {
    console.error(`Booking API Error ${context}:`, error);

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

    throw error;
};

// Helper function to get merchant's store ID
const getMerchantStoreId = async () => {
    try {
        const merchant = merchantAuthService.getCurrentMerchant();
        if (!merchant) {
            throw new Error('Merchant information not found. Please log in again.');
        }

        console.log('🏪 Current merchant data:', merchant);

        // Try multiple possible locations for store ID in merchant object
        let storeId = merchant.storeId || 
                      merchant.store_id || 
                      merchant.defaultStoreId ||
                      merchant.default_store_id ||
                      merchant.store?.id ||
                      merchant.id; // Sometimes merchant.id IS the store owner ID

        if (storeId) {
            console.log('✅ Found store ID in merchant data:', storeId);
            return storeId;
        }

        console.warn('⚠️ No store ID in merchant data. Trying profile endpoint...');
        
        // Try to get from merchant profile
        try {
            const profileResponse = await merchantAuthService.getCurrentMerchantProfile();
            console.log('📋 Profile response:', profileResponse);
            
            if (profileResponse) {
                storeId = profileResponse.storeId ||
                         profileResponse.store_id ||
                         profileResponse.merchant?.storeId ||
                         profileResponse.merchant?.store_id ||
                         profileResponse.merchantProfile?.storeId;
                
                if (storeId) {
                    console.log('✅ Found store ID in profile:', storeId);
                    merchantAuthService.updateMerchantData({ storeId });
                    return storeId;
                }
            }
        } catch (profileError) {
            console.warn('⚠️ Profile fetch failed:', profileError.message);
        }

        // Try stores endpoint
        console.warn('⚠️ Trying stores endpoint...');
        try {
            // Try different possible stores endpoints
            const endpoints = [
                '/stores/merchant',
                '/merchant/stores', 
                '/stores'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔍 Trying endpoint: ${endpoint}`);
                    const response = await axiosInstance.get(endpoint, {
                        headers: getAuthHeaders()
                    });
                    
                    console.log(`📦 Response from ${endpoint}:`, response.data);
                    
                    const stores = response.data?.stores || response.data?.data?.stores || [];
                    
                    if (stores && stores.length > 0) {
                        storeId = stores[0].id;
                        console.log(`✅ Found store ID from ${endpoint}:`, storeId);
                        merchantAuthService.updateMerchantData({ storeId });
                        return storeId;
                    }
                } catch (endpointError) {
                    console.warn(`⚠️ ${endpoint} failed:`, endpointError.message);
                    continue;
                }
            }
        } catch (storesError) {
            console.warn('⚠️ All stores endpoints failed:', storesError.message);
        }
        
        // Last resort: use merchant ID as store ID
        console.warn('⚠️ Using merchant ID as store ID (last resort)');
        storeId = merchant.id;
        
        if (storeId) {
            console.log('✅ Using merchant ID as store ID:', storeId);
            return storeId;
        }
        
        throw new Error('Could not determine store ID. Please contact support.');
    } catch (error) {
        console.error('❌ Error getting merchant store ID:', error);
        throw error;
    }
};

// ===== SERVICE BOOKING METHODS =====

/**
 * Get all service bookings for the current merchant
 * FIXED: Now calls the correct endpoint with storeId
 */
export const getMerchantServiceBookings = async (params = {}) => {
    try {
        console.log('🔍 Fetching merchant service bookings with params:', params);

        // Get merchant's store ID
        const storeId = await getMerchantStoreId();

        if (!storeId) {
            throw new Error('Store ID not found. Please ensure you have a store configured.');
        }

        console.log('📍 Using store ID:', storeId);

        // Build query parameters
        const queryParams = new URLSearchParams({
            limit: params.limit || 50,
            offset: params.offset || 0,
            ...(params.status && { status: params.status }),
            ...(params.startDate && { startDate: params.startDate }),
            ...(params.endDate && { endDate: params.endDate })
        });

        // FIXED: Call the correct endpoint that matches your backend route
        const endpoint = `/bookings/merchant/store/${storeId}?${queryParams}`;
        console.log('🌐 Calling endpoint:', endpoint);

        const response = await axiosInstance.get(endpoint, {
            headers: getAuthHeaders()
        });

        console.log('✅ Service bookings response:', response.data);

        if (response.data.success) {
            return {
                success: true,
                bookings: response.data.bookings || [],
                pagination: response.data.pagination,
                summary: response.data.summary,
                storeId: storeId // Include for debugging
            };
        }

        return response.data;
    } catch (error) {
        console.error('❌ Error fetching merchant service bookings:', error);
        console.error('Error response:', error.response?.data);

        // Fallback to mock data for development (with correct storeId)
        if (error.response?.status === 404 || error.response?.status === 501) {
            console.log('⚠️ Using mock data fallback');
            const storeId = await getMerchantStoreId().catch(() => null);
            return generateMockServiceBookings(params.limit || 20, storeId);
        }

        handleApiError(error, 'fetching service bookings');
    }
};
/**
 * Get specific service booking by ID
 */
export const getServiceBookingById = async (bookingId) => {
    try {
        console.log('Fetching service booking by ID:', bookingId);

        const response = await axiosInstance.get(`/merchant/bookings/services/${bookingId}`, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data;
        }

        throw new Error(response.data.message || 'Failed to fetch service booking');
    } catch (error) {
        console.error('Error fetching service booking by ID:', error);
        handleApiError(error, 'fetching service booking');
    }
};

/**
 * Update service booking status
 */
export const updateServiceBookingStatus = async (bookingId, status, notes = '') => {
    try {
        console.log('Updating service booking status:', { bookingId, status, notes });

        const response = await axiosInstance.put(`/merchant/bookings/services/${bookingId}/status`, {
            status,
            notes
        }, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data;
        }

        throw new Error(response.data.message || 'Failed to update booking status');
    } catch (error) {
        console.error('Error updating service booking status:', error);
        handleApiError(error, 'updating service booking status');
    }
};

/**
 * Check in a service booking
 */
export const checkInServiceBooking = async (bookingId, arrivalTime = null, notes = '') => {
    try {
        const checkInData = {
            status: 'in_progress',
            notes: notes || 'Customer checked in',
            checkedInAt: new Date().toISOString(),
            actualArrivalTime: arrivalTime || new Date().toTimeString().slice(0, 5)
        };

        return await updateServiceBookingStatus(bookingId, 'in_progress',
            `${notes || 'Customer checked in'}. Arrival time: ${checkInData.actualArrivalTime}`);
    } catch (error) {
        console.error('Error checking in service booking:', error);
        handleApiError(error, 'checking in service booking');
    }
};

/**
 * Complete a service booking
 */
export const completeServiceBooking = async (bookingId, notes = '') => {
    try {
        return await updateServiceBookingStatus(bookingId, 'completed',
            notes || 'Service completed successfully');
    } catch (error) {
        console.error('Error completing service booking:', error);
        handleApiError(error, 'completing service booking');
    }
};

/**
 * Confirm a service booking
 */
export const confirmServiceBooking = async (bookingId, notes = '') => {
    try {
        return await updateServiceBookingStatus(bookingId, 'confirmed',
            notes || 'Booking confirmed by merchant');
    } catch (error) {
        console.error('Error confirming service booking:', error);
        handleApiError(error, 'confirming service booking');
    }
};

/**
 * Cancel a service booking
 */
export const cancelServiceBooking = async (bookingId, reason = '') => {
    try {
        return await updateServiceBookingStatus(bookingId, 'cancelled',
            reason || 'Booking cancelled by merchant');
    } catch (error) {
        console.error('Error cancelling service booking:', error);
        handleApiError(error, 'cancelling service booking');
    }
};

// ==========================================
// ENHANCED SERVICE BOOKING ACTION METHODS
// ==========================================

/**
 * Enhanced check in a service booking (using new dedicated endpoint)
 */
export const checkInServiceBookingEnhanced = async (bookingId, arrivalTime = null, notes = '') => {
    try {
        console.log('Enhanced checking in service booking:', { bookingId, arrivalTime, notes });

        const response = await axiosInstance.put(`/merchant/bookings/services/${bookingId}/checkin`, {
            arrivalTime: arrivalTime || new Date().toTimeString().slice(0, 5),
            notes: notes || 'Customer checked in'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Check-in failed');
        }
    } catch (error) {
        console.error('Error checking in service booking:', error);
        handleApiError(error, 'checking in service booking');
    }
};

/**
 * Enhanced confirm a service booking (using new dedicated endpoint)
 */
export const confirmServiceBookingEnhanced = async (bookingId, notes = '') => {
    try {
        console.log('Enhanced confirming service booking:', { bookingId, notes });

        const response = await axiosInstance.put(`/merchant/bookings/services/${bookingId}/confirm`, {
            notes: notes || 'Confirmed by merchant'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Confirmation failed');
        }
    } catch (error) {
        console.error('Error confirming service booking:', error);
        handleApiError(error, 'confirming service booking');
    }
};

/**
 * Enhanced complete a service booking (using new dedicated endpoint)
 */
export const completeServiceBookingEnhanced = async (bookingId, notes = '', actualDuration = null, rating = null) => {
    try {
        console.log('Enhanced completing service booking:', { bookingId, notes, actualDuration, rating });

        const response = await axiosInstance.put(`/merchant/bookings/services/${bookingId}/complete`, {
            notes: notes || 'Service completed',
            actualDuration,
            rating
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Completion failed');
        }
    } catch (error) {
        console.error('Error completing service booking:', error);
        handleApiError(error, 'completing service booking');
    }
};

/**
 * Enhanced cancel a service booking (using new dedicated endpoint)
 */
export const cancelServiceBookingEnhanced = async (bookingId, reason = '', refundRequested = false) => {
    try {
        console.log('Enhanced cancelling service booking:', { bookingId, reason, refundRequested });

        const response = await axiosInstance.put(`/merchant/bookings/services/${bookingId}/cancel`, {
            reason: reason || 'Cancelled by merchant',
            refundRequested
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Cancellation failed');
        }
    } catch (error) {
        console.error('Error cancelling service booking:', error);
        handleApiError(error, 'cancelling service booking');
    }
};

/**
 * Enhanced update service booking status (using new dedicated endpoint)
 */
export const updateServiceBookingStatusEnhanced = async (bookingId, status, notes = '') => {
    try {
        console.log('Enhanced updating service booking status:', { bookingId, status, notes });

        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
        }

        const response = await axiosInstance.put(`/merchant/bookings/services/${bookingId}/status`, {
            status,
            notes
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Status update failed');
        }
    } catch (error) {
        console.error('Error updating service booking status:', error);
        handleApiError(error, 'updating service booking status');
    }
};

// ==========================================
// NEW BULK OPERATIONS FOR SERVICE BOOKINGS
// ==========================================

/**
 * Bulk update service booking statuses (enhanced)
 */
export const bulkUpdateServiceBookingStatusEnhanced = async (bookingIds, status, notes = '') => {
    try {
        console.log('Enhanced bulk updating service booking statuses:', { bookingIds, status, notes });

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            throw new Error('Booking IDs array is required and cannot be empty');
        }

        if (bookingIds.length > 50) {
            throw new Error('Cannot update more than 50 bookings at once');
        }

        const response = await axiosInstance.put('/merchant/bookings/services/bulk-status', {
            bookingIds,
            status,
            notes
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Bulk update failed');
        }
    } catch (error) {
        console.error('Error bulk updating service booking statuses:', error);
        handleApiError(error, 'bulk updating service booking statuses');
    }
};

/**
 * Bulk check-in service bookings
 */
export const bulkCheckInServiceBookings = async (bookingIds, notes = '') => {
    try {
        console.log('Bulk checking in service bookings:', { bookingIds, notes });

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            throw new Error('Booking IDs array is required and cannot be empty');
        }

        const response = await axiosInstance.put('/merchant/bookings/services/bulk-checkin', {
            bookingIds,
            notes: notes || 'Bulk check-in'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Bulk check-in failed');
        }
    } catch (error) {
        console.error('Error bulk checking in service bookings:', error);
        handleApiError(error, 'bulk checking in service bookings');
    }
};

// ==========================================
// ENHANCED MERCHANT LISTING METHODS
// ==========================================

/**
 * Get merchant's service bookings for a specific store (enhanced)
 */
export const getMerchantStoreServiceBookingsEnhanced = async (storeId, filters = {}) => {
    try {
        console.log('Enhanced getting merchant store service bookings:', { storeId, filters });

        const params = new URLSearchParams();

        if (filters.status) params.append('status', filters.status);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await axiosInstance.get(`/merchant/bookings/stores/${storeId}/services?${params}`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to fetch store service bookings');
        }
    } catch (error) {
        console.error('Error getting merchant store service bookings:', error);

        // Fallback to existing method
        try {
            return await getStoreBookings(storeId, filters);
        } catch (fallbackError) {
            handleApiError(error, 'getting merchant store service bookings');
        }
    }
};

/**
 * Get all merchant's service bookings across all stores (enhanced)
 */
export const getAllMerchantServiceBookingsEnhanced = async (filters = {}) => {
    try {
        console.log('Enhanced getting all merchant service bookings:', filters);

        const params = new URLSearchParams();

        if (filters.status) params.append('status', filters.status);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.storeId) params.append('storeId', filters.storeId);
        if (filters.serviceId) params.append('serviceId', filters.serviceId);

        const response = await axiosInstance.get(`/merchant/bookings/services?${params}`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to fetch merchant service bookings');
        }
    } catch (error) {
        console.error('Error getting all merchant service bookings:', error);

        // Fallback to existing method
        try {
            return await getMerchantServiceBookings(filters);
        } catch (fallbackError) {
            handleApiError(error, 'getting all merchant service bookings');
        }
    }
};

/**
 * Get service booking analytics (enhanced)
 */
export const getServiceBookingAnalyticsEnhanced = async (period = 30, storeId = null) => {
    try {
        console.log('Enhanced getting service booking analytics:', { period, storeId });

        const params = new URLSearchParams();
        params.append('period', period);
        if (storeId) params.append('storeId', storeId);

        const response = await axiosInstance.get(`/merchant/bookings/services/analytics?${params}`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to fetch analytics');
        }
    } catch (error) {
        console.error('Error getting service booking analytics:', error);

        // Fallback to existing analytics method
        try {
            const timeRange = period <= 1 ? '1d' : period <= 7 ? '7d' : period <= 30 ? '30d' : '90d';
            return await getBookingAnalytics(timeRange);
        } catch (fallbackError) {
            handleApiError(error, 'getting service booking analytics');
        }
    }
};

/**
 * Get specific service booking details for merchant (enhanced)
 */
export const getMerchantServiceBookingDetailsEnhanced = async (bookingId) => {
    try {
        console.log('Enhanced getting merchant service booking details:', { bookingId });

        const response = await axiosInstance.get(`/merchant/bookings/services/${bookingId}`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to fetch booking details');
        }
    } catch (error) {
        console.error('Error getting service booking details:', error);

        // Fallback to existing method
        try {
            return await getServiceBookingById(bookingId);
        } catch (fallbackError) {
            handleApiError(error, 'getting service booking details');
        }
    }
};

/**
 * Add notes to a service booking
 */
export const addServiceBookingNotes = async (bookingId, notes) => {
    try {
        console.log('Adding notes to service booking:', { bookingId, notes });

        if (!notes || notes.trim() === '') {
            throw new Error('Notes content is required');
        }

        const response = await axiosInstance.put(`/merchant/bookings/services/${bookingId}/notes`, {
            notes: notes.trim()
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to add notes');
        }
    } catch (error) {
        console.error('Error adding notes to service booking:', error);
        handleApiError(error, 'adding notes to service booking');
    }
};

// ==========================================
// QUICK ACTION METHODS (Alternative endpoints)
// ==========================================

/**
 * Quick check-in (alternative endpoint)
 */
export const quickCheckIn = async (bookingId, arrivalTime = null, notes = '') => {
    try {
        console.log('Quick check-in:', { bookingId, arrivalTime, notes });

        const response = await axiosInstance.post(`/merchant/bookings/${bookingId}/checkin`, {
            arrivalTime: arrivalTime || new Date().toTimeString().slice(0, 5),
            notes: notes || 'Customer checked in'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Quick check-in failed');
        }
    } catch (error) {
        console.error('Error with quick check-in:', error);

        // Fallback to existing method
        try {
            return await checkInServiceBooking(bookingId, arrivalTime, notes);
        } catch (fallbackError) {
            handleApiError(error, 'quick check-in');
        }
    }
};

/**
 * Quick confirm (alternative endpoint)
 */
export const quickConfirm = async (bookingId, notes = '') => {
    try {
        console.log('Quick confirm:', { bookingId, notes });

        const response = await axiosInstance.post(`/merchant/bookings/${bookingId}/confirm`, {
            notes: notes || 'Confirmed by merchant'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Quick confirm failed');
        }
    } catch (error) {
        console.error('Error with quick confirm:', error);

        // Fallback to existing method
        try {
            return await confirmServiceBooking(bookingId, notes);
        } catch (fallbackError) {
            handleApiError(error, 'quick confirm');
        }
    }
};

/**
 * Quick complete (alternative endpoint)
 */
export const quickComplete = async (bookingId, notes = '', actualDuration = null, rating = null) => {
    try {
        console.log('Quick complete:', { bookingId, notes, actualDuration, rating });

        const response = await axiosInstance.post(`/merchant/bookings/${bookingId}/complete`, {
            notes: notes || 'Service completed',
            actualDuration,
            rating
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Quick complete failed');
        }
    } catch (error) {
        console.error('Error with quick complete:', error);

        // Fallback to existing method
        try {
            return await completeServiceBooking(bookingId, notes);
        } catch (fallbackError) {
            handleApiError(error, 'quick complete');
        }
    }
};

/**
 * Quick cancel (alternative endpoint)
 */
export const quickCancel = async (bookingId, reason = '') => {
    try {
        console.log('Quick cancel:', { bookingId, reason });

        const response = await axiosInstance.post(`/merchant/bookings/${bookingId}/cancel`, {
            reason: reason || 'Cancelled by merchant'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Quick cancel failed');
        }
    } catch (error) {
        console.error('Error with quick cancel:', error);

        // Fallback to existing method
        try {
            return await cancelServiceBooking(bookingId, reason);
        } catch (fallbackError) {
            handleApiError(error, 'quick cancel');
        }
    }
};

// ==========================================
// UTILITY HELPER METHODS
// ==========================================

/**
 * Get available booking statuses
 */
export const getAvailableBookingStatuses = () => {
    return [
        { value: 'pending', label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7' },
        { value: 'confirmed', label: 'Confirmed', color: '#3b82f6', bgColor: '#dbeafe' },
        { value: 'in_progress', label: 'In Progress', color: '#eab308', bgColor: '#fef08a' },
        { value: 'completed', label: 'Completed', color: '#10b981', bgColor: '#d1fae5' },
        { value: 'cancelled', label: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2' },
        { value: 'no_show', label: 'No Show', color: '#6b7280', bgColor: '#f3f4f6' }
    ];
};

/**
 * Validate booking status
 */
export const isValidBookingStatus = (status) => {
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    return validStatuses.includes(status);
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status) => {
    const statusColors = {
        pending: '#f59e0b',      // amber
        confirmed: '#3b82f6',     // blue
        in_progress: '#eab308',   // yellow
        completed: '#10b981',     // emerald
        cancelled: '#ef4444',     // red
        no_show: '#6b7280'        // gray
    };
    return statusColors[status] || '#6b7280';
};

/**
 * Get status background color for UI
 */
export const getStatusBgColor = (status) => {
    const statusBgColors = {
        pending: '#fef3c7',      // amber-100
        confirmed: '#dbeafe',     // blue-100
        in_progress: '#fef08a',   // yellow-100
        completed: '#d1fae5',     // emerald-100
        cancelled: '#fee2e2',     // red-100
        no_show: '#f3f4f6'        // gray-100
    };
    return statusBgColors[status] || '#f3f4f6';
};

/**
 * Format booking time for display
 */
export const formatBookingTime = (dateTime) => {
    try {
        const date = new Date(dateTime);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            full: date.toLocaleString(),
            iso: date.toISOString(),
            readable: `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        };
    } catch (error) {
        console.error('Error formatting booking time:', error);
        return { date: 'Invalid', time: 'Invalid', full: 'Invalid Date', iso: '', readable: 'Invalid Date' };
    }
};

/**
 * Check if booking can be modified
 */
export const canModifyBooking = (booking) => {
    if (!booking) return false;

    const modifiableStatuses = ['pending', 'confirmed'];
    const bookingTime = new Date(booking.startTime);
    const now = new Date();

    return modifiableStatuses.includes(booking.status) && bookingTime > now;
};

/**
 * Check if booking can be checked in
 */
export const canCheckInBooking = (booking) => {
    if (!booking || booking.status !== 'confirmed') return false;

    const bookingTime = new Date(booking.startTime);
    const now = new Date();
    const timeDiff = (bookingTime - now) / (1000 * 60); // minutes

    // Allow check-in 15 minutes early and up to 2 hours after scheduled time
    return timeDiff >= -15 && timeDiff <= 120;
};

/**
 * Get booking type label
 */
export const getBookingTypeLabel = (booking) => {
    if (booking.serviceId || booking.Service || booking.bookingType === 'service') {
        return 'Service';
    }
    if (booking.offerId || booking.Offer || booking.bookingType === 'offer') {
        return 'Offer';
    }
    return 'Unknown';
};

/**
 * Calculate booking duration in minutes
 */
export const calculateBookingDuration = (startTime, endTime) => {
    try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.round((end - start) / (1000 * 60));
    } catch (error) {
        console.error('Error calculating booking duration:', error);
        return 0;
    }
};

// ===== OFFER BOOKING METHODS =====

/**
 * Get all offer bookings for the current merchant
 */
export const getMerchantOfferBookings = async (params = {}) => {
    try {
        console.log('Fetching merchant offer bookings with params:', params);

        const response = await axiosInstance.get('/merchant/bookings/offers', {
            headers: getAuthHeaders(),
            params: {
                limit: 50,
                offset: 0,
                ...params
            }
        });

        console.log('Offer bookings response:', response.data);

        if (response.data.success) {
            return {
                success: true,
                bookings: response.data.bookings || [],
                pagination: response.data.pagination,
                summary: response.data.summary
            };
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching merchant offer bookings:', error);

        // Fallback to mock data for development
        if (error.response?.status === 404 || error.response?.status === 501) {
            return generateMockOfferBookings(params.limit || 20);
        }

        handleApiError(error, 'fetching offer bookings');
    }
};

/**
 * Get specific offer booking by ID
 */
export const getOfferBookingById = async (bookingId) => {
    try {
        console.log('Fetching offer booking by ID:', bookingId);

        const response = await axiosInstance.get(`/merchant/bookings/offers/${bookingId}`, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data;
        }

        throw new Error(response.data.message || 'Failed to fetch offer booking');
    } catch (error) {
        console.error('Error fetching offer booking by ID:', error);
        handleApiError(error, 'fetching offer booking');
    }
};

/**
 * Update offer booking status
 */
export const updateOfferBookingStatus = async (bookingId, status, notes = '') => {
    try {
        console.log('Updating offer booking status:', { bookingId, status, notes });

        const response = await axiosInstance.put(`/merchant/bookings/offers/${bookingId}/status`, {
            status,
            notes
        }, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data;
        }

        throw new Error(response.data.message || 'Failed to update offer booking status');
    } catch (error) {
        console.error('Error updating offer booking status:', error);
        handleApiError(error, 'updating offer booking status');
    }
};

/**
 * Check in an offer booking
 */
export const checkInOfferBooking = async (bookingId, arrivalTime = null, notes = '') => {
    try {
        const checkInData = {
            status: 'in_progress',
            notes: notes || 'Customer checked in for offer',
            checkedInAt: new Date().toISOString(),
            actualArrivalTime: arrivalTime || new Date().toTimeString().slice(0, 5)
        };

        return await updateOfferBookingStatus(bookingId, 'in_progress',
            `${notes || 'Customer checked in for offer'}. Arrival time: ${checkInData.actualArrivalTime}`);
    } catch (error) {
        console.error('Error checking in offer booking:', error);
        handleApiError(error, 'checking in offer booking');
    }
};

/**
 * Complete an offer booking
 */
export const completeOfferBooking = async (bookingId, notes = '') => {
    try {
        return await updateOfferBookingStatus(bookingId, 'completed',
            notes || 'Offer service completed successfully');
    } catch (error) {
        console.error('Error completing offer booking:', error);
        handleApiError(error, 'completing offer booking');
    }
};

/**
 * Confirm an offer booking
 */
export const confirmOfferBooking = async (bookingId, notes = '') => {
    try {
        return await updateOfferBookingStatus(bookingId, 'confirmed',
            notes || 'Offer booking confirmed by merchant');
    } catch (error) {
        console.error('Error confirming offer booking:', error);
        handleApiError(error, 'confirming offer booking');
    }
};

/**
 * Cancel an offer booking
 */
export const cancelOfferBooking = async (bookingId, reason = '') => {
    try {
        return await updateOfferBookingStatus(bookingId, 'cancelled',
            reason || 'Offer booking cancelled by merchant');
    } catch (error) {
        console.error('Error cancelling offer booking:', error);
        handleApiError(error, 'cancelling offer booking');
    }
};

// ===== COMBINED BOOKING METHODS =====

/**
 * Get all bookings (both service and offer) for the current merchant
 */
export const getMerchantAllBookings = async (params = {}) => {
    try {
        console.log('Fetching all merchant bookings with params:', params);

        const response = await axiosInstance.get('/merchant/bookings/all', {
            headers: getAuthHeaders(),
            params: {
                limit: 50,
                offset: 0,
                ...params
            }
        });

        console.log('All bookings response:', response.data);

        if (response.data.success) {
            return {
                success: true,
                bookings: response.data.bookings || [],
                pagination: response.data.pagination,
                summary: response.data.summary
            };
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching all merchant bookings:', error);

        // Fallback: try to get both service and offer bookings separately
        try {
            console.log('Trying to combine service and offer bookings...');

            const [serviceResult, offerResult] = await Promise.allSettled([
                getMerchantServiceBookings({ ...params, limit: Math.floor((params.limit || 50) / 2) }),
                getMerchantOfferBookings({ ...params, limit: Math.floor((params.limit || 50) / 2) })
            ]);

            const serviceBookings = serviceResult.status === 'fulfilled' ? serviceResult.value.bookings || [] : [];
            const offerBookings = offerResult.status === 'fulfilled' ? offerResult.value.bookings || [] : [];

            const allBookings = [...serviceBookings, ...offerBookings]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return {
                success: true,
                bookings: allBookings,
                summary: {
                    total: allBookings.length,
                    services: serviceBookings.length,
                    offers: offerBookings.length,
                    pending: allBookings.filter(b => b.status === 'pending').length,
                    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
                    in_progress: allBookings.filter(b => b.status === 'in_progress').length,
                    completed: allBookings.filter(b => b.status === 'completed').length,
                    cancelled: allBookings.filter(b => b.status === 'cancelled').length
                }
            };
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            return generateMockCombinedBookings(params.limit || 20);
        }
    }
};

/**
 * Get booking by ID (handles both service and offer bookings)
 */
export const getBookingById = async (bookingId) => {
    try {
        console.log('Fetching booking by ID:', bookingId);

        // Try service booking first
        try {
            const serviceBooking = await getServiceBookingById(bookingId);
            return {
                ...serviceBooking,
                bookingType: 'service'
            };
        } catch (serviceError) {
            // If service booking fails, try offer booking
            try {
                const offerBooking = await getOfferBookingById(bookingId);
                return {
                    ...offerBooking,
                    bookingType: 'offer'
                };
            } catch (offerError) {
                // If both fail, try general endpoint
                const response = await axiosInstance.get(`/merchant/bookings/view/${bookingId}`, {
                    headers: getAuthHeaders()
                });

                return response.data;
            }
        }
    } catch (error) {
        console.error('Error fetching booking by ID:', error);
        handleApiError(error, 'fetching booking');
    }
};

/**
 * Update booking status (auto-detects service vs offer)
 */
export const updateBookingStatus = async (bookingId, status, notes = '') => {
    try {
        console.log('Updating booking status:', { bookingId, status, notes });

        // Try to determine booking type first
        try {
            const booking = await getBookingById(bookingId);

            if (booking.bookingType === 'service' || booking.serviceId || booking.Service) {
                return await updateServiceBookingStatus(bookingId, status, notes);
            } else if (booking.bookingType === 'offer' || booking.offerId || booking.Offer) {
                return await updateOfferBookingStatus(bookingId, status, notes);
            }
        } catch (typeError) {
            console.log('Could not determine booking type, trying general update');
        }

        // Fallback to general endpoint
        const response = await axiosInstance.put(`/merchant/bookings/${bookingId}/status`, {
            status,
            notes
        }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        console.error('Error updating booking status:', error);
        handleApiError(error, 'updating booking status');
    }
};

// ===== STORE-SPECIFIC BOOKING METHODS =====

/**
 * Get bookings for a specific store
 */
export const getStoreBookings = async (storeId, params = {}) => {
    try {
        console.log('Fetching bookings for store:', storeId);

        const response = await axiosInstance.get(`/merchant/bookings/store/${storeId}`, {
            headers: getAuthHeaders(),
            params: {
                limit: 50,
                offset: 0,
                ...params
            }
        });

        if (response.data.success) {
            return response.data;
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching store bookings:', error);
        handleApiError(error, 'fetching store bookings');
    }
};

/**
 * Get bookings for current merchant's store
 */
export const getMyStoreBookings = async (params = {}) => {
    try {
        const storeId = await getMerchantStoreId();
        return await getStoreBookings(storeId, params);
    } catch (error) {
        console.error('Error fetching my store bookings:', error);
        handleApiError(error, 'fetching my store bookings');
    }
};

// ===== ANALYTICS METHODS =====

/**
 * Get booking analytics for the merchant
 */
export const getBookingAnalytics = async (timeRange = '7d') => {
    try {
        console.log('Fetching booking analytics for timeRange:', timeRange);

        const response = await axiosInstance.get('/merchant/bookings/analytics', {
            headers: getAuthHeaders(),
            params: { timeRange }
        });

        if (response.data.success) {
            return response.data;
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching booking analytics:', error);

        // Fallback: calculate analytics from booking data
        try {
            const allBookings = await getMerchantAllBookings({ limit: 1000 });
            return calculateBookingAnalytics(allBookings.bookings || [], timeRange);
        } catch (fallbackError) {
            return {
                success: true,
                analytics: getEmptyAnalytics(),
                message: 'Analytics not available'
            };
        }
    }
};

// ===== BULK OPERATIONS =====

/**
 * Bulk update booking statuses
 */
export const bulkUpdateBookingStatus = async (bookingIds, status, notes = '') => {
    try {
        console.log('Bulk updating booking statuses:', { bookingIds, status });

        const response = await axiosInstance.put('/merchant/bookings/bulk-status', {
            bookingIds,
            status,
            notes
        }, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data;
        }

        // Fallback: update each booking individually
        const results = await Promise.allSettled(
            bookingIds.map(id => updateBookingStatus(id, status, notes))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
            success: true,
            message: `Updated ${successful} bookings successfully. ${failed} failed.`,
            results: {
                successful,
                failed,
                total: bookingIds.length
            }
        };
    } catch (error) {
        console.error('Error bulk updating booking statuses:', error);
        handleApiError(error, 'bulk updating booking statuses');
    }
};

/**
 * Export booking data
 */
export const exportBookingData = async (filters = {}, format = 'csv') => {
    try {
        console.log('Exporting booking data with filters:', filters);

        const response = await axiosInstance.post('/merchant/bookings/export', {
            filters,
            format
        }, {
            headers: getAuthHeaders(),
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bookings-export-${new Date().toISOString().split('T')[0]}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: 'Export completed successfully' };
    } catch (error) {
        console.error('Error exporting booking data:', error);

        // Fallback: create simple export from current data
        try {
            const allBookings = await getMerchantAllBookings({ limit: 1000 });
            return createSimpleBookingExport(allBookings.bookings || [], format);
        } catch (fallbackError) {
            handleApiError(error, 'exporting booking data');
        }
    }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generate mock service bookings for development
 */
const generateMockServiceBookings = (limit = 20, storeId = null) => {
    const mockBookings = [];
    const statuses = ['confirmed', 'pending', 'completed', 'in_progress', 'cancelled'];

    // ✅ FIXED: Add stores array with different store IDs
    const stores = [
        { id: 1, name: 'Downtown Branch' },
        { id: 2, name: 'Mall Location' },
        { id: 3, name: 'Airport Terminal' },
        { id: 4, name: 'Beachfront Office' }
    ];

    const services = [
        { id: 1, name: 'Hair Cut & Styling', duration: 60, price: 2500 },
        { id: 2, name: 'Massage Therapy', duration: 90, price: 4500 },
        { id: 3, name: 'Facial Treatment', duration: 75, price: 3500 },
        { id: 4, name: 'Manicure & Pedicure', duration: 120, price: 3000 }
    ];
    const customers = [
        { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber: '+254712345678' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phoneNumber: '+254723456789' },
        { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@example.com', phoneNumber: '+254734567890' },
        { firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@example.com', phoneNumber: '+254745678901' }
    ];

    for (let i = 0; i < limit; i++) {
        const service = services[i % services.length];
        const customer = customers[i % customers.length];
        const status = statuses[i % statuses.length];

        // ✅ FIXED: Assign store - if storeId provided, use only that store, otherwise rotate
        const store = storeId
            ? stores.find(s => s.id === parseInt(storeId)) || stores[0]
            : stores[i % stores.length];

        // Generate random date within last 30 days or next 30 days
        const now = new Date();
        const randomDays = (Math.random() - 0.5) * 60; // -30 to +30 days
        const bookingDate = new Date(now.getTime() + randomDays * 24 * 60 * 60 * 1000);

        const booking = {
            id: 1000 + i,
            serviceId: service.id,
            userId: 100 + i,
            // ✅ FIXED: Add store information
            storeId: store.id,
            store_id: store.id, // Alternative field name
            storeName: store.name,
            Store: {
                id: store.id,
                name: store.name
            },
            startTime: bookingDate.toISOString(),
            endTime: new Date(bookingDate.getTime() + service.duration * 60 * 1000).toISOString(),
            status: status,
            duration: service.duration,
            bookingType: 'service',
            createdAt: new Date(bookingDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),

            // User data
            User: {
                id: 100 + i,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phoneNumber: customer.phoneNumber
            },

            // Service data
            Service: {
                id: service.id,
                name: service.name,
                duration: service.duration,
                price: service.price
            },

            // Derived properties
            customerName: `${customer.firstName} ${customer.lastName}`,
            serviceName: service.name,
            isUpcoming: bookingDate > now,
            isPast: bookingDate < now,
            canModify: ['pending', 'confirmed'].includes(status) && bookingDate > now
        };

        mockBookings.push(booking);
    }

    console.log(`✅ Generated ${mockBookings.length} mock bookings${storeId ? ` for store ${storeId}` : ' across all stores'}`);
    if (mockBookings.length > 0) {
        console.log('Sample booking structure:', mockBookings[0]);
    }

    return {
        success: true,
        bookings: mockBookings,
        pagination: {
            total: mockBookings.length,
            limit: limit,
            offset: 0
        },
        summary: {
            total: mockBookings.length,
            pending: mockBookings.filter(b => b.status === 'pending').length,
            confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
            in_progress: mockBookings.filter(b => b.status === 'in_progress').length,
            completed: mockBookings.filter(b => b.status === 'completed').length,
            cancelled: mockBookings.filter(b => b.status === 'cancelled').length
        },
        message: 'Using mock service booking data for development'
    };
};

/**
 * Generate mock offer bookings for development
 */
const generateMockOfferBookings = (limit = 20) => {
    const mockBookings = [];
    const statuses = ['confirmed', 'pending', 'completed', 'in_progress', 'cancelled'];
    const offers = [
        { id: 1, title: '50% Off Hair Styling', discount: 50, original_price: 2500, discounted_price: 1250 },
        { id: 2, title: '30% Off Massage Package', discount: 30, original_price: 4500, discounted_price: 3150 },
        { id: 3, title: 'Weekend Facial Special', discount: 25, original_price: 3500, discounted_price: 2625 },
        { id: 4, title: 'Mani-Pedi Combo Deal', discount: 40, original_price: 3000, discounted_price: 1800 }
    ];
    const customers = [
        { firstName: 'Alice', lastName: 'Brown', email: 'alice.brown@example.com', phoneNumber: '+254756789012' },
        { firstName: 'Bob', lastName: 'Davis', email: 'bob.davis@example.com', phoneNumber: '+254767890123' },
        { firstName: 'Carol', lastName: 'Miller', email: 'carol.miller@example.com', phoneNumber: '+254778901234' },
        { firstName: 'David', lastName: 'Wilson', email: 'david.wilson@example.com', phoneNumber: '+254789012345' }
    ];

    for (let i = 0; i < limit; i++) {
        const offer = offers[i % offers.length];
        const customer = customers[i % customers.length];
        const status = statuses[i % statuses.length];

        // Generate random date within last 30 days or next 30 days
        const now = new Date();
        const randomDays = (Math.random() - 0.5) * 60; // -30 to +30 days
        const bookingDate = new Date(now.getTime() + randomDays * 24 * 60 * 60 * 1000);

        const booking = {
            id: 2000 + i,
            offerId: offer.id,
            userId: 200 + i,
            startTime: bookingDate.toISOString(),
            endTime: new Date(bookingDate.getTime() + 90 * 60 * 1000).toISOString(), // 90 min default
            status: status,
            bookingType: 'offer',
            accessFee: Math.round(offer.discounted_price * 0.1), // 10% access fee
            createdAt: new Date(bookingDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),

            // User data
            User: {
                id: 200 + i,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phoneNumber: customer.phoneNumber
            },

            // Offer data
            Offer: {
                id: offer.id,
                title: offer.title,
                discount: offer.discount,
                original_price: offer.original_price,
                discounted_price: offer.discounted_price
            },

            // Derived properties
            customerName: `${customer.firstName} ${customer.lastName}`,
            offerTitle: offer.title,
            isUpcoming: bookingDate > now,
            isPast: bookingDate < now,
            canModify: ['pending', 'confirmed'].includes(status) && bookingDate > now,
            accessFeePaid: ['confirmed', 'in_progress', 'completed'].includes(status)
        };

        mockBookings.push(booking);
    }

    return {
        success: true,
        bookings: mockBookings,
        pagination: {
            total: mockBookings.length,
            limit: limit,
            offset: 0
        },
        summary: {
            total: mockBookings.length,
            pending: mockBookings.filter(b => b.status === 'pending').length,
            confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
            in_progress: mockBookings.filter(b => b.status === 'in_progress').length,
            completed: mockBookings.filter(b => b.status === 'completed').length,
            cancelled: mockBookings.filter(b => b.status === 'cancelled').length
        },
        message: 'Using mock offer booking data for development'
    };
};

/**
 * Generate mock combined bookings for development
 */
const generateMockCombinedBookings = (limit = 20) => {
    const serviceLimit = Math.ceil(limit / 2);
    const offerLimit = Math.floor(limit / 2);

    const serviceBookings = generateMockServiceBookings(serviceLimit);
    const offerBookings = generateMockOfferBookings(offerLimit);

    const combinedBookings = [
        ...serviceBookings.bookings,
        ...offerBookings.bookings
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
        success: true,
        bookings: combinedBookings,
        pagination: {
            total: combinedBookings.length,
            limit: limit,
            offset: 0
        },
        summary: {
            total: combinedBookings.length,
            services: serviceBookings.bookings.length,
            offers: offerBookings.bookings.length,
            pending: combinedBookings.filter(b => b.status === 'pending').length,
            confirmed: combinedBookings.filter(b => b.status === 'confirmed').length,
            in_progress: combinedBookings.filter(b => b.status === 'in_progress').length,
            completed: combinedBookings.filter(b => b.status === 'completed').length,
            cancelled: combinedBookings.filter(b => b.status === 'cancelled').length
        },
        message: 'Using mock combined booking data for development'
    };
};

/**
 * Calculate booking analytics from booking data
 */
const calculateBookingAnalytics = (bookings = [], timeRange = '7d') => {
    const now = new Date();
    let startDate;

    switch (timeRange) {
        case '1d':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filteredBookings = bookings.filter(booking =>
        new Date(booking.createdAt) >= startDate
    );

    const serviceBookings = filteredBookings.filter(b =>
        b.serviceId || b.Service || b.bookingType === 'service'
    );

    const offerBookings = filteredBookings.filter(b =>
        b.offerId || b.Offer || b.bookingType === 'offer'
    );

    const revenue = filteredBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => {
            const amount = parseFloat(b.Service?.price || b.Offer?.discounted_price || b.accessFee || 0);
            return sum + amount;
        }, 0);

    return {
        success: true,
        analytics: {
            timeRange,
            totalBookings: filteredBookings.length,
            serviceBookings: serviceBookings.length,
            offerBookings: offerBookings.length,
            confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
            completed: filteredBookings.filter(b => b.status === 'completed').length,
            pending: filteredBookings.filter(b => b.status === 'pending').length,
            cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
            revenue: revenue,
            averageBookingValue: filteredBookings.length > 0 ? revenue / filteredBookings.length : 0,
            completionRate: filteredBookings.length > 0 ?
                (filteredBookings.filter(b => b.status === 'completed').length / filteredBookings.length) * 100 : 0
        }
    };
};

/**
 * Get empty analytics structure
 */
const getEmptyAnalytics = () => ({
    totalBookings: 0,
    serviceBookings: 0,
    offerBookings: 0,
    confirmed: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0,
    averageBookingValue: 0,
    completionRate: 0
});

/**
 * Create simple booking export from data
 */
const createSimpleBookingExport = (bookings = [], format = 'csv') => {
    try {
        const headers = [
            'ID', 'Type', 'Customer Name', 'Customer Email', 'Service/Offer',
            'Date', 'Time', 'Status', 'Duration', 'Price', 'Notes'
        ];

        const rows = bookings.map(booking => [
            booking.id,
            booking.bookingType || (booking.serviceId ? 'service' : 'offer'),
            booking.customerName || `${booking.User?.firstName || ''} ${booking.User?.lastName || ''}`.trim(),
            booking.User?.email || '',
            booking.serviceName || booking.Service?.name || booking.offerTitle || booking.Offer?.title || '',
            new Date(booking.startTime).toLocaleDateString(),
            new Date(booking.startTime).toLocaleTimeString(),
            booking.status,
            booking.duration || booking.Service?.duration || '90',
            booking.Service?.price || booking.Offer?.discounted_price || booking.accessFee || '0',
            booking.notes || ''
        ]);

        if (format === 'csv') {
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(field => `"${field || ''}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return {
                success: true,
                message: 'Simple CSV export completed successfully',
                recordCount: bookings.length
            };
        }

        return {
            success: false,
            message: 'Only CSV export is supported in fallback mode'
        };
    } catch (error) {
        console.error('Error creating simple export:', error);
        throw new Error('Failed to create export file');
    }
};

// ===== SEARCH AND FILTER METHODS =====

/**
 * Search bookings by customer name, email, or booking ID
 */
export const searchBookings = async (query, params = {}) => {
    try {
        console.log('Searching bookings with query:', query);

        const response = await axiosInstance.get('/merchant/bookings/search', {
            headers: getAuthHeaders(),
            params: {
                q: query,
                ...params
            }
        });

        if (response.data.success) {
            return response.data;
        }

        throw new Error(response.data.message || 'Search failed');
    } catch (error) {
        console.error('Error searching bookings:', error);

        // Fallback: search within all bookings
        try {
            const allBookings = await getMerchantAllBookings({ limit: 1000 });
            const filteredBookings = (allBookings.bookings || []).filter(booking => {
                const searchText = query.toLowerCase();
                return (
                    booking.id.toString().includes(searchText) ||
                    booking.customerName?.toLowerCase().includes(searchText) ||
                    booking.User?.email?.toLowerCase().includes(searchText) ||
                    booking.User?.firstName?.toLowerCase().includes(searchText) ||
                    booking.User?.lastName?.toLowerCase().includes(searchText) ||
                    booking.serviceName?.toLowerCase().includes(searchText) ||
                    booking.offerTitle?.toLowerCase().includes(searchText)
                );
            });

            return {
                success: true,
                bookings: filteredBookings,
                query: query,
                totalResults: filteredBookings.length
            };
        } catch (fallbackError) {
            handleApiError(error, 'searching bookings');
        }
    }
};

/**
 * Filter bookings by various criteria
 */
export const filterBookings = async (filters = {}) => {
    try {
        console.log('Filtering bookings with filters:', filters);

        const response = await axiosInstance.get('/merchant/bookings/filter', {
            headers: getAuthHeaders(),
            params: filters
        });

        if (response.data.success) {
            return response.data;
        }

        throw new Error(response.data.message || 'Filter failed');
    } catch (error) {
        console.error('Error filtering bookings:', error);

        // Fallback: filter within all bookings
        try {
            const allBookings = await getMerchantAllBookings({ limit: 1000 });
            let filteredBookings = allBookings.bookings || [];

            // Apply filters
            if (filters.status) {
                filteredBookings = filteredBookings.filter(b => b.status === filters.status);
            }
            if (filters.bookingType) {
                filteredBookings = filteredBookings.filter(b => b.bookingType === filters.bookingType);
            }
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                filteredBookings = filteredBookings.filter(b => new Date(b.startTime) >= startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                filteredBookings = filteredBookings.filter(b => new Date(b.startTime) <= endDate);
            }
            if (filters.serviceId) {
                filteredBookings = filteredBookings.filter(b => b.serviceId === filters.serviceId);
            }
            if (filters.staffId) {
                filteredBookings = filteredBookings.filter(b => b.staffId === filters.staffId);
            }

            return {
                success: true,
                bookings: filteredBookings,
                filters: filters,
                totalResults: filteredBookings.length
            };
        } catch (fallbackError) {
            handleApiError(error, 'filtering bookings');
        }
    }
};

// ===== NOTIFICATION METHODS =====

/**
 * Send booking confirmation to customer
 */
export const sendBookingConfirmation = async (bookingId) => {
    try {
        const response = await axiosInstance.post(`/merchant/bookings/${bookingId}/send-confirmation`, {}, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        console.error('Error sending booking confirmation:', error);
        handleApiError(error, 'sending booking confirmation');
    }
};

/**
 * Send booking reminder to customer
 */
export const sendBookingReminder = async (bookingId, reminderType = 'default') => {
    try {
        const response = await axiosInstance.post(`/merchant/bookings/${bookingId}/send-reminder`, {
            reminderType
        }, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        console.error('Error sending booking reminder:', error);
        handleApiError(error, 'sending booking reminder');
    }
};

// ===== SUMMARY METHODS =====

/**
 * Get booking summary for today
 */
export const getTodayBookingSummary = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const response = await axiosInstance.get('/merchant/bookings/summary/today', {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data;
        }

        // Fallback: calculate from all bookings
        const allBookings = await getMerchantAllBookings({
            startDate: today,
            endDate: today,
            limit: 1000
        });

        const todayBookings = (allBookings.bookings || []).filter(booking =>
            new Date(booking.startTime).toDateString() === new Date().toDateString()
        );

        return {
            success: true,
            summary: {
                total: todayBookings.length,
                confirmed: todayBookings.filter(b => b.status === 'confirmed').length,
                in_progress: todayBookings.filter(b => b.status === 'in_progress').length,
                completed: todayBookings.filter(b => b.status === 'completed').length,
                cancelled: todayBookings.filter(b => b.status === 'cancelled').length,
                upcoming: todayBookings.filter(b =>
                    new Date(b.startTime) > new Date() && ['confirmed', 'pending'].includes(b.status)
                ).length
            },
            bookings: todayBookings
        };
    } catch (error) {
        console.error('Error getting today booking summary:', error);
        handleApiError(error, 'getting today booking summary');
    }
};

/**
 * Get upcoming bookings
 */
export const getUpcomingBookings = async (hours = 24) => {
    try {
        const response = await axiosInstance.get('/merchant/bookings/upcoming', {
            headers: getAuthHeaders(),
            params: { hours }
        });

        if (response.data.success) {
            return response.data;
        }

        // Fallback: filter from all bookings
        const allBookings = await getMerchantAllBookings({ limit: 1000 });
        const now = new Date();
        const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

        const upcomingBookings = (allBookings.bookings || []).filter(booking => {
            const bookingTime = new Date(booking.startTime);
            return bookingTime > now &&
                bookingTime <= futureTime &&
                ['confirmed', 'pending'].includes(booking.status);
        }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        return {
            success: true,
            bookings: upcomingBookings,
            count: upcomingBookings.length,
            timeframe: `Next ${hours} hours`
        };
    } catch (error) {
        console.error('Error getting upcoming bookings:', error);
        handleApiError(error, 'getting upcoming bookings');
    }
};

// ==========================================
// AUTO-COMPLETION RELATED METHODS
// ==========================================

/**
 * Manual complete a booking (override auto-completion)
 */
export const manualCompleteBooking = async (bookingId, notes = '', actualDuration = null) => {
    try {
        console.log('Manual completing booking:', { bookingId, notes, actualDuration });

        const response = await axiosInstance.put(`/merchant/bookings/${bookingId}/manual-complete`, {
            notes: notes || 'Manually completed by merchant',
            actualDuration,
            completionMethod: 'manual'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Manual completion failed');
        }
    } catch (error) {
        console.error('Error manually completing booking:', error);
        handleApiError(error, 'manually completing booking');
    }
};

/**
 * Get auto-completion statistics
 */
export const getAutoCompletionStats = async (storeId = null, period = '30d') => {
    try {
        console.log('Getting auto-completion statistics:', { storeId, period });

        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        params.append('period', period);

        const response = await axiosInstance.get(`/merchant/bookings/auto-completion/statistics?${params}`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to get auto-completion statistics');
        }
    } catch (error) {
        console.error('Error getting auto-completion statistics:', error);
        handleApiError(error, 'getting auto-completion statistics');
    }
};

// ==========================================
// NO-SHOW RELATED METHODS
// ==========================================

/**
 * Mark a booking as no-show
 */
export const markAsNoShow = async (bookingId, reason = '') => {
    try {
        console.log('Marking booking as no-show:', { bookingId, reason });

        const response = await axiosInstance.put(`/merchant/bookings/${bookingId}/no-show`, {
            reason: reason || 'Customer did not arrive'
        }, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to mark as no-show');
        }
    } catch (error) {
        console.error('Error marking booking as no-show:', error);
        handleApiError(error, 'marking booking as no-show');
    }
};

/**
 * Get no-show statistics
 */
export const getNoShowStats = async (storeId = null, period = '30d') => {
    try {
        console.log('Getting no-show statistics:', { storeId, period });

        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        params.append('period', period);

        const response = await axiosInstance.get(`/merchant/bookings/no-show/statistics?${params}`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to get no-show statistics');
        }
    } catch (error) {
        console.error('Error getting no-show statistics:', error);
        handleApiError(error, 'getting no-show statistics');
    }
};

// ==========================================
// ENHANCED BOOKING STATUS METHODS
// ==========================================

/**
 * Get booking with detailed status information
 */
export const getBookingWithDetails = async (bookingId) => {
    try {
        console.log('Getting booking with details:', bookingId);

        const response = await axiosInstance.get(`/merchant/bookings/view/${bookingId}?includeDetails=true`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to get booking details');
        }
    } catch (error) {
        console.error('Error getting booking details:', error);
        handleApiError(error, 'getting booking details');
    }
};

/**
 * Get service automation status
 */
export const getAutomationStatus = async () => {
    try {
        console.log('Getting automation service status');

        const response = await axiosInstance.get('/merchant/bookings/automation/status', {
            headers: getAuthHeaders()
        });

        if (response.data) {
            return response.data;
        } else {
            throw new Error('Failed to get automation status');
        }
    } catch (error) {
        console.error('Error getting automation status:', error);
        return {
            success: false,
            error: error.message,
            noShowService: { isRunning: false },
            autoCompletionService: { isRunning: false }
        };
    }
};

// ==========================================
// ENHANCED BOOKING HISTORY METHODS
// ==========================================

/**
 * Get booking timeline (detailed history)
 */
export const getBookingTimeline = async (bookingId) => {
    try {
        console.log('Getting booking timeline:', bookingId);

        const response = await axiosInstance.get(`/merchant/bookings/${bookingId}/timeline`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to get booking timeline');
        }
    } catch (error) {
        console.error('Error getting booking timeline:', error);
        handleApiError(error, 'getting booking timeline');
    }
};

/**
 * Get performance metrics for bookings
 */
export const getBookingPerformanceMetrics = async (filters = {}) => {
    try {
        console.log('Getting booking performance metrics:', filters);

        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) params.append(key, filters[key]);
        });

        const response = await axiosInstance.get(`/merchant/bookings/metrics?${params}`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to get performance metrics');
        }
    } catch (error) {
        console.error('Error getting performance metrics:', error);
        handleApiError(error, 'getting performance metrics');
    }
};

// ==========================================
// UTILITY METHODS FOR NEW FEATURES
// ==========================================

/**
 * Check if booking is eligible for auto-completion
 */
export const checkAutoCompletionEligibility = async (bookingId) => {
    try {
        console.log('Checking auto-completion eligibility:', bookingId);

        const response = await axiosInstance.get(`/merchant/bookings/${bookingId}/auto-completion/eligible`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        console.error('Error checking auto-completion eligibility:', error);
        return { eligible: false, reason: 'Unable to check eligibility' };
    }
};

/**
 * Check if booking is eligible for no-show
 */
export const checkNoShowEligibility = async (bookingId) => {
    try {
        console.log('Checking no-show eligibility:', bookingId);

        const response = await axiosInstance.get(`/merchant/bookings/${bookingId}/no-show/eligible`, {
            headers: getAuthHeaders()
        });

        return response.data;
    } catch (error) {
        console.error('Error checking no-show eligibility:', error);
        return { eligible: false, reason: 'Unable to check eligibility' };
    }
};

/**
 * Get service configuration for automation
 */
export const getServiceAutomationConfig = async (serviceId) => {
    try {
        console.log('Getting service automation config:', serviceId);

        const response = await axiosInstance.get(`/services/${serviceId}/automation-config`, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to get automation config');
        }
    } catch (error) {
        console.error('Error getting service automation config:', error);
        handleApiError(error, 'getting service automation config');
    }
};

/**
 * Update service automation settings
 */
export const updateServiceAutomationConfig = async (serviceId, config) => {
    try {
        console.log('Updating service automation config:', { serviceId, config });

        const response = await axiosInstance.put(`/services/${serviceId}/automation-config`, config, {
            headers: getAuthHeaders()
        });

        if (response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data?.message || 'Failed to update automation config');
        }
    } catch (error) {
        console.error('Error updating service automation config:', error);
        handleApiError(error, 'updating service automation config');
    }
};

// ==========================================
// ENHANCED STATUS UTILITIES
// ==========================================

/**
 * Get enhanced status color including new statuses
 */
export const getEnhancedStatusColor = (status, autoCompleted = false) => {
    const baseColor = getStatusColor(status);

    // Add special styling for auto-completed bookings
    if (status === 'completed' && autoCompleted) {
        return 'bg-blue-100 text-blue-800'; // Different color for auto-completed
    }

    switch (status?.toLowerCase()) {
        case 'no_show':
            return 'bg-gray-100 text-gray-800';
        default:
            return baseColor;
    }
};

/**
 * Get status badge text including completion method
 */
export const getStatusBadgeText = (booking) => {
    const status = booking.status;

    if (status === 'completed') {
        return booking.auto_completed ? 'Auto-Completed' : 'Completed';
    }

    if (status === 'no_show') {
        return 'No Show';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Calculate booking efficiency metrics
 */
export const calculateBookingEfficiency = (booking) => {
    if (booking.status !== 'completed') return null;

    const scheduledDuration = booking.Service?.duration || 60;
    const actualDuration = booking.actual_duration || scheduledDuration;

    return {
        scheduledDuration,
        actualDuration,
        efficiency: (scheduledDuration / actualDuration) * 100,
        overtime: Math.max(0, actualDuration - scheduledDuration),
        isOnTime: actualDuration <= scheduledDuration,
        completionMethod: booking.completion_method || (booking.auto_completed ? 'automatic' : 'manual')
    };
};

/**
 * Format booking timing information
 */
export const formatBookingTiming = (booking) => {
    const result = {
        scheduled: {
            date: formatBookingTime(booking.startTime).date,
            time: formatBookingTime(booking.startTime).time
        }
    };

    if (booking.checked_in_at) {
        result.checkedIn = {
            time: formatBookingTime(booking.checked_in_at).time,
            difference: moment(booking.checked_in_at).diff(moment(booking.startTime), 'minutes')
        };
    }

    if (booking.service_started_at) {
        result.serviceStarted = {
            time: formatBookingTime(booking.service_started_at).time
        };
    }

    if (booking.completedAt) {
        result.completed = {
            time: formatBookingTime(booking.completedAt).time,
            method: booking.completion_method || (booking.auto_completed ? 'automatic' : 'manual')
        };
    }

    if (booking.no_show_marked_at) {
        result.noShow = {
            time: formatBookingTime(booking.no_show_marked_at).time,
            reason: booking.no_show_reason
        };
    }

    return result;
};

/**
 * DEBUG: Get merchant info to find correct store ID
 */
export const debugMerchantInfo = async () => {
    try {
        console.log('🔍 DEBUG: Fetching merchant info...');
        
        const response = await axiosInstance.get('/bookings/debug/merchant-info', {
            headers: getAuthHeaders()
        });
        
        console.log('🔍 DEBUG: Merchant info response:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ DEBUG: Error fetching merchant info:', error);
        console.error('Error response:', error.response?.data);
        return null;
    }
};



// ===== DEFAULT EXPORT =====

export default {
    // Service Booking Methods
    getMerchantServiceBookings,
    getServiceBookingById,
    updateServiceBookingStatus,
    checkInServiceBooking,
    completeServiceBooking,
    confirmServiceBooking,
    cancelServiceBooking,
      debugMerchantInfo,

    // Offer Booking Methods
    getMerchantOfferBookings,
    getOfferBookingById,
    updateOfferBookingStatus,
    checkInOfferBooking,
    completeOfferBooking,
    confirmOfferBooking,
    cancelOfferBooking,

    // Combined Booking Methods
    getMerchantAllBookings,
    getBookingById,
    updateBookingStatus,

    // Store-specific Methods
    getStoreBookings,
    getMyStoreBookings,

    // Analytics
    getBookingAnalytics,

    // Bulk Operations
    bulkUpdateBookingStatus,
    exportBookingData,

    // Search and Filter
    searchBookings,
    filterBookings,

    // Notifications
    sendBookingConfirmation,
    sendBookingReminder,

    // Summary Methods
    getTodayBookingSummary,
    getUpcomingBookings,

    // Enhanced Service Booking Actions
    checkInServiceBookingEnhanced,
    confirmServiceBookingEnhanced,
    completeServiceBookingEnhanced,
    cancelServiceBookingEnhanced,
    updateServiceBookingStatusEnhanced,

    // New Bulk Operations
    bulkUpdateServiceBookingStatusEnhanced,
    bulkCheckInServiceBookings,

    // Enhanced Merchant Listing
    getMerchantStoreServiceBookingsEnhanced,
    getAllMerchantServiceBookingsEnhanced,
    getServiceBookingAnalyticsEnhanced,
    getMerchantServiceBookingDetailsEnhanced,
    addServiceBookingNotes,

    // Quick Actions
    quickCheckIn,
    quickConfirm,
    quickComplete,
    quickCancel,

    // Utilities
    getAvailableBookingStatuses,
    isValidBookingStatus,
    getStatusColor,
    getStatusBgColor,
    formatBookingTime,
    canModifyBooking,
    canCheckInBooking,
    getBookingTypeLabel,
    calculateBookingDuration,

    // New auto-completion methods
    manualCompleteBooking,
    getAutoCompletionStats,

    // New no-show methods
    markAsNoShow,
    getNoShowStats,

    // Enhanced booking methods
    getBookingWithDetails,
    getAutomationStatus,
    getBookingTimeline,
    getBookingPerformanceMetrics,

    // Utility methods
    checkAutoCompletionEligibility,
    checkNoShowEligibility,
    getServiceAutomationConfig,
    updateServiceAutomationConfig,

    // Enhanced status utilities
    getEnhancedStatusColor,
    getStatusBadgeText,
    calculateBookingEfficiency,
    formatBookingTiming

};