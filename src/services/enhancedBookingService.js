// services/enhancedBookingService.js - Handle both service and offer bookings

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class EnhancedBookingService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add auth token to requests
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle auth errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // ==================== SLOT GENERATION ====================

    /**
     * Get available slots for offers (with access fee calculation)
     * Note: Slots are shared with direct service bookings for the same underlying service
     */
    async getAvailableSlotsForOffer(offerId, date) {
        try {
            console.log('📅 Getting unified slots for offer:', offerId, date);
            
            const response = await this.api.get('/bookings/slots/unified', {
                params: { entityId: offerId, entityType: 'offer', date }
            });
            
            // Add access fee calculation based on offer discount
            if (response.data.success && response.data.entityType === 'offer') {
                // Access fee is calculated from offer details if available
                const offerResponse = await this.api.get(`/offers/${offerId}`);
                if (offerResponse.data.success && offerResponse.data.offer) {
                    const discount = parseFloat(offerResponse.data.offer.discount) || 20;
                    response.data.accessFee = (discount * 0.15).toFixed(2);
                }
                response.data.requiresPayment = true;
                response.data.bookingType = 'offer';
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching offer slots:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get available slots for direct service booking (no access fee)
     * Note: Slots are shared with offer bookings for the same service
     */
    async getAvailableSlotsForService(serviceId, date) {
        try {
            console.log('📅 Getting unified slots for service:', serviceId, date);
            
            const response = await this.api.get('/bookings/slots/unified', {
                params: { entityId: serviceId, entityType: 'service', date }
            });
            
            // No access fee for direct service bookings
            if (response.data.success) {
                response.data.accessFee = 0;
                response.data.requiresPayment = false;
                response.data.bookingType = 'service';
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching service slots:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Legacy method - determines type from parameters
     */
    async getAvailableSlots(entityId, date, bookingType = null) {
        try {
            // If booking type is explicitly provided
            if (bookingType === 'offer') {
                return this.getAvailableSlotsForOffer(entityId, date);
            } else if (bookingType === 'service') {
                return this.getAvailableSlotsForService(entityId, date);
            }
            
            // Legacy support - try to determine from entity ID
            console.log('🔍 Legacy slot request, determining type for:', entityId);
            
            // First try as offer
            try {
                return await this.getAvailableSlotsForOffer(entityId, date);
            } catch (offerError) {
                console.log('⚠️ Not an offer, trying as service...');
                return await this.getAvailableSlotsForService(entityId, date);
            }
        } catch (error) {
            console.error('❌ Error in legacy getAvailableSlots:', error);
            throw this.handleError(error);
        }
    }

    // ==================== BOOKING CREATION ====================

    /**
     * Create a booking (handles both offers and services)
     */
    async createBooking(bookingData) {
        try {
            console.log('📝 Creating booking:', bookingData);
            
            // Determine booking type
            const isOfferBooking = bookingData.offerId || bookingData.bookingType === 'offer';
            const isServiceBooking = bookingData.serviceId || bookingData.bookingType === 'service';
            
            if (!isOfferBooking && !isServiceBooking) {
                throw new Error('Booking must specify either offerId or serviceId');
            }
            
            // Prepare booking payload
            const payload = {
                ...bookingData,
                bookingType: isOfferBooking ? 'offer' : 'service'
            };
            
            // For offer bookings, ensure access fee is calculated correctly
            if (isOfferBooking && payload.paymentData) {
                console.log('💰 Offer booking - calculating access fee');
                // Access fee should be calculated on the backend, but ensure it's present
            }
            
            // For service bookings, remove payment data
            if (isServiceBooking) {
                console.log('🔧 Service booking - no payment required');
                delete payload.paymentData;
                payload.accessFee = 0;
            }
            
            const response = await this.api.post('/bookings/create', payload);
            
            console.log('✅ Booking created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating booking:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Create offer booking with payment
     */
    async createOfferBooking(offerBookingData) {
        try {
            return await this.createBooking({
                ...offerBookingData,
                bookingType: 'offer'
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Create service booking without payment
     */
    async createServiceBooking(serviceBookingData) {
        try {
            return await this.createBooking({
                ...serviceBookingData,
                bookingType: 'service',
                accessFee: 0
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== STORE AND STAFF MANAGEMENT ====================

    /**
     * Get stores for offer
     */
    async getStoresForOffer(offerId) {
        try {
            const response = await this.api.get(`/bookings/stores/offer/${offerId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get stores for service
     */
    async getStoresForService(serviceId) {
        try {
            const response = await this.api.get(`/bookings/stores/service/${serviceId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get staff for store
     */
    async getStaffForStore(storeId) {
        try {
            const response = await this.api.get(`/bookings/staff/store/${storeId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== BOOKING MANAGEMENT ====================

    /**
     * Get user bookings with enhanced filtering
     */
    async getUserBookings(params = {}) {
        try {
            const response = await this.api.get('/bookings/user', { params });
            
            // Enhance bookings with type information and actions
            if (response.data.success && response.data.bookings) {
                response.data.bookings = response.data.bookings.map(booking => ({
                    ...booking,
                    isOfferBooking: booking.bookingType === 'offer' || !!booking.offerId,
                    isServiceBooking: booking.bookingType === 'service' || (!booking.offerId && !!booking.serviceId),
                    requiresPayment: booking.bookingType === 'offer' || !!booking.offerId,
                    accessFeePaid: (booking.bookingType === 'offer' || !!booking.offerId) && !!booking.paymentId,
                    canCancel: this.canCancelBooking(booking),
                    canReschedule: this.canRescheduleBooking(booking),
                    isUpcoming: new Date(booking.startTime) > new Date(),
                    isPast: new Date(booking.endTime) < new Date(),
                    refundEligible: this.isRefundEligible(booking)
                }));
            }
            
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get booking by ID
     */
    async getBookingById(bookingId) {
        try {
            const response = await this.api.get(`/bookings/${bookingId}`);
            
            if (response.data.success && response.data.booking) {
                const booking = response.data.booking;
                booking.canCancel = this.canCancelBooking(booking);
                booking.canReschedule = this.canRescheduleBooking(booking);
                booking.refundEligible = this.isRefundEligible(booking);
            }
            
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Cancel booking with reason
     */
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

    /**
     * Reschedule booking to new date/time
     */
    async rescheduleBooking(bookingId, newDate, newTime, reason = '') {
        try {
            console.log('🔄 Rescheduling booking:', bookingId, 'to', newDate, newTime);
            
            const response = await this.api.put(`/bookings/${bookingId}/reschedule`, {
                newDate,
                newTime,
                reason
            });
            
            console.log('✅ Booking rescheduled successfully');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get available slots for rescheduling (excludes current booking slot)
     */
    async getAvailableSlotsForRescheduling(bookingId, newDate) {
        try {
            console.log('📅 Getting reschedule slots for booking:', bookingId, 'on', newDate);
            
            const response = await this.api.get(`/bookings/${bookingId}/reschedule-slots`, {
                params: { date: newDate }
            });
            
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update booking status
     */
    async updateBookingStatus(bookingId, status) {
        try {
            const response = await this.api.put(`/bookings/${bookingId}/status`, { status });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== BOOKING RULES AND VALIDATION ====================

    /**
     * Check if booking can be cancelled
     */
    canCancelBooking(booking) {
        // Cannot cancel past bookings
        if (new Date(booking.startTime) < new Date()) {
            return { allowed: false, reason: 'Cannot cancel past bookings' };
        }

        // Cannot cancel already cancelled bookings
        if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
            return { allowed: false, reason: 'Booking is already cancelled or completed' };
        }

        // Check minimum cancellation notice (default 2 hours for offers, 30 minutes for services)
        const now = new Date();
        const bookingStart = new Date(booking.startTime);
        const minutesUntilBooking = (bookingStart - now) / (1000 * 60);
        
        const minCancellationTime = booking.isOfferBooking ? 120 : 30; // 2 hours for offers, 30 min for services
        
        if (minutesUntilBooking < minCancellationTime) {
            const hoursRequired = Math.ceil(minCancellationTime / 60);
            return { 
                allowed: false, 
                reason: `Must cancel at least ${hoursRequired} hour${hoursRequired > 1 ? 's' : ''} before appointment` 
            };
        }

        return { allowed: true };
    }

    /**
     * Check if booking can be rescheduled
     */
    canRescheduleBooking(booking) {
        // Cannot reschedule past bookings
        if (new Date(booking.startTime) < new Date()) {
            return { allowed: false, reason: 'Cannot reschedule past bookings' };
        }

        // Cannot reschedule cancelled or completed bookings
        if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
            return { allowed: false, reason: 'Cannot reschedule cancelled or completed bookings' };
        }

        // Check minimum reschedule notice (same as cancellation)
        const canCancel = this.canCancelBooking(booking);
        if (!canCancel.allowed) {
            return { allowed: false, reason: canCancel.reason.replace('cancel', 'reschedule') };
        }

        return { allowed: true };
    }

    /**
     * Check if booking is eligible for refund (offer bookings only)
     */
    isRefundEligible(booking) {
        // Only offer bookings with paid access fees are eligible
        if (!booking.isOfferBooking || !booking.accessFeePaid) {
            return { eligible: false, reason: 'Only paid offer bookings are eligible for refunds' };
        }

        // Check if booking is cancelled
        if (booking.status !== 'cancelled') {
            return { eligible: false, reason: 'Booking must be cancelled to be eligible for refund' };
        }

        // Check refund time window (e.g., 24 hours before booking)
        const now = new Date();
        const bookingStart = new Date(booking.startTime);
        const hoursUntilBooking = (bookingStart - now) / (1000 * 60 * 60);
        
        if (hoursUntilBooking < 24) {
            return { eligible: false, reason: 'Refunds only available for cancellations made 24+ hours in advance' };
        }

        return { eligible: true, amount: booking.accessFee };
    }

    /**
     * Request refund for cancelled offer booking
     */
    async requestRefund(bookingId, reason = '') {
        try {
            console.log('💰 Requesting refund for booking:', bookingId);
            
            const response = await this.api.post(`/bookings/${bookingId}/refund`, { reason });
            
            console.log('✅ Refund requested successfully');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== PAYMENT PROCESSING ====================

    /**
     * Process M-Pesa payment for offer booking
     */
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

    /**
     * Check payment status
     */
    async checkPaymentStatus(paymentId) {
        try {
            const response = await this.api.get(`/payments/${paymentId}/status`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== ANALYTICS ====================

    /**
     * Get booking analytics
     */
    async getBookingAnalytics(params = {}) {
        try {
            const response = await this.api.get('/bookings/analytics', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Calculate access fee for offer
     */
    calculateAccessFee(discount) {
        return (parseFloat(discount) * 0.15).toFixed(2);
    }

    /**
     * Validate booking data
     */
    validateBookingData(bookingData) {
        const errors = [];
        
        if (!bookingData.userId) {
            errors.push('User ID is required');
        }
        
        if (!bookingData.startTime) {
            errors.push('Start time is required');
        }
        
        if (!bookingData.offerId && !bookingData.serviceId) {
            errors.push('Either offer ID or service ID is required');
        }
        
        if (bookingData.offerId && bookingData.serviceId) {
            errors.push('Cannot specify both offer ID and service ID');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Handle API errors
     */
    handleError(error) {
        console.error('🚨 Booking service error:', error);
        
        if (error.response) {
            // Server responded with error
            const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
            const newError = new Error(message);
            newError.status = error.response.status;
            newError.response = error.response;
            return newError;
        } else if (error.request) {
            // Network error
            return new Error('Network error. Please check your connection and try again.');
        } else {
            // Other error
            return error;
        }
    }

    // ==================== OFFERS AND SERVICES DATA ====================

    /**
     * Get offer details for booking
     */
    async getOfferForBooking(offerId) {
        try {
            const response = await this.api.get(`/offers/${offerId}/booking-details`);
            
            if (response.data.success && response.data.offer) {
                // Add calculated access fee
                const discount = parseFloat(response.data.offer.discount) || 20;
                response.data.offer.calculatedAccessFee = this.calculateAccessFee(discount);
            }
            
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get service details for booking
     */
    async getServiceForBooking(serviceId) {
        try {
            const response = await this.api.get(`/services/${serviceId}/booking-details`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }
}

// Create and export singleton instance
const enhancedBookingService = new EnhancedBookingService();

export default enhancedBookingService;

// Also export individual methods for convenience
export const {
    getAvailableSlots,
    getAvailableSlotsForOffer,
    getAvailableSlotsForService,
    createBooking,
    createOfferBooking,
    createServiceBooking,
    getStoresForOffer,
    getStoresForService,
    getStaffForStore,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    processMpesaPayment,
    checkPaymentStatus,
    getBookingAnalytics,
    calculateAccessFee,
    validateBookingData,
    getOfferForBooking,
    getServiceForBooking
} = enhancedBookingService;