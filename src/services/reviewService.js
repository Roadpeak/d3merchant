// services/reviewService.js - New service for handling reviews

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.discoun3ree.com/api/v1';

class ReviewService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('📝 ReviewService initialized');
  }

  // Get auth token (same pattern as StoreService)
  getAuthToken() {
    const tokenSources = [
      localStorage.getItem('access_token'),
      localStorage.getItem('authToken'),
      localStorage.getItem('token'),
      this.getCookieToken('access_token'),
      this.getCookieToken('authToken'),
      this.getCookieToken('token')
    ];

    const token = tokenSources.find(t => t && t.trim());

    if (token) {
      console.log('🔐 Auth token found for reviews');
    } else {
      console.log('⚠️ No auth token found for reviews');
    }

    return token;
  }

  // Get token from cookie
  getCookieToken(name = 'access_token') {
    try {
      if (typeof document === 'undefined') return null;

      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name && value) {
          return decodeURIComponent(value);
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading cookie:', error);
      return null;
    }
  }

  // Get headers with auth
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Fetch data helper
  async fetchData(endpoint, options = {}) {
    try {
      const fullUrl = `${this.baseURL}${endpoint}`;
      console.log(`🔗 Making review request to: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        headers: this.getHeaders(),
        ...options,
      });

      console.log(`📡 Review response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorBody = await response.text();
          console.log('❌ Review error response:', errorBody);

          try {
            const errorDetails = JSON.parse(errorBody);
            errorMessage = errorDetails.message || errorMessage;
          } catch (e) {
            errorMessage = errorBody || errorMessage;
          }
        } catch (e) {
          console.error('Could not read error response:', e);
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log('✅ Review response data received');
      return data;

    } catch (error) {
      console.error('🔥 Review API Error:', {
        message: error.message,
        status: error.status,
        endpoint: `${this.baseURL}${endpoint}`
      });

      throw error;
    }
  }

  // Get reviews for merchant's own store (for dashboard)
  async getMerchantStoreReviews(params = {}) {
    const { page = 1, limit = 20, rating = 'all', sortBy = 'newest' } = params;

    console.log('📊 Fetching merchant store reviews with params:', params);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy
    });

    if (rating && rating !== 'all') {
      queryParams.append('rating', rating);
    }

    return this.fetchData(`/merchant/reviews?${queryParams.toString()}`);
  }

  // Get reviews for a specific store (public endpoint)
  async getStoreReviews(storeId, params = {}) {
    const { page = 1, limit = 20, rating = 'all', sortBy = 'newest' } = params;

    console.log('📖 Fetching store reviews:', storeId, params);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy
    });

    if (rating && rating !== 'all') {
      queryParams.append('rating', rating);
    }

    return this.fetchData(`/stores/${storeId}/reviews?${queryParams.toString()}`);
  }

  // Create a new review (for customers)
  async createReview(reviewData) {
    console.log('✍️ Creating review:', reviewData);

    return this.fetchData('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  // Update a review
  async updateReview(reviewId, updateData) {
    console.log('✏️ Updating review:', reviewId, updateData);

    return this.fetchData(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Delete a review
  async deleteReview(reviewId) {
    console.log('🗑️ Deleting review:', reviewId);

    return this.fetchData(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }

  // Get a single review by ID
  async getReviewById(reviewId) {
    console.log('🔍 Fetching review by ID:', reviewId);

    return this.fetchData(`/reviews/${reviewId}`);
  }

  // Export reviews (future feature)
  async exportReviews(storeId, format = 'csv') {
    console.log('📤 Exporting reviews:', storeId, format);

    // This would be implemented when export functionality is added
    return this.fetchData(`/stores/${storeId}/reviews/export?format=${format}`);
  }
}

// Create and export instance
const reviewServiceInstance = new ReviewService();
export default reviewServiceInstance;

// ============================================
// UPDATED fetchReviews function for api_service.js
// ============================================

// Replace your current fetchReviews function with this:
export const fetchReviews = async (storeId = null, params = {}) => {
  try {
    console.log('📝 fetchReviews called with:', { storeId, params });

    if (storeId) {
      // Fetch reviews for a specific store
      const data = await reviewServiceInstance.getStoreReviews(storeId, params);
      return data.success ? data.reviews : [];
    } else {
      // Fetch reviews for merchant's own store (dashboard)
      const data = await reviewServiceInstance.getMerchantStoreReviews(params);
      return data.success ? data.reviews : [];
    }
  } catch (error) {
    console.error('fetchReviews error:', error);
    throw error;
  }
};

// Additional utility functions you can add to api_service.js:

export const fetchMerchantReviewStats = async () => {
  try {
    const data = await reviewServiceInstance.getMerchantStoreReviews({ limit: 1000 }); // Get all for stats
    return data.success ? data.stats : null;
  } catch (error) {
    console.error('fetchMerchantReviewStats error:', error);
    return null;
  }
};

export const createCustomerReview = async (storeId, rating, text) => {
  try {
    const data = await reviewServiceInstance.createReview({
      store_id: storeId,
      rating,
      text
    });
    return data;
  } catch (error) {
    console.error('createCustomerReview error:', error);
    throw error;
  }
};