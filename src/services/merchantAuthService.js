// services/merchantAuthService.js - Updated with API key support
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
const API_KEY = import.meta.env.VITE_API_KEY;

class MerchantAuthService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/merchants`;
  }

  // Get headers with API key
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Always include API key
    if (API_KEY) {
      headers['api-key'] = API_KEY;
      console.log('✅ API key added to request');
    } else {
      console.warn('⚠️ VITE_API_KEY not found in environment variables');
    }

    // Include auth token if requested
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Auth token added to request');
      }
    }

    return headers;
  }

  // Register new merchant
  async register(merchantData) {
    try {
      console.log('🔑 Registering merchant with API key...');
      
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: this.getHeaders(), // Now includes API key
        body: JSON.stringify(merchantData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login merchant
  async login(credentials) {
    try {
      console.log('🔑 Logging in merchant with API key...');
      
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: this.getHeaders(), // Now includes API key
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      console.log('🔑 Requesting password reset with API key...');
      
      const response = await fetch(`${this.baseURL}/request-password-reset`, {
        method: 'POST',
        headers: this.getHeaders(), // Now includes API key
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  // Reset password with OTP
  async resetPassword(email, otp, newPassword) {
    try {
      console.log('🔑 Resetting password with API key...');
      
      const response = await fetch(`${this.baseURL}/reset-password`, {
        method: 'POST',
        headers: this.getHeaders(), // Now includes API key
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Get merchant profile
  async getMerchantProfile(merchantId, token) {
    try {
      console.log('🔑 Fetching merchant profile with API key...');
      
      const response = await fetch(`${this.baseURL}/${merchantId}`, {
        method: 'GET',
        headers: this.getHeaders(true), // Includes both API key and auth token
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  // Update merchant profile
  async updateMerchantProfile(merchantId, profileData) {
    try {
      console.log('🔑 Updating merchant profile with API key...');
      
      const response = await fetch(`${this.baseURL}/${merchantId}`, {
        method: 'PUT',
        headers: this.getHeaders(true), // Includes both API key and auth token
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update stored merchant data
      this.updateStoredMerchantProfile(data.merchant || data.data || profileData);

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Store auth data securely (keeping your existing method)
  storeAuthData(authData) {
    try {
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(authData),
        SECRET_KEY
      ).toString();
      
      Cookies.set('merchant_auth', encryptedData, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  // Get stored auth data (keeping your existing method)
  getAuthData() {
    try {
      const encryptedData = Cookies.get('merchant_auth');
      if (!encryptedData) return null;

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error retrieving auth data:', error);
      this.logout(); // Clear invalid data
      return null;
    }
  }

  // Check if merchant is authenticated
  isAuthenticated() {
    const authData = this.getAuthData();
    return authData && authData.token && authData.merchant;
  }

  // Get current merchant
  getCurrentMerchant() {
    const authData = this.getAuthData();
    return authData?.merchant || null;
  }

  // Get auth token
  getToken() {
    const authData = this.getAuthData();
    return authData?.token || null;
  }

  // Get merchant ID
  getMerchantId() {
    const merchant = this.getCurrentMerchant();
    return merchant?.id || null;
  }

  // Check if token is expired (basic check)
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Basic JWT payload decode (you might want to use a proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Logout
  logout() {
    console.log('🚪 Logging out merchant...');
    Cookies.remove('merchant_auth');
    // Redirect to login page
    window.location.href = '/accounts/sign-in';
  }

  // Update merchant profile in storage (keeping your existing method)
  updateStoredMerchantProfile(updatedMerchant) {
    const authData = this.getAuthData();
    if (authData) {
      authData.merchant = { ...authData.merchant, ...updatedMerchant };
      this.storeAuthData(authData);
    }
  }

  // Handle authentication errors
  handleAuthError(error) {
    console.error('Authentication error:', error);
    
    // If it's an auth error, logout the user
    if (error.message?.includes('401') || error.message?.includes('403') || 
        error.message?.includes('Unauthorized') || error.message?.includes('Invalid token')) {
      this.logout();
    }
  }

  // Refresh token (if your backend supports it)
  async refreshToken() {
    try {
      const authData = this.getAuthData();
      if (!authData?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseURL}/refresh-token`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ refreshToken: authData.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update stored auth data with new token
      authData.token = data.token;
      if (data.refreshToken) {
        authData.refreshToken = data.refreshToken;
      }
      this.storeAuthData(authData);

      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      throw error;
    }
  }

  // Initialize service
  initialize() {
    try {
      const authData = this.getAuthData();
      if (authData && this.isTokenExpired()) {
        console.log('Token expired, clearing auth data');
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error initializing merchant auth service:', error);
      this.logout();
      return false;
    }
  }
}

export default new MerchantAuthService(); 