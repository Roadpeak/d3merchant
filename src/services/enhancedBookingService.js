// services/enhancedBookingService.js - UPDATED with merchant booking methods

import axios from 'axios';
import { getTokenFromCookie } from '../services/api_service';
import merchantAuthService from './merchantAuthService';

const API_BASE_URL = process.env.REACT_APP_API_URL || '${import.meta.env.VITE_API_BASE_URL}/api/v1';

class EnhancedBookingService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        // Add auth token to requests
        this.api.interceptors.request.use((config) => {
            const token = getTokenFromCookie();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, {
                    params: config.params,
                    data: config.data
                });
            }
            
            return config;
        });

        this.api.interceptors.response.use(
            (response) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
                }
                return response;
            },
            (error) => {
                if (process.env.NODE_ENV === 'development') {
                    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        message: error.message
                    });
                }
                
                if (error.response?.status === 401) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // ==================== MERCHANT BOOKING METHODS (NEW) ====================

    /**
     * Get all bookings for the current merchant's stores/services
     */
    async getMerchantBookings(params = {}) {
        try {
            console.log('📋 Fetching merchant bookings with params:', params);
            
            const response = await this.api.get('/bookings/merchant/all', { params });
            
            if (response.data.success) {
                console.log(`✅ Fetched ${response.data.bookings?.length || 0} merchant bookings`);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch merchant bookings');
            }
        } catch (error) {
            console.error('❌ Error fetching merchant bookings:', error);
            
            // If the specific merchant endpoint doesn't exist, try a fallback
            if (error.response?.status === 404) {
                console.log('📋 Merchant endpoint not found, using fallback method');
                return await this.getMerchantBookingsFallback(params);
            }
            
            throw this.handleError(error);
        }
    }

    /**
     * Get service bookings specifically for the current merchant
     */
    async getMerchantServiceBookings(params = {}) {
        try {
            console.log('🔧 Fetching merchant service bookings');
            
            // Use the new merchant services endpoint
            const response = await this.api.get('/bookings/merchant/services', { params });
            
            if (response.data.success) {
                console.log(`✅ Fetched ${response.data.bookings?.length || 0} service bookings`);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch service bookings');
            }
        } catch (error) {
            console.error('❌ Error fetching merchant service bookings:', error);
            
            // If the specific endpoint doesn't exist, try the general merchant endpoint with filtering
            if (error.response?.status === 404) {
                console.log('📋 Service-specific endpoint not found, using general endpoint');
                try {
                    const allBookings = await this.getMerchantBookings({
                        ...params,
                        bookingType: 'service'
                    });
                    
                    return {
                        ...allBookings,
                        bookings: allBookings.bookings?.filter(booking => 
                            booking.bookingType === 'service' || (!booking.offerId && booking.serviceId)
                        ) || []
                    };
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError);
                    return this.getMerchantBookingsFallback(params);
                }
            }
            
            throw this.handleError(error);
        }
    }

    /**
     * Get offer bookings specifically for the current merchant
     */
    async getMerchantOfferBookings(params = {}) {
        try {
            console.log('💰 Fetching merchant offer bookings');
            
            // Use the new merchant offers endpoint
            const response = await this.api.get('/bookings/merchant/offers', { params });
            
            if (response.data.success) {
                console.log(`✅ Fetched ${response.data.bookings?.length || 0} offer bookings`);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch offer bookings');
            }
        } catch (error) {
            console.error('❌ Error fetching merchant offer bookings:', error);
            
            // If the specific endpoint doesn't exist, try the general merchant endpoint with filtering
            if (error.response?.status === 404) {
                console.log('📋 Offer-specific endpoint not found, using general endpoint');
                try {
                    const allBookings = await this.getMerchantBookings({
                        ...params,
                        bookingType: 'offer'
                    });
                    
                    return {
                        ...allBookings,
                        bookings: allBookings.bookings?.filter(booking => 
                            booking.bookingType === 'offer' || booking.offerId
                        ) || []
                    };
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError);
                    return this.getMerchantBookingsFallback(params);
                }
            }
            
            throw this.handleError(error);
        }
    }

    /**
     * Get bookings for a specific store (merchant's store)
     */
    async getMerchantStoreBookings(storeId, params = {}) {
        try {
            console.log('🏪 Fetching bookings for store:', storeId);
            
            const response = await this.api.get(`/bookings/merchant/store/${storeId}`, { params });
            
            if (response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch store bookings');
            }
        } catch (error) {
            console.error('❌ Error fetching store bookings:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Fallback method when merchant-specific endpoints aren't available
     */
    async getMerchantBookingsFallback(params = {}) {
        try {
            console.log('🔄 Using fallback method for merchant bookings');
            
            // Get current merchant
            const merchant = merchantAuthService.getCurrentMerchant();
            if (!merchant) {
                throw new Error('Merchant not authenticated');
            }

            // For now, return empty array with proper structure
            // In production, this would fetch from a different endpoint
            const mockResponse = {
                success: true,
                bookings: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0
                },
                summary: {
                    total: 0,
                    offerBookings: 0,
                    serviceBookings: 0,
                    upcomingBookings: 0,
                    confirmedBookings: 0,
                    pendingBookings: 0,
                    completedBookings: 0,
                    cancelledBookings: 0
                },
                message: 'Using fallback method - merchant bookings endpoint not yet implemented'
            };

            console.log('📋 Fallback response prepared');
            return mockResponse;
            
        } catch (error) {
            console.error('❌ Error in fallback method:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Update booking status (merchant action)
     */
    async updateMerchantBookingStatus(bookingId, status, notes = '') {
        try {
            console.log(`🔄 Updating booking ${bookingId} status to: ${status}`);
            
            const response = await this.api.put(`/bookings/merchant/${bookingId}/status`, {
                status,
                notes
            });
            
            if (response.data.success) {
                console.log('✅ Booking status updated successfully');
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to update booking status');
            }
        } catch (error) {
            console.error('❌ Error updating booking status:', error);
            throw this.handleError(error);
        }
    }

    // ==================== EXISTING METHODS (KEPT UNCHANGED) ====================

    async getAvailableSlotsForOffer(offerId, date) {
        try {
            console.log('📅 Getting unified slots for offer:', offerId, date);
            
            try {
                const response = await this.api.get('/bookings/slots/unified', {
                    params: { entityId: offerId, entityType: 'offer', date }
                });
                
                if (response.data.success) {
                    try {
                        const offerResponse = await this.api.get(`/offers/${offerId}`);
                        if (offerResponse.data.success && offerResponse.data.offer) {
                            const discount = parseFloat(offerResponse.data.offer.discount) || 20;
                            response.data.accessFee = (discount * 0.15).toFixed(2);
                        }
                    } catch {
                        response.data.accessFee = 5.99;
                    }
                    response.data.requiresPayment = true;
                    response.data.bookingType = 'offer';
                    
                    return response.data;
                } else {
                    throw new Error(response.data.message || 'No slots available');
                }
            } catch (error) {
                console.warn('⚠️ Unified endpoint failed:', error.response?.data?.message || error.message);
                
                if (error.response?.data?.message?.includes('closed') || 
                    error.response?.data?.message?.includes('not open')) {
                    throw error;
                }
            }

            // Fallback to legacy endpoint
            try {
                const response = await this.api.get('/bookings/slots', {
                    params: { offerId, date, bookingType: 'offer' }
                });
                
                if (response.data.success || response.data.availableSlots) {
                    const result = {
                        success: true,
                        availableSlots: response.data.availableSlots || [],
                        detailedSlots: response.data.detailedSlots || [],
                        bookingRules: response.data.bookingRules || null,
                        storeInfo: response.data.storeInfo || null,
                        accessFee: response.data.accessFee || 5.99,
                        requiresPayment: true,
                        bookingType: 'offer'
                    };
                    
                    return result;
                } else {
                    throw new Error(response.data.message || 'No slots available from legacy endpoint');
                }
            } catch (legacyError) {
                console.warn('⚠️ Legacy endpoint also failed:', legacyError.response?.data?.message || legacyError.message);
                
                if (legacyError.response?.data?.message?.includes('closed') || 
                    legacyError.response?.data?.message?.includes('not open')) {
                    throw legacyError;
                }
            }

            throw new Error('Unable to fetch slots from API');
            
        } catch (error) {
            console.error('❌ Error fetching offer slots:', error);
            
            const errorMessage = error.response?.data?.message || error.message;
            if (errorMessage?.includes('closed') || 
                errorMessage?.includes('not open') ||
                errorMessage?.includes('working days') ||
                errorMessage?.includes('business hours')) {
                
                return {
                    success: false,
                    message: errorMessage,
                    availableSlots: [],
                    detailedSlots: [],
                    bookingRules: null,
                    storeInfo: null,
                    accessFee: 5.99,
                    requiresPayment: true,
                    bookingType: 'offer',
                    businessRuleViolation: true,
                    debugInfo: {
                        offerId,
                        date,
                        dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
                        errorSource: 'backend_validation'
                    }
                };
            }
            
            throw this.handleError(error);
        }
    }

    async getAvailableSlotsForService(serviceId, date) {
        try {
            console.log('📅 Getting unified slots for service:', serviceId, date);
            
            try {
                const response = await this.api.get('/bookings/slots/unified', {
                    params: { entityId: serviceId, entityType: 'service', date }
                });
                
                if (response.data.success) {
                    response.data.accessFee = 0;
                    response.data.requiresPayment = false;
                    response.data.bookingType = 'service';
                    return response.data;
                }
            } catch (error) {
                console.warn('⚠️ Unified endpoint failed, trying legacy method:', error);
            }

            const response = await this.api.get('/bookings/slots', {
                params: { serviceId, date, bookingType: 'service' }
            });
            
            if (response.data.success || response.data.availableSlots) {
                const result = {
                    success: true,
                    availableSlots: response.data.availableSlots || [],
                    detailedSlots: response.data.detailedSlots || [],
                    bookingRules: response.data.bookingRules || null,
                    storeInfo: response.data.storeInfo || null,
                    accessFee: 0,
                    requiresPayment: false,
                    bookingType: 'service'
                };
                
                return result;
            }
            
            throw new Error('No slots available');
            
        } catch (error) {
            console.error('❌ Error fetching service slots:', error);
            throw this.handleError(error);
        }
    }

    async createBooking(bookingData) {
        try {
            console.log('📝 Creating booking:', bookingData);
            
            const isOfferBooking = bookingData.offerId || bookingData.bookingType === 'offer';
            const isServiceBooking = bookingData.serviceId || bookingData.bookingType === 'service';
            
            if (!isOfferBooking && !isServiceBooking) {
                throw new Error('Booking must specify either offerId or serviceId');
            }
            
            const payload = {
                ...bookingData,
                bookingType: isOfferBooking ? 'offer' : 'service'
            };
            
            if (isServiceBooking) {
                console.log('🔧 Service booking - no payment required');
                delete payload.paymentData;
                payload.accessFee = 0;
            }
            
            const response = await this.api.post('/bookings', payload);
            
            console.log('✅ Booking created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating booking:', error);
            throw this.handleError(error);
        }
    }

    async getBranchForOffer(offerId) {
        try {
            console.log('🏢 Getting branch for offer:', offerId);
            
            try {
                const response = await this.api.get(`/bookings/branches/offer/${offerId}`);
                return response.data;
            } catch (error) {
                console.warn('⚠️ Branch endpoint failed, trying fallback');
                
                const offerResponse = await this.api.get(`/offers/${offerId}`);
                if (offerResponse.data.success && offerResponse.data.offer) {
                    const offer = offerResponse.data.offer;
                    const branches = [];
                    
                    if (offer.service && offer.service.store) {
                        branches.push({
                            id: `store-${offer.service.store.id}`,
                            name: offer.service.store.name + ' (Main Branch)',
                            address: offer.service.store.location,
                            phone: offer.service.store.phone,
                            openingTime: offer.service.store.opening_time,
                            closingTime: offer.service.store.closing_time,
                            workingDays: offer.service.store.working_days,
                            isMainBranch: true
                        });
                    }
                    
                    return {
                        success: true,
                        branch: branches[0] || null,
                        branches: branches
                    };
                }
                
                throw new Error('No branch found for offer');
            }
        } catch (error) {
            console.error('❌ Error getting branch for offer:', error);
            return {
                success: true,
                branch: null,
                branches: []
            };
        }
    }

    async getBranchForService(serviceId) {
        try {
            console.log('🏢 Getting branch for service:', serviceId);
            
            try {
                const response = await this.api.get(`/bookings/branches/service/${serviceId}`);
                return response.data;
            } catch (error) {
                console.warn('⚠️ Branch endpoint failed, trying fallback');
                
                const serviceResponse = await this.api.get(`/services/${serviceId}`);
                if (serviceResponse.data.success && serviceResponse.data.service) {
                    const service = serviceResponse.data.service;
                    
                    const branch = service.store ? {
                        id: `store-${service.store.id}`,
                        name: service.store.name + ' (Main Branch)',
                        address: service.store.location,
                        phone: service.store.phone,
                        openingTime: service.store.opening_time,
                        closingTime: service.store.closing_time,
                        workingDays: service.store.working_days,
                        isMainBranch: true
                    } : null;
                    
                    return {
                        success: true,
                        branch: branch,
                        branches: branch ? [branch] : []
                    };
                }
                
                throw new Error('No branch found for service');
            }
        } catch (error) {
            console.error('❌ Error getting branch for service:', error);
            return {
                success: true,
                branch: null,
                branches: []
            };
        }
    }

    async getStaffForOffer(offerId) {
        try {
            console.log('👥 Fetching staff for offer:', offerId);
            
            const response = await this.api.get(`/bookings/staff/offer/${offerId}`);
            
            if (response.data.success) {
                console.log('✅ Offer staff fetched:', {
                    count: response.data.staff?.length || 0,
                    serviceId: response.data.serviceInfo?.id,
                    branchId: response.data.serviceInfo?.branchId
                });
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch offer staff');
            }
            
        } catch (error) {
            console.error('❌ Error getting staff for offer:', error);
            return {
                success: true,
                staff: [],
                message: 'Offer staff not available'
            };
        }
    }

    async getStaffForService(serviceId) {
        try {
            console.log('👥 Fetching staff for service:', serviceId);
            
            const response = await this.api.get(`/bookings/staff/service/${serviceId}`);
            
            if (response.data.success) {
                console.log('✅ Service staff fetched:', {
                    count: response.data.staff?.length || 0,
                    branchId: response.data.serviceInfo?.branchId
                });
                return response.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch service staff');
            }
            
        } catch (error) {
            console.error('❌ Error getting staff for service:', error);
            return {
                success: true,
                staff: [],
                message: 'Service staff not available'
            };
        }
    }

    async getStoresForOffer(offerId) {
        console.log('⚠️ Using legacy getStoresForOffer, redirecting to branches...');
        const branchResult = await this.getBranchForOffer(offerId);
        
        return {
            success: true,
            stores: branchResult.branch ? [{
                id: branchResult.branch.id,
                name: branchResult.branch.name,
                location: branchResult.branch.address,
                address: branchResult.branch.address,
                phone: branchResult.branch.phone,
                opening_time: branchResult.branch.openingTime,
                closing_time: branchResult.branch.closingTime,
                working_days: branchResult.branch.workingDays
            }] : []
        };
    }

    async getStoresForService(serviceId) {
        console.log('⚠️ Using legacy getStoresForService, redirecting to branches...');
        const branchResult = await this.getBranchForService(serviceId);
        
        return {
            success: true,
            stores: branchResult.branch ? [{
                id: branchResult.branch.id,
                name: branchResult.branch.name,
                location: branchResult.branch.address,
                address: branchResult.branch.address,
                phone: branchResult.branch.phone,
                opening_time: branchResult.branch.openingTime,
                closing_time: branchResult.branch.closingTime,
                working_days: branchResult.branch.workingDays
            }] : []
        };
    }

    async getUserBookings(params = {}) {
        try {
            const response = await this.api.get('/bookings/user', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getBookingById(bookingId) {
        try {
            const response = await this.api.get(`/bookings/${bookingId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async cancelBooking(bookingId, reason = '', refundRequested = false) {
        try {
            console.log('❌ Cancelling booking:', bookingId, 'Reason:', reason);
            
            const response = await this.api.put(`/bookings/${bookingId}/cancel`, { 
                reason,
                refundRequested
            });
            
            console.log('✅ Booking cancelled successfully');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateBookingStatus(bookingId, status) {
        try {
            const response = await this.api.put(`/bookings/${bookingId}/status`, { status });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async processMpesaPayment(phoneNumber, amount, bookingId) {
        try {
            console.log('💳 Processing M-Pesa payment:', { phoneNumber, amount, bookingId });
            
            const response = await this.api.post('/payments/mpesa', {
                phoneNumber,
                amount: parseFloat(amount),
                bookingId,
                type: 'booking_access_fee'
            });
            
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async checkPaymentStatus(paymentId) {
        try {
            const response = await this.api.get(`/payments/${paymentId}/status`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    calculateAccessFee(discount) {
        return (parseFloat(discount) * 0.15).toFixed(2);
    }

    handleError(error) {
        console.error('🚨 Booking service error:', error);
        
        if (error.response) {
            const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
            const newError = new Error(message);
            newError.status = error.response.status;
            newError.response = error.response;
            return newError;
        } else if (error.request) {
            return new Error('Network error. Please check your connection and try again.');
        } else {
            return error;
        }
    }

    async debugOfferWorkingDays(offerId) {
        try {
            const response = await this.api.get(`/bookings/debug/working-days?entityId=${offerId}&entityType=offer`);
            return response.data;
        } catch (error) {
            console.error('🐛 Debug failed:', error);
            return { debug: 'Failed', error: error.message };
        }
    }
}

const enhancedBookingService = new EnhancedBookingService();

export default enhancedBookingService;

export const {
    getAvailableSlots,
    getAvailableSlotsForOffer,
    getAvailableSlotsForService,
    createBooking,
    getBranchForOffer,
    getBranchForService,
    getStoresForOffer,
    getStoresForService,
    getStaffForOffer,
    getStaffForService,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    processMpesaPayment,
    checkPaymentStatus,
    calculateAccessFee,
    handleError,
    debugOfferWorkingDays,
    // NEW MERCHANT METHODS
    getMerchantBookings,
    getMerchantServiceBookings,
    getMerchantOfferBookings,
    getMerchantStoreBookings,
    updateMerchantBookingStatus
} = enhancedBookingService;