// services/merchantChatService.js - Merchant-specific chat service
class MerchantChatService {
  constructor() {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    this.API_BASE = process.env.NODE_ENV === 'production' 
      ? `${protocol}//${hostname}/api/v1`
      : 'http://localhost:4000/api/v1';
      
    this.SOCKET_URL = process.env.NODE_ENV === 'production'
      ? `${protocol}//${hostname}`
      : 'http://localhost:4000';

    // Cache for merchant data
    this.merchantCache = {
      stores: null,
      profile: null,
      analytics: null
    };
  }

  // Enhanced token retrieval (same as main chat service)
  getAuthToken() {
    const getTokenFromCookie = () => {
      if (typeof document === 'undefined') return '';
      
      const name = 'authToken=';
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
      return '';
    };

    const tokenSources = {
      localStorage_access_token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : '',
      localStorage_authToken: typeof window !== 'undefined' ? localStorage.getItem('authToken') : '',
      localStorage_token: typeof window !== 'undefined' ? localStorage.getItem('token') : '',
      cookie_authToken: getTokenFromCookie(),
      cookie_access_token: this.getCookieValue('access_token'),
      cookie_token: this.getCookieValue('token')
    };

    const token = tokenSources.localStorage_access_token || 
                  tokenSources.localStorage_authToken || 
                  tokenSources.localStorage_token ||
                  tokenSources.cookie_authToken ||
                  tokenSources.cookie_access_token ||
                  tokenSources.cookie_token;

    console.log('🏪 MerchantChatService token check:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');
    return token;
  }

