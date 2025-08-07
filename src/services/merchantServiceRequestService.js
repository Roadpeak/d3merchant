// services/merchantServiceRequestService.js - Merchant-specific service request API
import merchantAuthService from './merchantAuthService'; // Your existing merchant auth service

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Helper function to check if merchant is authenticated
const ensureMerchantAuthenticated = () => {
  if (!merchantAuthService.isAuthenticated()) {
    throw new Error('Please log in as a merchant to access this feature.');
  }
};

// Helper function to get auth headers for merchants
const getMerchantAuthHeaders = () => {
  const token = merchantAuthService.getToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add API key if available (from your merchant auth service)
  if (merchantAuthService.getHeaders) {
    const merchantHeaders = merchantAuthService.getHeaders(true);
    Object.assign(headers, merchantHeaders);
  }

  return headers;
};

// Enhanced API request function for merchants
const makeMerchantAPIRequest = async (url, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add merchant auth headers if authenticated
    if (merchantAuthService.isAuthenticated()) {
      const authHeaders = getMerchantAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    const config = {
      ...options,
      headers
    };

    console.log('🏪 Merchant API Request:', { 
      url: url.replace(API_BASE_URL, ''), 
      method: config.method || 'GET',
      authenticated: !!headers.Authorization 
    });
    
    const response = await fetch(url, config);
    
    console.log(`📡 Merchant API Response: ${response.status}`);

    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Handle HTTP errors
    if (!response.ok) {
      const error = new Error(data.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = data;
      
      // Handle authentication errors using merchant auth service
      if (response.status === 401) {
        console.warn('🔒 Merchant authentication failed (401)');
        if (merchantAuthService.handleAuthError) {
          merchantAuthService.handleAuthError(error);
        } else {
          merchantAuthService.logout();
        }
        throw new Error(data.message || 'Your session has expired. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error(data.message || 'Access denied. You may not have merchant permissions for this action.');
      }
      
      if (response.status === 404) {
        throw new Error(data.message || 'Resource not found.');
      }
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || data.retryAfter || 60;
        throw new Error(`Too many requests. Please try again in ${retryAfter} seconds.`);
      }
      
      if (response.status >= 500) {
        throw new Error(data.message || 'Server error. Please try again later.');
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
    
    // Let merchant auth service handle auth errors
    if (error.message.includes('401') || error.message.includes('session') || error.message.includes('authentication')) {
      if (merchantAuthService.handleAuthError) {
        merchantAuthService.handleAuthError(error);
      }
    }
    
    throw error;
  }
};

class MerchantServiceRequestService {
  // Get service requests filtered by merchant's store categories (merchant auth required)
  async getServiceRequests(filters = {}) {
    try {
      ensureMerchantAuthenticated();

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/merchant/service-requests?${queryParams}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching merchant service requests:', error);
      throw error;
    }
  }

  // Create offer from a specific store (merchant auth required)
  async createStoreOffer(requestId, offerData) {
    try {
      ensureMerchantAuthenticated();

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

      // Validate message length
      if (offerData.message.length < 10) {
        throw new Error('Message must be at least 10 characters long');
      }

      const url = `${API_BASE_URL}/merchant/service-requests/${requestId}/offers`;
      return await makeMerchantAPIRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          storeId: offerData.storeId,
          quotedPrice: parseFloat(offerData.quotedPrice),
          message: offerData.message,
          availability: offerData.availability,
          estimatedDuration: offerData.estimatedDuration || null,
          includesSupplies: offerData.includesSupplies || false,
          warranty: offerData.warranty || null
        })
      });
    } catch (error) {
      console.error('Error creating store offer:', error);
      throw error;
    }
  }

  // Get merchant's store offers with status tracking (merchant auth required)
  async getMerchantOffers(filters = {}) {
    try {
      ensureMerchantAuthenticated();

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/merchant/offers?${queryParams}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching merchant offers:', error);
      throw error;
    }
  }

  // Get merchant's stores (merchant auth required)
  async getMerchantStores() {
    try {
      ensureMerchantAuthenticated();

      const url = `${API_BASE_URL}/merchant/stores`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching merchant stores:', error);
      throw error;
    }
  }

  // Get dashboard statistics (merchant auth required)
  async getDashboardStats() {
    try {
      ensureMerchantAuthenticated();

      const url = `${API_BASE_URL}/merchant/dashboard/stats`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching merchant dashboard stats:', error);
      throw error;
    }
  }

  // Update offer status (merchant auth required)
  async updateOfferStatus(offerId, status, reason = '') {
    try {
      ensureMerchantAuthenticated();

      if (!offerId) {
        throw new Error('Offer ID is required');
      }

      const validStatuses = ['pending', 'accepted', 'rejected', 'withdrawn'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const url = `${API_BASE_URL}/merchant/offers/${offerId}`;
      return await makeMerchantAPIRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      });
    } catch (error) {
      console.error('Error updating offer status:', error);
      throw error;
    }
  }

  // Withdraw offer (merchant auth required)
  async withdrawOffer(offerId, reason = '') {
    try {
      return await this.updateOfferStatus(offerId, 'withdrawn', reason);
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      throw error;
    }
  }

  // Get request analytics for merchants (merchant auth required)
  async getRequestAnalytics(period = '30d') {
    try {
      ensureMerchantAuthenticated();

      const validPeriods = ['7d', '30d', '90d', '1y'];
      if (!validPeriods.includes(period)) {
        throw new Error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
      }

      const url = `${API_BASE_URL}/merchant/analytics/requests?period=${period}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching merchant analytics:', error);
      throw error;
    }
  }

  // Get offer analytics for merchants (merchant auth required)
  async getOfferAnalytics(period = '30d') {
    try {
      ensureMerchantAuthenticated();

      const url = `${API_BASE_URL}/merchant/analytics/offers?period=${period}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching offer analytics:', error);
      throw error;
    }
  }

  // Create new store (merchant auth required)
  async createStore(storeData) {
    try {
      ensureMerchantAuthenticated();

      // Validate required fields
      const requiredFields = ['name', 'description', 'categories', 'location'];
      const missingFields = requiredFields.filter(field => !storeData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (!Array.isArray(storeData.categories) || storeData.categories.length === 0) {
        throw new Error('At least one category is required for the store');
      }

      const url = `${API_BASE_URL}/merchant/stores`;
      return await makeMerchantAPIRequest(url, {
        method: 'POST',
        body: JSON.stringify(storeData)
      });
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  }

  // Update store information (merchant auth required)
  async updateStore(storeId, updates) {
    try {
      ensureMerchantAuthenticated();

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const url = `${API_BASE_URL}/merchant/stores/${storeId}`;
      return await makeMerchantAPIRequest(url, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  }

  // Get specific store details (merchant auth required)
  async getStoreDetails(storeId) {
    try {
      ensureMerchantAuthenticated();

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const url = `${API_BASE_URL}/merchant/stores/${storeId}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching store details:', error);
      throw error;
    }
  }

  // Get store performance metrics (merchant auth required)
  async getStorePerformance(storeId, period = '30d') {
    try {
      ensureMerchantAuthenticated();

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const url = `${API_BASE_URL}/merchant/stores/${storeId}/performance?period=${period}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching store performance:', error);
      throw error;
    }
  }

  // Get notifications for merchant (merchant auth required)
  async getNotifications(filters = {}) {
    try {
      ensureMerchantAuthenticated();

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/merchant/notifications?${queryParams}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching merchant notifications:', error);
      throw error;
    }
  }

  // Mark notification as read (merchant auth required)
  async markNotificationAsRead(notificationId) {
    try {
      ensureMerchantAuthenticated();

      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      const url = `${API_BASE_URL}/merchant/notifications/${notificationId}/read`;
      return await makeMerchantAPIRequest(url, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get service request details (merchant view with additional info)
  async getServiceRequestDetails(requestId) {
    try {
      ensureMerchantAuthenticated();

      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const url = `${API_BASE_URL}/merchant/service-requests/${requestId}`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching service request details:', error);
      throw error;
    }
  }

  // Get competitor analysis for a request (merchant auth required)
  async getCompetitorAnalysis(requestId) {
    try {
      ensureMerchantAuthenticated();

      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const url = `${API_BASE_URL}/merchant/service-requests/${requestId}/competitor-analysis`;
      return await makeMerchantAPIRequest(url);
    } catch (error) {
      console.error('Error fetching competitor analysis:', error);
      throw error;
    }
  }

  // Update merchant profile through service (merchant auth required)
  async updateMerchantProfile(profileData) {
    try {
      ensureMerchantAuthenticated();

      // Use the merchant auth service's update method if available
      if (merchantAuthService.updateMerchantProfile) {
        return await merchantAuthService.updateMerchantProfile(profileData);
      }

      // Fallback to direct API call
      const url = `${API_BASE_URL}/merchant/profile`;
      return await makeMerchantAPIRequest(url, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
    } catch (error) {
      console.error('Error updating merchant profile:', error);
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

  getMerchantId() {
    return merchantAuthService.getMerchantId();
  }

  // Validate offer data before submission
  validateOfferData(data) {
    const errors = [];
    
    if (!data.storeId) {
      errors.push('Store selection is required');
    }
    
    if (!data.quotedPrice || parseFloat(data.quotedPrice) <= 0) {
      errors.push('Valid quoted price is required and must be greater than 0');
    }
    
    if (data.quotedPrice && parseFloat(data.quotedPrice) > 1000000) {
      errors.push('Quoted price seems unusually high. Please verify.');
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
    
    if (data.estimatedDuration && data.estimatedDuration.length > 100) {
      errors.push('Estimated duration must be less than 100 characters');
    }
    
    return errors;
  }

  // Validate store data before submission
  validateStoreData(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 3) {
      errors.push('Store name must be at least 3 characters long');
    }
    
    if (data.name && data.name.length > 100) {
      errors.push('Store name must be less than 100 characters');
    }
    
    if (!data.description || data.description.trim().length < 10) {
      errors.push('Store description must be at least 10 characters long');
    }
    
    if (data.description && data.description.length > 500) {
      errors.push('Store description must be less than 500 characters');
    }
    
    if (!data.categories || !Array.isArray(data.categories) || data.categories.length === 0) {
      errors.push('At least one category is required');
    }
    
    if (data.categories && data.categories.length > 5) {
      errors.push('Maximum 5 categories allowed per store');
    }
    
    if (!data.location || data.location.trim().length < 5) {
      errors.push('Store location must be at least 5 characters long');
    }
    
    if (data.location && data.location.length > 255) {
      errors.push('Store location must be less than 255 characters');
    }
    
    return errors;
  }

  // Format time ago utility
  formatTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }

  // Get timeline label
  getTimelineLabel(timeline) {
    const timelineMap = {
      'urgent': 'ASAP/Urgent',
      'thisweek': 'This Week',
      'nextweek': 'Next Week',
      'thismonth': 'This Month',
      'flexible': 'Flexible'
    };
    return timelineMap[timeline] || timeline;
  }

  // Get status badge configuration
  getStatusBadgeConfig(status) {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'accepted': { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      'withdrawn': { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' },
      'expired': { color: 'bg-gray-100 text-gray-600', label: 'Expired' }
    };

    return statusMap[status] || { color: 'bg-gray-100 text-gray-600', label: status };
  }

  // Check if offer can be withdrawn
  canWithdrawOffer(offer) {
    return offer.status === 'pending' && new Date(offer.expiresAt) > new Date();
  }

  // Check if store matches request category
  storeMatchesRequestCategory(store, requestCategory) {
    return store.categories && store.categories.includes(requestCategory);
  }
}

// Create and export singleton instance
const merchantServiceRequestService = new MerchantServiceRequestService();

export default merchantServiceRequestService;