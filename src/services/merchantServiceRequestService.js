// services/merchantServiceRequestService.js - API service for merchant service requests
import merchantAuthService from './merchantAuthService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Enhanced function to get auth headers for merchants
const getMerchantAuthHeaders = () => {
  const token = merchantAuthService.getToken();
  const headers = {
    'Content-Type': 'application/json'
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
        merchantAuthService.logout();
        throw new Error('Your session has expired. Please log in again.');
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
  // Get all service requests filtered by merchant's store categories
  async getServiceRequests(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/request-service?${queryParams}`;
      return await makeMerchantAPIRequest(url, { requireAuth: false });
    } catch (error) {
      console.error('Error fetching service requests for merchant:', error);
      throw error;
    }
  }

  // Get merchant's stores
  async getMerchantStores() {
    try {
      const url = `${API_BASE_URL}/merchant/stores`;
      return await makeMerchantAPIRequest(url, { requireAuth: true });
    } catch (error) {
      console.error('Error fetching merchant stores:', error);
      throw error;
    }
  }

  // Get merchant's store details by ID
  async getStoreDetails(storeId) {
    try {
      const url = `${API_BASE_URL}/stores/profile/${storeId}`;
      return await makeMerchantAPIRequest(url, { requireAuth: true });
    } catch (error) {
      console.error('Error fetching store details:', error);
      throw error;
    }
  }

  // Create offer for a service request
  async createStoreOffer(requestId, offerData) {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      // Validate required fields
      const requiredFields = ['quotedPrice', 'message', 'availability'];
      const missingFields = requiredFields.filter(field => !offerData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate quoted price
      if (parseFloat(offerData.quotedPrice) <= 0) {
        throw new Error('Quoted price must be greater than 0');
      }

      const url = `${API_BASE_URL}/service-requests/${requestId}/offers`;
      
      console.log('🚀 Creating merchant offer:', {
        requestId,
        quotedPrice: offerData.quotedPrice,
        storeId: offerData.storeId
      });
      
      return await makeMerchantAPIRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          storeId: offerData.storeId,
          quotedPrice: parseFloat(offerData.quotedPrice),
          message: offerData.message,
          availability: offerData.availability,
          estimatedDuration: offerData.estimatedDuration || null,
          includesSupplies: offerData.includesSupplies || false
        }),
        requireAuth: true
      });
    } catch (error) {
      console.error('Error creating store offer:', error);
      throw error;
    }
  }

  // Get merchant's offers across all stores
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
      return await makeMerchantAPIRequest(url, { requireAuth: true });
    } catch (error) {
      console.error('Error fetching merchant offers:', error);
      throw error;
    }
  }

  // Get merchant dashboard statistics
  async getDashboardStats() {
    try {
      const url = `${API_BASE_URL}/merchant/dashboard/stats`;
      return await makeMerchantAPIRequest(url, { requireAuth: true });
    } catch (error) {
      console.error('Error fetching merchant dashboard stats:', error);
      throw error;
    }
  }

  // Update offer status (withdraw, modify, etc.)
  async updateOfferStatus(offerId, status, reason = '') {
    try {
      if (!offerId) {
        throw new Error('Offer ID is required');
      }

      const url = `${API_BASE_URL}/merchant/offers/${offerId}`;
      return await makeMerchantAPIRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
        requireAuth: true
      });
    } catch (error) {
      console.error('Error updating offer status:', error);
      throw error;
    }
  }

  // Get service requests specifically for merchant's store categories
  async getServiceRequestsForMerchant(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/merchant/service-requests?${queryParams}`;
      return await makeMerchantAPIRequest(url, { requireAuth: true });
    } catch (error) {
      console.error('Error fetching service requests for merchant:', error);
      // Fallback to public requests if merchant-specific endpoint fails
      return await this.getServiceRequests(filters);
    }
  }

  // Get analytics data for merchant
  async getAnalytics(period = '30d') {
    try {
      const url = `${API_BASE_URL}/merchant/analytics?period=${period}`;
      return await makeMerchantAPIRequest(url, { requireAuth: true });
    } catch (error) {
      console.error('Error fetching merchant analytics:', error);
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

  // Validate offer data before submission
  validateOfferData(data) {
    const errors = [];
    
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

    if (!data.storeId) {
      errors.push('Store selection is required');
    }
    
    return errors;
  }
}

// Create and export singleton instance
const merchantServiceRequestService = new MerchantServiceRequestService();

export default merchantServiceRequestService;