  getCookieValue(name) {
    if (typeof document === 'undefined') return '';
    
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return decodeURIComponent(value || '');
      }
    } catch (error) {
      console.error('Error reading cookie:', error);
    }
    return '';
  }


  
  // Merchant-specific headers
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-User-Type': 'merchant' // Explicit merchant identifier
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🏪 Merchant API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // 🏪 MERCHANT-SPECIFIC METHODS

  // Get merchant profile with enhanced caching
  async getMerchantProfile() {
    if (this.merchantCache.profile) {
      console.log('📋 Using cached merchant profile');
      return this.merchantCache.profile;
    }

    const endpoints = [
      `${this.API_BASE}/merchants/profile`,
      `${this.API_BASE}/users/profile`,
      `${this.API_BASE}/auth/profile`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Fetching merchant profile from: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: this.getHeaders(),
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await this.handleResponse(response);
          // Cache the result
          this.merchantCache.profile = result;
          console.log('✅ Merchant profile fetched and cached');
          return result;
        }
      } catch (error) {
        console.log(`❌ Failed to fetch merchant from ${endpoint}:`, error.message);
        continue;
      }
    }
    
    throw new Error('Unable to fetch merchant profile from any endpoint');
  }

  

  // Get merchant's customer conversations (main method)
  async getCustomerConversations() {
    const endpoint = `${this.API_BASE}/chat/merchant/conversations`;
    
    console.log('🏪 Fetching merchant customer conversations from:', endpoint);

    try {
      const response = await fetch(endpoint, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      const result = await this.handleResponse(response);
      console.log(`✅ Loaded ${result.data?.length || 0} customer conversations`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching merchant conversations:', error);
      throw error;
    }
  }

  // Get conversation details with customer info
  async getConversationDetails(conversationId) {
    const endpoint = `${this.API_BASE}/chat/conversations/${conversationId}`;
    
    console.log('🔍 Fetching conversation details:', conversationId);

    try {
      const response = await fetch(endpoint, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      throw error;
    }
  }

  // Get messages for a customer conversation
  async getCustomerMessages(conversationId, page = 1, limit = 50) {
    const endpoint = `${this.API_BASE}/chat/conversations/${conversationId}/messages`;
    const url = `${endpoint}?page=${page}&limit=${limit}`;
    
    console.log('🏪 Fetching customer messages from:', url);

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      const result = await this.handleResponse(response);
      console.log(`✅ Loaded ${result.data?.length || 0} messages from customer`);
      return result;
    } catch (error) {
      console.error('Error fetching customer messages:', error);
      throw error;
    }
  }

  // Send message to customer (merchant reply)
  async replyToCustomer(conversationId, content, messageType = 'text') {
    const endpoint = `${this.API_BASE}/chat/messages`;
    
    // Validate content
    const validation = this.validateMessage(content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const body = {
      conversationId,
      content: content.trim(),
      messageType
    };

    console.log('🏪 Sending merchant reply:', { conversationId, contentLength: content.length });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const result = await this.handleResponse(response);
      console.log('✅ Merchant reply sent successfully');
      return result;
    } catch (error) {
      console.error('❌ Error sending merchant reply:', error);
      throw error;
    }
  }

  // Send quick response templates
  async sendQuickResponse(conversationId, responseTemplate) {
    const quickResponses = {
      'greeting': "Thank you for your message! I'll help you right away.",
      'processing': "Your order is being processed and will be ready soon.",
      'in_stock': "We have that item in stock. Would you like me to reserve it for you?",
      'checking': "I'll check on that for you and get back to you shortly.",
      'anything_else': "Is there anything else I can help you with today?",
      'store_hours': "Our store hours are Monday to Friday, 9 AM to 6 PM.",
      'tracking': "You can track your order using the link I'll send you.",
      'free_delivery': "We offer free delivery for orders over KES 2,000.",
      'custom': responseTemplate // Allow custom responses
    };

    const content = quickResponses[responseTemplate] || responseTemplate;
    return this.replyToCustomer(conversationId, content);
  }

  // Mark customer messages as read
  async markCustomerMessagesAsRead(conversationId) {
    const endpoint = `${this.API_BASE}/chat/conversations/${conversationId}/read`;
    
    console.log('🏪 Marking customer messages as read:', conversationId);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (response.status === 404) {
        console.log('⚠️ Read endpoint not implemented, skipping');
        return { success: true, message: 'Read status updated via other means' };
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error marking customer messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Search customer conversations
  async searchCustomers(query) {
    const endpoint = `${this.API_BASE}/chat/search`;
    const url = `${endpoint}?query=${encodeURIComponent(query)}&type=customers`;
    
    console.log('🏪 Searching customers:', url);

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Get merchant analytics
  async getMerchantAnalytics(period = '7d', useCache = true) {
    // Use cache if available and not expired (5 minutes)
    if (useCache && this.merchantCache.analytics) {
      const cacheAge = Date.now() - this.merchantCache.analytics.timestamp;
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        console.log('📊 Using cached merchant analytics');
        return this.merchantCache.analytics.data;
      }
    }

    const endpoint = `${this.API_BASE}/chat/analytics`;
    const url = `${endpoint}?period=${period}`;
    
    console.log('🏪 Fetching merchant analytics:', url);

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      const result = await this.handleResponse(response);
      
      // Cache the result
      this.merchantCache.analytics = {
        data: result,
        timestamp: Date.now()
      };
      
      console.log('✅ Merchant analytics fetched and cached');
      return result;
    } catch (error) {
      console.error('Error fetching merchant analytics:', error);
      throw error;
    }
  }

  // Get merchant stores
  async getMerchantStores() {
    if (this.merchantCache.stores) {
      console.log('🏬 Using cached merchant stores');
      return this.merchantCache.stores;
    }

    const endpoint = `${this.API_BASE}/merchants/stores`;
    
    console.log('🏪 Fetching merchant stores from:', endpoint);

    try {
      const response = await fetch(endpoint, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      const result = await this.handleResponse(response);
      // Cache the result
      this.merchantCache.stores = result;
      console.log(`✅ Loaded ${result.data?.length || 0} merchant stores`);
      return result;
    } catch (error) {
      console.error('Error fetching merchant stores:', error);
      throw error;
    }
  }

  // Update merchant chat settings
  async updateChatSettings(settings) {
    const endpoint = `${this.API_BASE}/merchants/chat-settings`;
    
    console.log('🏪 Updating merchant chat settings:', settings);

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating chat settings:', error);
      throw error;
    }
  }

  // Get unread messages count
  async getUnreadMessagesCount() {
    try {
      const conversations = await this.getCustomerConversations();
      if (conversations.success && conversations.data) {
        return conversations.data.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
      }
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Set customer priority (VIP, regular, etc.)
  async setCustomerPriority(customerId, priority = 'regular') {
    const endpoint = `${this.API_BASE}/merchants/customers/${customerId}/priority`;
    
    console.log('⭐ Setting customer priority:', { customerId, priority });

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ priority })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error setting customer priority:', error);
      throw error;
    }
  }

  // Archive conversation
  async archiveConversation(conversationId) {
    const endpoint = `${this.API_BASE}/chat/conversations/${conversationId}/archive`;
    
    console.log('📁 Archiving conversation:', conversationId);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  // Block customer
  async blockCustomer(conversationId, reason = '') {
    const endpoint = `${this.API_BASE}/chat/conversations/${conversationId}/block`;
    
    console.log('🚫 Blocking customer:', { conversationId, reason });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error blocking customer:', error);
      throw error;
    }
  }

  // Export conversation history
  async exportConversationHistory(conversationId, format = 'json') {
    const endpoint = `${this.API_BASE}/chat/conversations/${conversationId}/export`;
    const url = `${endpoint}?format=${format}`;
    
    console.log('📥 Exporting conversation history:', url);

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      if (format === 'json') {
        return this.handleResponse(response);
      } else {
        // For CSV/PDF, return blob
        return response.blob();
      }
    } catch (error) {
      console.error('Error exporting conversation:', error);
      throw error;
    }
  }

  // Get customer insights
  async getCustomerInsights(customerId) {
    const endpoint = `${this.API_BASE}/merchants/customers/${customerId}/insights`;
    
    console.log('💡 Fetching customer insights:', customerId);

    try {
      const response = await fetch(endpoint, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching customer insights:', error);
      throw error;
    }
  }

  // Send typing indicator
  async sendTypingIndicator(conversationId, action = 'start') {
    const endpoint = `${this.API_BASE}/chat/conversations/${conversationId}/typing`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action, userType: 'merchant' })
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      return { success: false };
    }
  }

  // 🛠️ UTILITY METHODS

  // Validate message content
  validateMessage(content) {
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Message content is required' };
    }

    if (content.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    if (content.length > 2000) {
      return { valid: false, error: 'Message too long (max 2000 characters)' };
    }

    // Check for inappropriate content (basic)
    const inappropriateWords = ['spam', 'scam']; // Add more as needed
    const lowerContent = content.toLowerCase();
    for (const word of inappropriateWords) {
      if (lowerContent.includes(word)) {
        return { valid: false, error: 'Message contains inappropriate content' };
      }
    }

    return { valid: true };
  }

  // Format time (same as controller)
  formatTime(timestamp) {
    try {
      const now = new Date();
      const messageTime = new Date(timestamp);
      const diffInHours = (now - messageTime) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
        return diffInMinutes <= 0 ? 'now' : `${diffInMinutes} min ago`;
      } else if (diffInHours < 24) {
        return messageTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
      } else {
        return messageTime.toLocaleDateString('en-US');
      }
    } catch (error) {
      return 'unknown time';
    }
  }

  // Get customer avatar
  getCustomerAvatar(customer, size = 40) {
    if (customer?.avatar) {
      return customer.avatar;
    }
    
    const name = customer?.name || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Customer';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=random`;
  }

  // Get socket URL
  getSocketUrl() {
    return this.SOCKET_URL;
  }

  // Clear cache
  clearCache() {
    this.merchantCache = {
      stores: null,
      profile: null,
      analytics: null
    };
    console.log('🗑️ Merchant cache cleared');
  }

  // Check if merchant is authenticated
  async checkMerchantAuth() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { isAuthenticated: false, merchant: null };
      }

      const merchantResponse = await this.getMerchantProfile();
      return { 
        isAuthenticated: true, 
        merchant: merchantResponse.user || merchantResponse.data || merchantResponse
      };
    } catch (error) {
      console.error('Merchant auth check failed:', error);
      return { isAuthenticated: false, merchant: null };
    }
  }

  // Get merchant dashboard stats
  async getDashboardStats() {
    try {
      const [analytics, unreadCount] = await Promise.all([
        this.getMerchantAnalytics(),
        this.getUnreadMessagesCount()
      ]);

      return {
        unreadMessages: unreadCount,
        totalChats: analytics.data?.totalChats || 0,
        totalMessages: analytics.data?.totalMessages || 0,
        averageResponseTime: analytics.data?.averageResponseTime || 0,
        customerSatisfaction: analytics.data?.customerSatisfaction || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        unreadMessages: 0,
        totalChats: 0,
        totalMessages: 0,
        averageResponseTime: 0,
        customerSatisfaction: 0
      };
    }
  }
}

// Create and export instance
const merchantChatService = new MerchantChatService();
export default merchantChatService;