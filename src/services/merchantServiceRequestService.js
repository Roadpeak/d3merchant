// services/merchantServiceRequestService.js - FIXED VERSION FOR STORE-BASED OFFERS
import merchantAuthService from './merchantAuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '${import.meta.env.VITE_API_BASE_URL}/api/v1';

// Enhanced function to get auth headers for merchants
const getMerchantAuthHeaders = () => {
  const token = merchantAuthService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY || 'API_KEY_12345ABCDEF!@#67890-xyZQvTPOl'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Merchant auth header added');
  } else {
    console.warn('⚠️ No merchant auth token available');
  }

  return headers;
};

// Enhanced API request function for merchants
const makeMerchantAPIRequest = async (url, options = {}) => {
  try {
    const isAuthRequired = options.requireAuth !== false;

    let headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth headers if merchant is authenticated
    if (merchantAuthService.isAuthenticated()) {
      const authHeaders = getMerchantAuthHeaders();
      headers = { ...headers, ...authHeaders };
    } else if (isAuthRequired) {
      throw new Error('Merchant authentication required');
    }

    const config = {
      ...options,
      headers
    };

    console.log('🌐 Merchant API Request:', {
      url: url.replace(API_BASE_URL, ''),
      method: config.method || 'GET',
      authenticated: !!headers.Authorization,
      requireAuth: isAuthRequired
    });

    const response = await fetch(url, config);

    console.log(`📡 Merchant API Response: ${response.status}`);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, it might be an HTML error page
      const text = await response.text();
      console.error('❌ Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response. Check if API endpoint exists.');
    }

    // Handle HTTP errors
    if (!response.ok) {
      const error = new Error(data.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = data;

      // Handle specific merchant auth errors
      if (response.status === 401) {
        console.warn('🔒 Merchant authentication failed (401)');
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('Access denied. Merchant permissions required.');
      }

      throw error;
    }

    console.log('✅ Merchant API request successful');
    return data;

  } catch (error) {
    console.error(`❌ Merchant API request failed:`, error);

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

class MerchantServiceRequestService {
  // ✅ FIXED: Get service requests filtered by merchant's store categories
  async getServiceRequestsForMerchant(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });

      // ✅ FIXED: Use the dedicated merchant endpoint
      const url = `${API_BASE_URL}/merchant/service-requests?${queryParams}`;
      const response = await makeMerchantAPIRequest(url, { requireAuth: true });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch service requests for merchant');
      }

      return response;
    } catch (error) {
      console.error('Error fetching service requests for merchant:', error);
      throw error;
    }
  }

  // ✅ FIXED: Get merchant's stores
  async getMerchantStores() {
    try {
      const url = `${API_BASE_URL}/merchant/stores`;
      const response = await makeMerchantAPIRequest(url, { requireAuth: true });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch merchant stores');
      }

      return response;
    } catch (error) {
      console.error('Error fetching merchant stores:', error);
      throw error;
    }
  }

  // ✅ FIXED: Create STORE offer for a service request (key change here)
  async createStoreOffer(requestId, offerData) {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      // Validate required fields
      const requiredFields = ['storeId', 'quotedPrice', 'message', 'availability'];
      const missingFields = requiredFields.filter(field => !offerData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate quoted price
      if (parseFloat(offerData.quotedPrice) <= 0) {
        throw new Error('Quoted price must be greater than 0');
      }

      // ✅ CRITICAL: Use the service request endpoint that creates STORE-BASED offers
      const url = `${API_BASE_URL}/request-service/${requestId}/offers`;

      console.log('🚀 Creating STORE offer:', {
        requestId,
        storeId: offerData.storeId,
        quotedPrice: offerData.quotedPrice
      });

      const response = await makeMerchantAPIRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          storeId: offerData.storeId, // ✅ CRITICAL: Store ID is required
          quotedPrice: parseFloat(offerData.quotedPrice),
          message: offerData.message,
          availability: offerData.availability,
          estimatedDuration: offerData.estimatedDuration || null,
          includesSupplies: offerData.includesSupplies || false
        }),
        requireAuth: true
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create store offer');
      }

      console.log('✅ Store offer created successfully:', response.data?.offer?.id);
      return response;
    } catch (error) {
      console.error('Error creating store offer:', error);
      throw error;
    }
  }

  // ✅ FIXED: Get merchant's offers across all stores
  async getMerchantOffers(pagination = {}) {
    try {
      const { page = 1, limit = 10, status = 'all', storeId = 'all' } = pagination;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (status !== 'all') {
        queryParams.append('status', status);
      }

      if (storeId !== 'all') {
        queryParams.append('storeId', storeId);
      }

      const url = `${API_BASE_URL}/merchant/offers?${queryParams}`;
      const response = await makeMerchantAPIRequest(url, { requireAuth: true });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch merchant offers');
      }

      return response;
    } catch (error) {
      console.error('Error fetching merchant offers:', error);
      throw error;
    }
  }

  // ✅ FIXED: Get merchant dashboard statistics
  async getDashboardStats() {
    try {
      const url = `${API_BASE_URL}/merchant/dashboard/stats`;
      const response = await makeMerchantAPIRequest(url, { requireAuth: true });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }

      return response;
    } catch (error) {
      console.error('Error fetching merchant dashboard stats:', error);
      throw error;
    }
  }

  // ✅ FIXED: Update offer status
  async updateOfferStatus(offerId, status, reason = '') {
    try {
      if (!offerId) {
        throw new Error('Offer ID is required');
      }

      const url = `${API_BASE_URL}/merchant/offers/${offerId}`;
      const response = await makeMerchantAPIRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
        requireAuth: true
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update offer status');
      }

      return response;
    } catch (error) {
      console.error('Error updating offer status:', error);
      throw error;
    }
  }

  // ✅ NEW: Get offers for a specific service request (to check if store already offered)
  async getRequestOffers(requestId) {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const url = `${API_BASE_URL}/request-service/${requestId}/offers`;
      const response = await makeMerchantAPIRequest(url, { requireAuth: true });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch request offers');
      }

      return response;
    } catch (error) {
      console.error('Error fetching request offers:', error);
      throw error;
    }
  }

  // ✅ NEW: Get detailed service request information
  async getServiceRequestDetails(requestId) {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const url = `${API_BASE_URL}/request-service/${requestId}`;
      const response = await makeMerchantAPIRequest(url, { requireAuth: false });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch service request details');
      }

      return response;
    } catch (error) {
      console.error('Error fetching service request details:', error);
      throw error;
    }
  }

  // ✅ NEW: Check if any of merchant's stores already offered on a request
  async checkExistingOffer(requestId) {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      // Get merchant's stores first
      const storesResponse = await this.getMerchantStores();
      if (!storesResponse.success || !storesResponse.data?.stores) {
        return { hasOffered: false, stores: [] };
      }

      const storeIds = storesResponse.data.stores.map(store => store.id);

      // Get offers for this request
      const offersResponse = await this.getRequestOffers(requestId);
      if (!offersResponse.success || !offersResponse.data?.offers) {
        return { hasOffered: false, stores: storesResponse.data.stores };
      }

      // Check if any of the merchant's stores has offered
      const merchantOffers = offersResponse.data.offers.filter(offer =>
        storeIds.includes(offer.storeId)
      );

      return {
        hasOffered: merchantOffers.length > 0,
        stores: storesResponse.data.stores,
        existingOffers: merchantOffers
      };
    } catch (error) {
      console.error('Error checking existing offer:', error);
      return { hasOffered: false, stores: [] };
    }
  }

  // ✅ NEW: Get store performance analytics
  async getStoreAnalytics(storeId, period = '30d') {
    try {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const url = `${API_BASE_URL}/merchant/stores/${storeId}/analytics?period=${period}`;
      const response = await makeMerchantAPIRequest(url, { requireAuth: true });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch store analytics');
      }

      return response;
    } catch (error) {
      console.error('Error fetching store analytics:', error);
      throw error;
    }
  }

  // ✅ NEW: Withdraw an offer
  async withdrawOffer(offerId, reason = '') {
    try {
      if (!offerId) {
        throw new Error('Offer ID is required');
      }

      return await this.updateOfferStatus(offerId, 'withdrawn', reason);
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      throw error;
    }
  }

  // Helper methods
  isAuthenticated() {
    return merchantAuthService.isAuthenticated();
  }

  getCurrentMerchant() {
    return merchantAuthService.getCurrentMerchant();
  }

  // Debug method to check authentication state
  debugAuth() {
    const token = merchantAuthService.getToken();
    const isAuth = merchantAuthService.isAuthenticated();
    const merchant = this.getCurrentMerchant();

    console.log('🔍 Merchant Auth Debug:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      isAuthenticated: isAuth,
      hasMerchant: !!merchant,
      merchantEmail: merchant?.email_address,
      merchantName: merchant ? `${merchant.first_name} ${merchant.last_name}` : null
    });

    return {
      hasToken: !!token,
      isAuthenticated: isAuth,
      hasMerchant: !!merchant,
      merchant
    };
  }

  // ✅ ENHANCED: Validate store offer data before submission
  validateOfferData(data) {
    const errors = [];

    if (!data.storeId) {
      errors.push('Store selection is required');
    }

    if (!data.quotedPrice || parseFloat(data.quotedPrice) <= 0) {
      errors.push('Valid quoted price is required and must be greater than 0');
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters long');
    }

    if (data.message && data.message.length > 1000) {
      errors.push('Message must be less than 1000 characters');
    }

    if (!data.availability) {
      errors.push('Availability information is required');
    }

    if (data.availability && data.availability.length > 200) {
      errors.push('Availability must be less than 200 characters');
    }

    return errors;
  }

  // ✅ NEW: Validate if offer price is within request budget
  validateOfferPrice(quotedPrice, requestBudgetMin, requestBudgetMax) {
    const price = parseFloat(quotedPrice);
    const minBudget = parseFloat(requestBudgetMin) || 0;
    const maxBudget = parseFloat(requestBudgetMax) || Infinity;

    return {
      isValid: price >= minBudget && price <= maxBudget,
      isWithinRange: price >= minBudget && price <= maxBudget,
      isOverBudget: price > maxBudget,
      isUnderBudget: price < minBudget,
      price,
      minBudget,
      maxBudget
    };
  }

  // ✅ NEW: Helper method to format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) || 0);
  }

  // ✅ NEW: Helper method to calculate estimated response time
  calculateResponseTime(requestCreatedAt) {
    const now = new Date();
    const created = new Date(requestCreatedAt);
    const diffInHours = Math.abs(now - created) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Less than 1 hour';
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)} hour${Math.round(diffInHours) !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }
}

// Create and export singleton instance
const merchantServiceRequestService = new MerchantServiceRequestService();

export default merchantServiceRequestService;