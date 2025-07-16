// services/chatService.js
class ChatService {
  constructor() {
    // Use window.location for dynamic API URLs in browser
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = process.env.NODE_ENV === 'production' ? '' : ':4000';
    
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

    return getTokenFromCookie() || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('access_token');
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

  // Get conversations for current user
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

  // Get messages for a conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      {
        headers: this.getHeaders(),
        credentials: 'include'
      }
    );

    return this.handleResponse(response);
  }

  // Send a message
  async sendMessage(conversationId, content, messageType = 'text') {
    const response = await fetch(`${this.API_BASE}/chat/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        conversationId,
        content,
        messageType
      })
    });

    return this.handleResponse(response);
  }

  // Start a new conversation (customer to store)
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
  async markMessagesAsRead(conversationId) {
    const response = await fetch(
      `${this.API_BASE}/chat/conversations/${conversationId}/read`,
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

  // Search conversations
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

  // Get conversation analytics (for merchants)
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
}

export default new ChatService();