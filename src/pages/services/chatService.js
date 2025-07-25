// services/chatService.js
class ChatService {
  constructor() {
    // Use window.location for dynamic API URLs in browser
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    // For development, you can also hardcode these or use different logic
    this.API_BASE = process.env.NODE_ENV === 'production' 
      ? `${protocol}//${hostname}/api/v1`
      : 'http://localhost:4000/api/v1';
      
    this.SOCKET_URL = process.env.NODE_ENV === 'production'
      ? `${protocol}//${hostname}`
      : 'http://localhost:4000';
  }

  // Get auth token from cookies (matching your authService pattern)
  getAuthToken() {
    // Function to get token from cookies - matching your authService
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

    // Enhanced token retrieval - check all possible locations
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

    console.log('🔍 ChatService token check:', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');
    console.log('📍 Token sources:', Object.keys(tokenSources).filter(key => tokenSources[key]));

    return token;
  }

  // Helper method to get cookie value
  getCookieValue(name) {
    if (typeof document === 'undefined') return '';
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return decodeURIComponent(value);
    }
    return '';
  }

  // API headers with authentication
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get current user profile  
  async getCurrentUser() {
    const endpoints = [
      `${this.API_BASE}/users/profile`,
      `${this.API_BASE}/users/me`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: this.getHeaders(),
          credentials: 'include' // Important for cookie-based auth
        });
        
        if (response.ok) {
          return this.handleResponse(response);
        }
      } catch (error) {
        console.log(`Failed to fetch from ${endpoint}:`, error.message);
        continue;
      }
    }
    
    // If all endpoints fail, throw error
    throw new Error('Unable to fetch user profile from any endpoint');
  }

  // Get chats for current user
  async getConversations(userRole = 'customer') {
    const endpoint = userRole === 'merchant' 
      ? `${this.API_BASE}/chat/merchant/conversations`
      : `${this.API_BASE}/chat/conversations`;

    const response = await fetch(endpoint, {
      headers: this.getHeaders(),
      credentials: 'include'
    });

    return this.handleResponse(response);
  }

  // Get messages for a chat
  async getMessages(chatId, page = 1, limit = 50) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${chatId}/messages?page=${page}&limit=${limit}`,
      {
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Send a message
  async sendMessage(chatId, content, messageType = 'text') {
    const response = await fetch(`${this.API_BASE}/chat/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        conversationId: chatId, // Keep this name for backward compatibility
        content,
        messageType
      })
    });

    return this.handleResponse(response);
  }

  // Start a new chat (customer to store)
  async startConversation(storeId, initialMessage = '') {
    const response = await fetch(`${this.API_BASE}/chat/conversations`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        storeId,
        initialMessage
      })
    });

    return this.handleResponse(response);
  }

  // Mark messages as read
  async markMessagesAsRead(chatId) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${chatId}/read`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Update message status
  async updateMessageStatus(messageId, status) {
    const response = await fetch(
      `${this.API_BASE}/chat/messages/${messageId}/status`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status })
      }
    );

    return this.handleResponse(response);
  }

  // Search chats
  async searchConversations(query, type = 'all') {
    const response = await fetch(
      `${this.API_BASE}/chat/search?query=${encodeURIComponent(query)}&type=${type}`,
      {
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Get chat analytics (for merchants)
  async getConversationAnalytics(period = '7d') {
    const response = await fetch(
      `${this.API_BASE}/chat/analytics?period=${period}`,
      {
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Get chat participants
  async getChatParticipants(chatId) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${chatId}/participants`,
      {
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Update chat settings (merchants only)
  async updateChatSettings(chatId, settings) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${chatId}/settings`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings)
      }
    );

    return this.handleResponse(response);
  }

  // Archive chat
  async archiveChat(chatId) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${chatId}/archive`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Block chat
  async blockChat(chatId) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${chatId}/block`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Get message history with pagination
  async getMessageHistory(chatId, page = 1, limit = 50, before = null) {
    let url = `${this.API_BASE}/chat/conversations/${chatId}/messages/history?page=${page}&limit=${limit}`;
    if (before) {
      url += `&before=${encodeURIComponent(before)}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: 'include'
    });

    return this.handleResponse(response);
  }

  // Get online status of users
  async getOnlineStatus(userIds) {
    const response = await fetch(
      `${this.API_BASE}/chat/users/online?userIds=${userIds.join(',')}`,
      {
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Send typing indicator
  async sendTyping(chatId, action = 'start') {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${chatId}/typing`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action })
      }
    );

    return this.handleResponse(response);
  }

  // Check authentication status
  async checkAuth() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { isAuthenticated: false, user: null };
      }

      const userResponse = await this.getCurrentUser();
      return { 
        isAuthenticated: true, 
        user: userResponse.user || userResponse 
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { isAuthenticated: false, user: null };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.API_BASE}/chat/health`, {
        headers: this.getHeaders(),
        credentials: 'include'
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility methods
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

  // Validate chat content
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

    return { valid: true };
  }

  // Get chat status display
  getChatStatusDisplay(status) {
    const statusMap = {
      'active': 'Active',
      'archived': 'Archived',
      'blocked': 'Blocked'
    };
    return statusMap[status] || 'Unknown';
  }

  // Get message status display
  getMessageStatusDisplay(status) {
    const statusMap = {
      'sent': 'Sent',
      'delivered': 'Delivered',
      'read': 'Read'
    };
    return statusMap[status] || 'Unknown';
  }

  // Clean up old data (for maintenance)
  async cleanupOldMessages(daysOld = 90) {
    try {
      const response = await fetch(
        `${this.API_BASE}/chat/cleanup?daysOld=${daysOld}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          credentials: 'include'
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      console.error('Cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export instance
const chatService = new ChatService();
export default chatService;