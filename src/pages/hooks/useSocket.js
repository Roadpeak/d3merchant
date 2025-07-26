// hooks/useSocket.js - Enhanced JavaScript version
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const useSocket = (user) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [connectionError, setConnectionError] = useState(null);
  
  const eventHandlers = useRef(new Map());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const typingTimeouts = useRef(new Map());

  // Enhanced token retrieval with better error handling
  const getAuthToken = useCallback(() => {
    console.log('🔍 Getting auth token...');
    
    const getLocalStorage = (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    };

    const getCookieValue = (name) => {
      if (typeof document === 'undefined') return null;
      
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [key, value] = cookie.trim().split('=');
          if (key === name) return decodeURIComponent(value || '');
        }
      } catch (error) {
        console.error('Error reading cookie:', error);
      }
      return null;
    };

    const tokenSources = {
      localStorage_access_token: getLocalStorage('access_token'),
      localStorage_authToken: getLocalStorage('authToken'),
      localStorage_token: getLocalStorage('token'),
      cookie_authToken: getCookieValue('authToken'),
      cookie_access_token: getCookieValue('access_token'),
      cookie_token: getCookieValue('token')
    };

    console.log('🔍 Token sources found:', Object.keys(tokenSources).filter(key => tokenSources[key]));

    const token = tokenSources.localStorage_access_token ||
                  tokenSources.localStorage_authToken ||
                  tokenSources.localStorage_token ||
                  tokenSources.cookie_authToken ||
                  tokenSources.cookie_access_token ||
                  tokenSources.cookie_token;

    if (token) {
      console.log('✅ Token found:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ No token found in any source');
    }

    return token;
  }, []);

  // Validate token format with better error handling
  const validateToken = useCallback((token) => {
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('⚠️ Token does not appear to be a valid JWT format');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('🔍 Token payload preview:', {
        userId: payload.userId,
        id: payload.id,
        type: payload.type,
        userType: payload.userType,
        exp: payload.exp ? new Date(payload.exp * 1000) : 'No expiration',
        isExpired: payload.exp ? Date.now() >= payload.exp * 1000 : false
      });
      
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.error('❌ Token is expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return false;
    }
  }, []);

  // Clear invalid tokens
  const clearTokens = useCallback(() => {
    ['access_token', 'authToken', 'token'].forEach(key => {
      localStorage.removeItem(key);
    });
    
    ['authToken', 'access_token', 'token'].forEach(key => {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) {
      console.log('⚠️ No user provided to socket hook');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.log('⚠️ No auth token available for socket connection');
      setConnectionError('No authentication token available');
      return;
    }

    if (!validateToken(token)) {
      console.log('⚠️ Invalid token format or expired');
      setConnectionError('Invalid or expired authentication token');
      return;
    }

    console.log('🔌 Initializing socket connection for user:', user.id, 'role:', user.role || user.userType);

    const socketUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:4000';

    console.log('🌐 Connecting to socket server:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      query: {
        token,
        userId: user.id,
        userRole: user.role || user.userType || 'customer'
      },
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      console.log('🔗 Socket ID:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      
      newSocket.emit('user_join', {
        id: user.id,
        name: user.name,
        role: user.role || user.userType || 'customer',
        timestamp: new Date().toISOString()
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected client, attempting manual reconnect...');
        setTimeout(() => {
          if (!newSocket.connected) {
            newSocket.connect();
          }
        }, 1000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionError(error.message);
      reconnectAttempts.current++;
      
      if (error.message.includes('Authentication error')) {
        console.error('🔐 Authentication failed - token may be invalid or expired');
        clearTokens();
        setConnectionError('Authentication failed - please log in again');
        
        setTimeout(() => {
          window.location.href = '/accounts/sign-in';
        }, 2000);
        
        return;
      }
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        setConnectionError('Failed to connect after multiple attempts');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      setConnectionError('Reconnection failed');
    });

    // User status events
    newSocket.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Enhanced message events
    newSocket.on('new_message', (messageData) => {
      console.log('📨 Received new_message:', messageData);
      if (eventHandlers.current.has('new_message')) {
        eventHandlers.current.get('new_message')(messageData);
      }
    });

    // Customer-specific events
    newSocket.on('new_merchant_message', (messageData) => {
      console.log('📨 Received new merchant message:', messageData);
      if (eventHandlers.current.has('new_message')) {
        eventHandlers.current.get('new_message')(messageData);
      }
      
      if (eventHandlers.current.has('new_merchant_message')) {
        eventHandlers.current.get('new_merchant_message')(messageData);
      }
    });

    newSocket.on('customer_chat_update', (updateData) => {
      console.log('📋 Received customer chat update:', updateData);
      if (eventHandlers.current.has('customer_chat_update')) {
        eventHandlers.current.get('customer_chat_update')(updateData);
      }
    });

    // Merchant-specific events
    newSocket.on('new_customer_message', (messageData) => {
      console.log('📨 Received new customer message:', messageData);
      if (eventHandlers.current.has('new_message')) {
        eventHandlers.current.get('new_message')(messageData);
      }
      
      if (eventHandlers.current.has('new_customer_message')) {
        eventHandlers.current.get('new_customer_message')(messageData);
      }
    });

    newSocket.on('merchant_chat_update', (updateData) => {
      console.log('📋 Received merchant chat update:', updateData);
      if (eventHandlers.current.has('merchant_chat_update')) {
        eventHandlers.current.get('merchant_chat_update')(updateData);
      }
    });

    newSocket.on('new_conversation', (conversationData) => {
      console.log('🆕 Received new conversation notification:', conversationData);
      if (eventHandlers.current.has('new_conversation')) {
        eventHandlers.current.get('new_conversation')(conversationData);
      }
    });

    // Enhanced typing events with better state management
    newSocket.on('typing_start', ({ userId, userRole, conversationId }) => {
      console.log(`⌨️ User ${userId} (${userRole}) started typing in ${conversationId}`);
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(conversationId)) {
          newMap.set(conversationId, new Set());
        }
        newMap.get(conversationId).add(userId);
        return newMap;
      });
    });

    newSocket.on('typing_stop', ({ userId, userRole, conversationId }) => {
      console.log(`⌨️ User ${userId} (${userRole}) stopped typing in ${conversationId}`);
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (newMap.has(conversationId)) {
          newMap.get(conversationId).delete(userId);
          if (newMap.get(conversationId).size === 0) {
            newMap.delete(conversationId);
          }
        }
        return newMap;
      });
    });

    // Message status events
    newSocket.on('message_status_update', (statusData) => {
      console.log('📝 Received message status update:', statusData);
      if (eventHandlers.current.has('message_status_update')) {
        eventHandlers.current.get('message_status_update')(statusData);
      }
    });

    newSocket.on('messages_read', (readData) => {
      console.log('📖 Received messages read event:', readData);
      if (eventHandlers.current.has('messages_read')) {
        eventHandlers.current.get('messages_read')(readData);
      }
    });

    // Enhanced user status events
    newSocket.on('merchant_status_update', (statusData) => {
      console.log('🏪 Merchant status update:', statusData);
      if (statusData.isOnline) {
        setOnlineUsers(prev => new Set([...prev, statusData.merchantId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(statusData.merchantId);
          return newSet;
        });
      }
      
      if (eventHandlers.current.has('merchant_status_update')) {
        eventHandlers.current.get('merchant_status_update')(statusData);
      }
    });

    newSocket.on('customer_status_update', (statusData) => {
      console.log('👤 Customer status update:', statusData);
      if (statusData.isOnline) {
        setOnlineUsers(prev => new Set([...prev, statusData.customerId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(statusData.customerId);
          return newSet;
        });
      }

      if (eventHandlers.current.has('customer_status_update')) {
        eventHandlers.current.get('customer_status_update')(statusData);
      }
    });

    // System events
    newSocket.on('system_message', (systemData) => {
      console.log('🔔 System message:', systemData);
      if (eventHandlers.current.has('system_message')) {
        eventHandlers.current.get('system_message')(systemData);
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      // Clear any typing timeouts
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current.clear();
      
      newSocket.disconnect();
    };
  }, [user, getAuthToken, validateToken, clearTokens]);

  // Join conversation
  const joinConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      console.log(`🏠 Joining conversation: ${conversationId}`);
      socket.emit('join_conversation', conversationId);
    } else {
      console.log('⚠️ Cannot join conversation - socket not connected');
    }
  }, [socket, isConnected]);

  // Leave conversation
  const leaveConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      console.log(`🚪 Leaving conversation: ${conversationId}`);
      socket.emit('leave_conversation', conversationId);
    }
  }, [socket, isConnected]);

  // Enhanced typing handler with timeout management
  const handleTyping = useCallback((conversationId, action = 'start') => {
    if (!socket || !isConnected || !user?.id) return;

    // Clear existing timeout for this conversation
    const existingTimeout = typingTimeouts.current.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      typingTimeouts.current.delete(conversationId);
    }

    if (action === 'start') {
      socket.emit('typing_start', { conversationId, userId: user.id });
      
      // Set timeout to automatically stop typing
      const timeout = setTimeout(() => {
        socket.emit('typing_stop', { conversationId, userId: user.id });
        typingTimeouts.current.delete(conversationId);
      }, 2000);
      
      typingTimeouts.current.set(conversationId, timeout);
      
      // Return cleanup function
      return () => {
        clearTimeout(timeout);
        socket.emit('typing_stop', { conversationId, userId: user.id });
        typingTimeouts.current.delete(conversationId);
      };
    } else {
      socket.emit('typing_stop', { conversationId, userId: user.id });
    }
  }, [socket, isConnected, user]);

  // Event subscription with automatic cleanup
  const on = useCallback((event, handler) => {
    console.log(`📡 Subscribing to event: ${event}`);
    eventHandlers.current.set(event, handler);
    
    if (socket) {
      socket.on(event, handler);
    }

    // Return unsubscribe function
    return () => {
      console.log(`📡 Auto-unsubscribing from event: ${event}`);
      eventHandlers.current.delete(event);
      if (socket) {
        socket.off(event, handler);
      }
    };
  }, [socket]);

  // Event unsubscription
  const off = useCallback((event, handler) => {
    console.log(`📡 Unsubscribing from event: ${event}`);
    eventHandlers.current.delete(event);
    
    if (socket) {
      socket.off(event, handler);
    }
  }, [socket]);

  // Emit custom event with connection check
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      console.log(`📤 Emitting event: ${event}`, data);
      socket.emit(event, data);
      return true;
    } else {
      console.log(`⚠️ Cannot emit ${event} - socket not connected`);
      return false;
    }
  }, [socket, isConnected]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return userId ? onlineUsers.has(userId.toString()) : false;
  }, [onlineUsers]);

  // Get typing users for a conversation (excluding current user)
  const getTypingUsers = useCallback((conversationId) => {
    const users = typingUsers.get(conversationId);
    return users ? Array.from(users).filter(userId => userId !== user?.id) : [];
  }, [typingUsers, user]);

  // Get connection status with detailed info
  const getConnectionStatus = useCallback(() => {
    return {
      isConnected,
      connectionError,
      reconnectAttempts: reconnectAttempts.current,
      socketId: socket?.id,
      hasToken: !!getAuthToken(),
      userConnected: !!user?.id
    };
  }, [isConnected, connectionError, socket, getAuthToken, user]);

  // Force reconnection
  const forceReconnect = useCallback(() => {
    if (socket) {
      console.log('🔄 Forcing socket reconnection...');
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
      }, 1000);
    }
  }, [socket]);

  // Update user status (online/offline)
  const updateUserStatus = useCallback((status) => {
    if (socket && isConnected && user?.id) {
      socket.emit('user_status_update', {
        userId: user.id,
        status,
        timestamp: new Date().toISOString()
      });
    }
  }, [socket, isConnected, user]);

  return {
    // Core socket functionality
    socket,
    isConnected,
    connectionError,
    
    // User management
    onlineUsers,
    isUserOnline,
    updateUserStatus,
    
    // Conversation management
    joinConversation,
    leaveConversation,
    
    // Typing functionality
    handleTyping,
    getTypingUsers,
    
    // Event handling
    on,
    off,
    emit,
    
    // Utility functions
    getConnectionStatus,
    forceReconnect
  };
};

export default useSocket;