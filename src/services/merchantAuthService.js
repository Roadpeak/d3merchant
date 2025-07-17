// services/merchantAuthService.js - Complete Updated Version
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
const API_KEY = import.meta.env.VITE_API_KEY;

class MerchantAuthService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/merchants`;
    this.isInitialized = false;
    this.init();
  }

  // Initialize the service
  init() {
    try {
      console.log('🔧 Initializing MerchantAuthService...');
      console.log('📍 API Base URL:', this.baseURL);
      console.log('🔑 API Key configured:', API_KEY ? 'Yes' : 'No');
      console.log('🔐 Secret Key configured:', SECRET_KEY ? 'Yes' : 'No');
      
      // Check if user is authenticated and token is valid
      if (this.isAuthenticated()) {
        console.log('✅ User is authenticated');
      } else {
        console.log('❌ User is not authenticated');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('💥 Error initializing MerchantAuthService:', error);
      this.isInitialized = false;
    }
  }

  // Get headers with API key and optional authentication
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Always include API key if configured
    if (API_KEY) {
      headers['api-key'] = API_KEY;
      console.log('✅ API key added to request headers');
    } else {
      console.warn('⚠️ VITE_API_KEY not found in environment variables');
    }

    // Include auth token if requested and available
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization token added to request headers');
      } else {
        console.warn('⚠️ No auth token available');
      }
    }

    return headers;
  }

  // Test API connection and key
  async testConnection() {
    try {
      console.log('🔍 Testing API connection and key...');
      
      const response = await fetch(`${this.baseURL}/test`, {
        method: 'GET',
        headers: this.getHeaders(false), // Only API key, no auth
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API test failed with status ${response.status}`);
      }

      console.log('✅ API connection test successful:', data);
      return data;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      
      // Check if it's a network error vs API error
      if (error.message.includes('fetch')) {
        throw new Error(`Cannot connect to API server at ${this.baseURL}. Please check if the server is running.`);
      } else {
        throw new Error(`API connection failed: ${error.message}`);
      }
    }
  }

  // Register new merchant
  async register(merchantData) {
    try {
      console.log('🔑 Registering new merchant...');
      console.log('📝 Registration data:', { ...merchantData, password: '[HIDDEN]' });
      
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(merchantData),
      });

      const data = await response.json();
      console.log('📨 Registration response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Registration failed with status ${response.status}`);
      }

      // If registration includes auth data, store it
      if (data.access_token && data.merchant) {
        const authData = {
          token: data.access_token,
          merchant: data.merchant,
          timestamp: Date.now()
        };
        this.storeAuthData(authData);
        console.log('✅ Registration successful, auth data stored');
      }

      return data;
    } catch (error) {
      console.error('💥 Registration error:', error);
      throw error;
    }
  }

  // Login merchant
  async login(credentials) {
    try {
      console.log('🔑 Logging in merchant...');
      console.log('📧 Login email:', credentials.email);
      
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('📨 Login response received');

      if (!response.ok) {
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      // Store authentication data
      const authData = {
        token: data.access_token,
        merchant: {
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email_address: data.email_address,
          phone_number: data.phone_number,
          joined: data.joined,
          updated: data.updated,
          last_login: data.last_login
        },
        timestamp: Date.now()
      };

      this.storeAuthData(authData);
      console.log('✅ Login successful, auth data stored');

      return data;
    } catch (error) {
      console.error('💥 Login error:', error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      console.log('🔄 Requesting password reset for:', email);
      
      const response = await fetch(`${this.baseURL}/request-password-reset`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Password reset request failed with status ${response.status}`);
      }

      console.log('✅ Password reset OTP sent');
      return data;
    } catch (error) {
      console.error('💥 Password reset request error:', error);
      throw error;
    }
  }

  // Reset password with OTP
  async resetPassword(email, otp, newPassword) {
    try {
      console.log('🔄 Resetting password for:', email);
      
      const response = await fetch(`${this.baseURL}/reset-password`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Password reset failed with status ${response.status}`);
      }

      console.log('✅ Password reset successful');
      return data;
    } catch (error) {
      console.error('💥 Password reset error:', error);
      throw error;
    }
  }

  // Get current merchant profile (recommended method)
  async getCurrentMerchantProfile() {
    try {
      console.log('📋 Fetching current merchant profile...');
      
      // Test connection in development mode
      if (import.meta.env.DEV) {
        try {
          await this.testConnection();
        } catch (testError) {
          console.warn('⚠️ API connection test failed, but continuing...', testError.message);
        }
      }

      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'GET',
        headers: this.getHeaders(true), // Include both API key and auth token
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Profile fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });

        // Handle specific error codes
        this.handleApiError(response, data);
        return null;
      }

      console.log('✅ Current merchant profile fetched successfully');
      return data;
    } catch (error) {
      console.error('💥 Profile fetch error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Get merchant profile by ID (for backward compatibility)
  async getMerchantProfile(merchantId = null) {
    try {
      console.log('📋 Fetching merchant profile...', merchantId ? `ID: ${merchantId}` : 'Current');
      
      const endpoint = merchantId ? `${this.baseURL}/${merchantId}` : `${this.baseURL}/profile`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Profile fetch failed:', {
          status: response.status,
          error: data
        });

        this.handleApiError(response, data);
        return null;
      }

      console.log('✅ Merchant profile fetched successfully');
      return data;
    } catch (error) {
      console.error('💥 Profile fetch error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Update merchant profile
  async updateMerchantProfile(merchantId, profileData) {
    try {
      console.log('🔄 Updating merchant profile...', merchantId);
      console.log('📝 Update data:', profileData);
      
      const response = await fetch(`${this.baseURL}/${merchantId}`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Profile update failed:', {
          status: response.status,
          error: data
        });

        this.handleApiError(response, data);
        return null;
      }

      // Update stored merchant data if successful
      if (data.merchant || data.data) {
        this.updateStoredMerchantProfile(data.merchant || data.data);
        console.log('✅ Local profile data updated');
      }

      console.log('✅ Profile updated successfully');
      return data;
    } catch (error) {
      console.error('💥 Profile update error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const merchantId = this.getMerchantId();
      if (!merchantId) {
        throw new Error('No merchant ID found. Please log in again.');
      }

      console.log('🔄 Changing password...');
      
      const response = await fetch(`${this.baseURL}/${merchantId}/change-password`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.handleApiError(response, data);
        throw new Error(data.message || 'Password change failed');
      }

      console.log('✅ Password changed successfully');
      return data;
    } catch (error) {
      console.error('💥 Password change error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      console.log('🔄 Refreshing authentication token...');
      
      const response = await fetch(`${this.baseURL}/refresh-token`, {
        method: 'POST',
        headers: this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Token refresh failed');
        this.logout();
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update stored auth data with new token
      const authData = this.getAuthData();
      if (authData) {
        authData.token = data.access_token;
        authData.timestamp = Date.now();
        this.storeAuthData(authData);
        console.log('✅ Token refreshed and stored');
      }

      return data;
    } catch (error) {
      console.error('💥 Token refresh error:', error);
      this.logout();
      throw error;
    }
  }

  // Store authentication data securely
  storeAuthData(authData) {
    try {
      if (!SECRET_KEY) {
        throw new Error('SECRET_KEY not configured');
      }

      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(authData),
        SECRET_KEY
      ).toString();
      
      Cookies.set('merchant_auth', encryptedData, { 
        expires: 7, // 7 days
        secure: import.meta.env.PROD, // Only secure in production
        sameSite: 'strict',
        path: '/'
      });

      console.log('✅ Auth data stored securely');
    } catch (error) {
      console.error('💥 Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  // Get stored authentication data
  getAuthData() {
    try {
      const encryptedData = Cookies.get('merchant_auth');
      if (!encryptedData) {
        console.log('📭 No auth data found in cookies');
        return null;
      }

      if (!SECRET_KEY) {
        console.error('❌ SECRET_KEY not configured for decryption');
        return null;
      }

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) {
        console.error('❌ Failed to decrypt auth data');
        this.logout();
        return null;
      }

      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('💥 Error retrieving auth data:', error);
      this.logout(); // Clear invalid data
      return null;
    }
  }

  // Check if merchant is authenticated
  isAuthenticated() {
    try {
      const authData = this.getAuthData();
      const hasValidData = authData && authData.token && authData.merchant;
      
      if (!hasValidData) {
        console.log('❌ No valid auth data found');
        return false;
      }

      const isExpired = this.isTokenExpired();
      if (isExpired) {
        console.log('❌ Token is expired');
        this.logout();
        return false;
      }

      console.log('✅ User is authenticated');
      return true;
    } catch (error) {
      console.error('💥 Error checking authentication:', error);
      return false;
    }
  }

  // Get current merchant data
  getCurrentMerchant() {
    const authData = this.getAuthData();
    return authData?.merchant || null;
  }

  // Get authentication token
  getToken() {
    const authData = this.getAuthData();
    return authData?.token || null;
  }

  // Get merchant ID
  getMerchantId() {
    const merchant = this.getCurrentMerchant();
    return merchant?.id || null;
  }

  // Check if token is expired
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode JWT payload (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      
      if (isExpired) {
        console.log('⏰ Token has expired');
      }
      
      return isExpired;
    } catch (error) {
      console.error('💥 Error checking token expiration:', error);
      return true;
    }
  }

  // Update merchant profile in storage
  updateStoredMerchantProfile(updatedMerchant) {
    try {
      const authData = this.getAuthData();
      if (authData && authData.merchant) {
        authData.merchant = { ...authData.merchant, ...updatedMerchant };
        authData.timestamp = Date.now();
        this.storeAuthData(authData);
        console.log('✅ Stored merchant profile updated');
      }
    } catch (error) {
      console.error('💥 Error updating stored profile:', error);
    }
  }

  // Handle API errors
  handleApiError(response, data) {
    const status = response.status;
    const errorCode = data.code;
    const message = data.message;

    console.error(`❌ API Error [${status}]:`, { code: errorCode, message });

    // Handle authentication errors
    if (status === 401) {
      const authErrorCodes = [
        'TOKEN_EXPIRED', 'INVALID_TOKEN', 'MISSING_TOKEN', 
        'TOKEN_VERIFICATION_FAILED', 'MERCHANT_NOT_FOUND', 
        'PASSWORD_CHANGED'
      ];

      if (authErrorCodes.includes(errorCode)) {
        console.log('🚪 Authentication error, logging out...');
        this.logout();
        throw new Error('Your session has expired. Please log in again.');
      }

      if (errorCode === 'MISSING_API_KEY' || errorCode === 'INVALID_API_KEY') {
        throw new Error('API configuration error. Please check your API key configuration.');
      }
    }

    // Handle authorization errors
    if (status === 403) {
      if (errorCode === 'ADMIN_ACCESS_REQUIRED') {
        throw new Error('Admin access required for this operation.');
      }
      if (errorCode === 'INVALID_TOKEN_TYPE') {
        this.logout();
        throw new Error('Invalid access credentials. Please log in again.');
      }
    }

    // Handle rate limiting
    if (status === 429) {
      const retryAfter = data.retryAfter || 15;
      throw new Error(`Too many requests. Please try again in ${retryAfter} minutes.`);
    }

    // Generic error handling
    throw new Error(message || `Request failed with status ${status}`);
  }

  // Handle authentication errors
  handleAuthError(error) {
    console.error('🚨 Authentication error handler:', error);
    
    const authErrorIndicators = [
      'session has expired', 'log in again', 'Authentication', 
      'API configuration', '401', '403', 'Unauthorized', 
      'Invalid token', 'TOKEN_', 'API_KEY'
    ];
    
    const isAuthError = authErrorIndicators.some(indicator => 
      error.message?.includes(indicator)
    );

    if (isAuthError) {
      console.log('🚪 Auth error detected, logging out...');
      // Don't call logout immediately to avoid infinite loops
      setTimeout(() => this.logout(), 100);
    }
  }

  // Logout merchant
  logout() {
    try {
      console.log('🚪 Logging out merchant...');
      
      // Clear stored auth data
      Cookies.remove('merchant_auth', { path: '/' });
      
      // Clear any other related data
      localStorage.removeItem('merchant_temp_data');
      sessionStorage.clear();
      
      console.log('✅ Logout completed');
      
      // Redirect to login page
      window.location.href = '/accounts/sign-in';
    } catch (error) {
      console.error('💥 Error during logout:', error);
      // Force redirect even if cleanup fails
      window.location.href = '/accounts/sign-in';
    }
  }

  // Initialize service on first use
  initialize() {
    if (!this.isInitialized) {
      this.init();
    }
    return this.isInitialized;
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: this.isAuthenticated(),
      hasApiKey: !!API_KEY,
      hasSecretKey: !!SECRET_KEY,
      baseURL: this.baseURL,
      currentMerchant: this.getCurrentMerchant()
    };
  }

  // Debug method for development
  debug() {
    if (import.meta.env.DEV) {
      console.group('🔍 MerchantAuthService Debug Info');
      console.log('Status:', this.getStatus());
      console.log('Auth Data:', this.getAuthData());
      console.log('Token Expired:', this.isTokenExpired());
      console.groupEnd();
    }
  }
}

// Create and export singleton instance
const merchantAuthService = new MerchantAuthService();

// Initialize on import
merchantAuthService.initialize();

export default merchantAuthService;