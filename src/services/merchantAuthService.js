// services/merchantAuthService.js - Fixed Version with Better Authentication Flow
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
const API_KEY = import.meta.env.VITE_API_KEY;

class MerchantAuthService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/merchants`;
    this.storeURL = `${API_BASE_URL}/stores`;
    this.isInitialized = false;
    this.authCheckInProgress = false;
    this.init();
  }

  // Initialize the service
  init() {
    try {
      console.log('🔧 Initializing MerchantAuthService...');
      console.log('📍 API Base URL:', this.baseURL);
      console.log('🏪 Store API URL:', this.storeURL);
      console.log('🔑 API Key configured:', API_KEY ? 'Yes' : 'No');
      console.log('🔐 Secret Key configured:', SECRET_KEY ? 'Yes' : 'No');

      // Don't check authentication during initialization - let components handle it
      console.log('✅ Service initialized - authentication check deferred to components');
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
      headers['x-api-key'] = API_KEY;
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

  // Store authentication data securely
  storeAuthData(authData) {
    try {
      if (!SECRET_KEY) {
        console.warn('⚠️ SECRET_KEY not configured, storing auth data without encryption');
        // Fallback to unencrypted storage in development
        const fallbackData = {
          ...authData,
          unencrypted: true,
          timestamp: Date.now()
        };
        Cookies.set('merchant_auth_fallback', JSON.stringify(fallbackData), {
          expires: 7,
          secure: import.meta.env.PROD,
          sameSite: 'strict',
          path: '/'
        });
        return;
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

      // Clear fallback cookie if it exists
      Cookies.remove('merchant_auth_fallback', { path: '/' });
      console.log('✅ Auth data stored securely');
    } catch (error) {
      console.error('💥 Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  // Get stored authentication data
  getAuthData() {
    try {
      // Try encrypted data first
      const encryptedData = Cookies.get('merchant_auth');
      if (encryptedData && SECRET_KEY) {
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
          const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);

          if (decryptedData) {
            return JSON.parse(decryptedData);
          }
        } catch (decryptError) {
          console.warn('⚠️ Failed to decrypt auth data, trying fallback...', decryptError.message);
        }
      }

      // Try fallback unencrypted data
      const fallbackData = Cookies.get('merchant_auth_fallback');
      if (fallbackData) {
        console.log('📭 Using fallback auth data');
        return JSON.parse(fallbackData);
      }

      console.log('📭 No auth data found in cookies');
      return null;
    } catch (error) {
      console.error('💥 Error retrieving auth data:', error);
      // Don't automatically logout on retrieval errors
      return null;
    }
  }

  // Check if merchant is authenticated (non-destructive)
  isAuthenticated() {
    try {
      if (this.authCheckInProgress) {
        console.log('🔄 Authentication check already in progress');
        return false;
      }

      const authData = this.getAuthData();
      const hasValidData = authData && authData.token && authData.merchant;

      if (!hasValidData) {
        console.log('❌ No valid auth data found');
        return false;
      }

      // Check token expiration without automatic logout
      const isExpired = this.isTokenExpired();
      if (isExpired) {
        console.log('❌ Token is expired');
        return false;
      }

      console.log('✅ User is authenticated');
      return true;
    } catch (error) {
      console.error('💥 Error checking authentication:', error);
      return false;
    }
  }

  // Safe authentication check that doesn't trigger logout
  checkAuthenticationStatus() {
    const isAuth = this.isAuthenticated();
    const authData = this.getAuthData();

    return {
      isAuthenticated: isAuth,
      hasAuthData: !!authData,
      hasToken: !!(authData?.token),
      hasMerchant: !!(authData?.merchant),
      isTokenExpired: authData?.token ? this.isTokenExpired() : true,
      merchant: authData?.merchant || null
    };
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

  // Login merchant
  async login(credentials) {
    try {
      console.log('🔑 Logging in merchant...');
      console.log('📧 Login email:', credentials.email);

      this.authCheckInProgress = true;

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
    } finally {
      this.authCheckInProgress = false;
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

  // Get current merchant profile
  async getCurrentMerchantProfile() {
    try {
      console.log('📋 Fetching current merchant profile...');

      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Profile fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });

        this.handleApiError(response, data);
        return null;
      }

      console.log('✅ Current merchant profile fetched successfully');
      return data;
    } catch (error) {
      console.error('💥 Profile fetch error:', error);
      throw error;
    }
  }

  // Update merchant profile
  async updateMerchantProfile(merchantId = null, profileData = null) {
    try {
      let updateData, targetMerchantId;

      if (merchantId && typeof merchantId === 'object' && profileData === null) {
        updateData = merchantId;
        targetMerchantId = this.getMerchantId();
      } else {
        updateData = profileData || merchantId;
        targetMerchantId = (typeof merchantId === 'string' || typeof merchantId === 'number') ? merchantId : this.getMerchantId();
      }

      if (!targetMerchantId) {
        throw new Error('No merchant ID available. Please log in again.');
      }

      console.log('🔄 Updating merchant profile...', targetMerchantId);

      const response = await fetch(`${this.storeURL}/merchant/profile`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        this.handleApiError(response, data);
        throw new Error(data.message || `Failed to update profile: ${response.status}`);
      }

      if (data.merchantProfile) {
        this.updateStoredMerchantProfile(data.merchantProfile);
      }

      console.log('✅ Profile updated successfully');
      return data;
    } catch (error) {
      console.error('💥 Profile update error:', error);
      throw error;
    }
  }

  // Get store details
  async getStoreDetails(storeId) {
    try {
      console.log('📋 Fetching store details:', storeId);

      const response = await fetch(`${this.storeURL}/profile/${storeId}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch store details: ${response.status}`);
      }

      console.log('✅ Store details fetched successfully');
      return data;
    } catch (error) {
      console.error('💥 Error fetching store details:', error);
      throw error;
    }
  }

  // Handle API errors (less aggressive)
  handleApiError(response, data) {
    const status = response.status;
    const errorCode = data.code;
    const message = data.message;

    console.error(`❌ API Error [${status}]:`, { code: errorCode, message });

    // Only trigger logout for specific auth errors, not all 401s
    if (status === 401) {
      const criticalAuthErrors = [
        'TOKEN_EXPIRED', 'INVALID_TOKEN', 'MERCHANT_NOT_FOUND',
        'PASSWORD_CHANGED'
      ];

      if (criticalAuthErrors.includes(errorCode)) {
        console.log('🚪 Critical authentication error detected');
        // Set a flag instead of immediate logout
        this._shouldLogout = true;
        throw new Error('Your session has expired. Please log in again.');
      }
    }

    throw new Error(message || `Request failed with status ${status}`);
  }

  // Check if logout is needed (non-destructive)
  shouldLogout() {
    return this._shouldLogout === true;
  }

  // Clear logout flag
  clearLogoutFlag() {
    this._shouldLogout = false;
  }

  // Logout merchant (only when explicitly called)
  logout() {
    try {
      console.log('🚪 Logging out merchant...');

      // Clear stored auth data
      Cookies.remove('merchant_auth', { path: '/' });
      Cookies.remove('merchant_auth_fallback', { path: '/' });

      // Clear any other related data
      localStorage.removeItem('merchant_temp_data');
      sessionStorage.clear();

      // Clear logout flag
      this._shouldLogout = false;

      console.log('✅ Logout completed');

      // Redirect to login page
      window.location.href = '/accounts/sign-in';
    } catch (error) {
      console.error('💥 Error during logout:', error);
      window.location.href = '/accounts/sign-in';
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

  // Get service status
  getStatus() {
    const authStatus = this.checkAuthenticationStatus();
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: authStatus.isAuthenticated,
      hasApiKey: !!API_KEY,
      hasSecretKey: !!SECRET_KEY,
      baseURL: this.baseURL,
      storeURL: this.storeURL,
      authStatus,
      shouldLogout: this.shouldLogout()
    };
  }

  // Debug method for development
  debug() {
    if (import.meta.env.DEV) {
      console.group('🔍 MerchantAuthService Debug Info');
      console.log('Status:', this.getStatus());
      console.log('Auth Data:', this.getAuthData());
      console.groupEnd();
    }
  }
}

// Create and export singleton instance
const merchantAuthService = new MerchantAuthService();

export default merchantAuthService;