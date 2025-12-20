// hooks/useSocket.js - FIXED: Customer↔Store Communication Events
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import merchantAuthService from '../../services/merchantAuthService';

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

  // FIXED: Enhanced token retrieval with customer↔store distinction
  const getAuthToken = useCallback(() => {
    console.log('🔍 Getting auth token for user type:', user?.userType);

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

    let token = null;

    if (user?.userType === 'merchant') {
      // For merchants, use merchant auth service
      console.log('🏪 Getting merchant token for store communication...');
      token = merchantAuthService.getToken();

      if (!token) {
        console.log('🏪 No merchant token from auth service, trying fallback...');
        const tokenSources = {
          localStorage_access_token: getLocalStorage('access_token'),
          localStorage_authToken: getLocalStorage('authToken'),
          localStorage_token: getLocalStorage('token'),
          cookie_authToken: getCookieValue('authToken'),
          cookie_access_token: getCookieValue('access_token'),
          cookie_token: getCookieValue('token')
        };

        token = tokenSources.localStorage_access_token ||
          tokenSources.localStorage_authToken ||
          tokenSources.localStorage_token ||
          tokenSources.cookie_authToken ||
          tokenSources.cookie_access_token ||
          tokenSources.cookie_token;
      }
    } else {
      // For customers, use standard token sources
      console.log('👤 Getting customer token for store communication...');
      const tokenSources = {
        localStorage_access_token: getLocalStorage('access_token'),
        localStorage_authToken: getLocalStorage('authToken'),
        localStorage_token: getLocalStorage('token'),
        cookie_authToken: getCookieValue('authToken'),
        cookie_access_token: getCookieValue('access_token'),
        cookie_token: getCookieValue('token')
      };

      token = tokenSources.localStorage_access_token ||
        tokenSources.localStorage_authToken ||
        tokenSources.localStorage_token ||
        tokenSources.cookie_authToken ||
        tokenSources.cookie_access_token ||
        tokenSources.cookie_token;
    }

    if (token) {
      console.log(`✅ Token found for ${user?.userType}:`, 'Present');
      // SECURITY: Never log token values or previews

      // Validate token type matches user type
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token validation for customer↔store communication:', {
          tokenType: payload.type,
          userType: user?.userType,
          tokenUserId: payload.userId || payload.id,
          userIdProvided: user?.id,
          match: payload.type === user?.userType
        });

        if (user?.userType === 'merchant' && payload.type !== 'merchant') {
          console.error('❌ Token type mismatch: Expected merchant, got', payload.type);
          return null;
        }

        if (user?.userType !== 'merchant' && payload.type === 'merchant') {
          console.error('❌ Token type mismatch: Expected customer, got merchant');
          return null;
        }
      } catch (e) {
        console.error('❌ Error validating token:', e);
        return null;
      }
    } else {
      console.log(`❌ No token found for ${user?.userType}`);
    }

    return token;
  }, [user]);

  // Enhanced token validation
  const validateToken = useCallback((token) => {
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('⚠️ Token does not appear to be a valid JWT format');
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.error('❌ Token is expired');
        return false;
      }

      // Validate token type matches expected user type for customer↔store communication
      if (user?.userType === 'merchant' && payload.type !== 'merchant') {
        console.error('❌ Token type mismatch for merchant store communication');
        return false;
      }

      if (user?.userType === 'customer' && payload.type === 'merchant') {
        console.error('❌ Token type mismatch for customer store communication');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return false;
    }
  }, [user]);

  // Clear invalid tokens
  const clearTokens = useCallback(() => {
    ['access_token', 'authToken', 'token'].forEach(key => {
      localStorage.removeItem(key);
    });

    ['authToken', 'access_token', 'token'].forEach(key => {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    if (user?.userType === 'merchant') {
      merchantAuthService.logout();
    }
  }, [user]);

  // FIXED: Initialize socket for customer↔store communication
  useEffect(() => {
    if (!user?.id) {
      console.log('⚠️ No user provided to socket hook');
      return;
    }

    console.log('🔌 Initializing customer↔store socket for:', {
      userId: user.id,
      userType: user.userType,
      role: user.role,
      storeName: user.storeName,
      merchantId: user.merchantId
    });

    const token = getAuthToken();
    if (!token) {
      console.log('⚠️ No auth token available for customer↔store socket');
      setConnectionError(`No authentication token available for ${user.userType}`);
      return;
    }

    if (!validateToken(token)) {
      console.log('⚠️ Invalid token for customer↔store communication');
      setConnectionError('Invalid or expired authentication token');
      return;
    }
     
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:4000';
    
    console.log('🌐 Connecting to customer↔store socket server:', socketUrl);

    // Enhanced socket configuration for customer↔store communication
    const newSocket = io(socketUrl, {
      auth: {
        token,
        userType: user.userType,
        userId: user.id,
        merchantId: user.merchantId || user.id,
        storeId: user.storeId,
        storeName: user.storeName
      },
      query: {
        token,
        userId: user.id,
        userRole: user.role || user.userType || 'customer',
        userType: user.userType,
        merchantId: user.merchantId || (user.userType === 'merchant' ? user.id : null),
        storeId: user.storeId,
        communicationType: 'customer_store' // Identify this as customer↔store communication
      },
      extraHeaders: {
        'Authorization': `Bearer ${token}`,
        'User-Type': user.userType,
        'Communication-Type': 'customer-store'
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
      console.log(`✅ Customer↔Store socket connected for ${user.userType}`);
      console.log('🔗 Socket ID:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      // Send proper user join for customer↔store communication
      newSocket.emit('user_join', {
        id: user.id,
        name: user.name,
        role: user.role || user.userType || 'customer',
        userType: user.userType,
        merchantId: user.merchantId,
        storeId: user.storeId,
        storeName: user.storeName,
        communicationType: 'customer_store',
        timestamp: new Date().toISOString()
      });

      // Join appropriate rooms for customer↔store communication
      if (user.userType === 'merchant') {
        console.log('🏪 Joining merchant store rooms...');
        newSocket.emit('join_merchant_store_room', {
          merchantId: user.merchantId || user.id,
          storeId: user.storeId,
          storeName: user.storeName
        });
      } else {
        console.log('👤 Joining customer store rooms...');
        newSocket.emit('join_customer_store_room', user.id);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`❌ Customer↔Store socket disconnected (${user.userType}):`, reason);
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
      console.error(`❌ Customer↔Store socket error (${user.userType}):`, error);
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
      console.log(`🔄 Customer↔Store socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Customer↔Store socket reconnection failed');
      setConnectionError('Reconnection failed');
    });

    // User status events for customer↔store communication
    newSocket.on('user_online', (userId) => {
      console.log('👥 User came online:', userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', (userId) => {
      console.log('👥 User went offline:', userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // FIXED: Enhanced message events for customer↔store communication
    newSocket.on('new_message', (messageData) => {
      console.log(`📨 ${user.userType} received new_message:`, messageData);

      // Filter messages based on customer↔store communication model
      if (user.userType === 'merchant') {
        // Merchants should only receive customer→store messages
        if ((messageData.sender === 'user' || messageData.sender === 'customer' || messageData.sender_type === 'user') &&
          (messageData.type === 'customer_to_store' || messageData.recipient_type === 'merchant')) {
          console.log('✅ Customer→Store message for merchant');
          if (eventHandlers.current.has('new_message')) {
            eventHandlers.current.get('new_message')(messageData);
          }
        } else {
          console.log('⚠️ Message not relevant for merchant store interface');
        }
      } else {
        // Customers should only receive store→customer messages
        if ((messageData.sender === 'store' || messageData.sender_type === 'store') &&
          (messageData.type === 'store_to_customer' || messageData.recipient_type === 'customer')) {
          console.log('✅ Store→Customer message for customer');
          if (eventHandlers.current.has('new_message')) {
            eventHandlers.current.get('new_message')(messageData);
          }
        } else {
          console.log('⚠️ Message not relevant for customer store interface');
        }
      }
    });

    // FIXED: Customer↔Store specific events
    if (user.userType === 'merchant') {
      // Merchant-specific events for store communication
      newSocket.on('new_customer_to_store_message', (messageData) => {
        console.log('📨 MERCHANT received customer→store message:', messageData);
        if (eventHandlers.current.has('new_customer_to_store_message')) {
          eventHandlers.current.get('new_customer_to_store_message')(messageData);
        }
        // Also trigger generic handler
        if (eventHandlers.current.has('new_message')) {
          eventHandlers.current.get('new_message')(messageData);
        }
      });

      newSocket.on('new_customer_store_conversation', (conversationData) => {
        console.log('🆕 MERCHANT received new customer→store conversation:', conversationData);
        if (eventHandlers.current.has('new_customer_store_conversation')) {
          eventHandlers.current.get('new_customer_store_conversation')(conversationData);
        }
        if (eventHandlers.current.has('new_conversation')) {
          eventHandlers.current.get('new_conversation')(conversationData);
        }
      });

      newSocket.on('merchant_store_chat_update', (updateData) => {
        console.log('📋 MERCHANT received store chat update:', updateData);
        if (eventHandlers.current.has('merchant_chat_update')) {
          eventHandlers.current.get('merchant_chat_update')(updateData);
        }
      });
    } else {
      // Customer-specific events for store communication
      newSocket.on('new_store_to_customer_message', (messageData) => {
        console.log('📨 CUSTOMER received store→customer message:', messageData);
        if (eventHandlers.current.has('new_store_to_customer_message')) {
          eventHandlers.current.get('new_store_to_customer_message')(messageData);
        }
        // Also trigger generic handler
        if (eventHandlers.current.has('new_message')) {
          eventHandlers.current.get('new_message')(messageData);
        }
      });

      newSocket.on('customer_store_chat_update', (updateData) => {
        console.log('📋 CUSTOMER received store chat update:', updateData);
        if (eventHandlers.current.has('customer_chat_update')) {
          eventHandlers.current.get('customer_chat_update')(updateData);
        }
      });
    }

    // Enhanced typing events for customer↔store communication
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

    // Enhanced user status events for customer↔store communication
    newSocket.on('merchant_store_status_update', (statusData) => {
      console.log('🏪 Merchant store status update:', statusData);
      if (statusData.isOnline) {
        statusData.storeIds?.forEach(storeId => {
          setOnlineUsers(prev => new Set([...prev, `store_${storeId}`]));
        });
      } else {
        statusData.storeIds?.forEach(storeId => {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(`store_${storeId}`);
            return newSet;
          });
        });
      }

      if (eventHandlers.current.has('merchant_store_status_update')) {
        eventHandlers.current.get('merchant_store_status_update')(statusData);
      }
    });

    newSocket.on('customer_store_status_update', (statusData) => {
      console.log('👤 Customer store status update:', statusData);
      if (statusData.isOnline) {
        setOnlineUsers(prev => new Set([...prev, statusData.customerId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(statusData.customerId);
          return newSet;
        });
      }

      if (eventHandlers.current.has('customer_store_status_update')) {
        eventHandlers.current.get('customer_store_status_update')(statusData);
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
      console.log(`🧹 Cleaning up customer↔store socket for ${user.userType}`);
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current.clear();

      newSocket.disconnect();
    };
  }, [user, getAuthToken, validateToken, clearTokens]);

  // FIXED: Join conversation for customer↔store communication
  const joinConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      console.log(`🏠 ${user?.userType} joining customer↔store conversation: ${conversationId}`);
      socket.emit('join_conversation', {
        conversationId,
        userType: user?.userType,
        userId: user?.id,
        merchantId: user?.merchantId,
        storeId: user?.storeId,
        communicationType: 'customer_store'
      });
    } else {
      console.log('⚠️ Cannot join customer↔store conversation - socket not connected');
    }
  }, [socket, isConnected, user]);

  // FIXED: Leave conversation for customer↔store communication
  const leaveConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      console.log(`🚪 ${user?.userType} leaving customer↔store conversation: ${conversationId}`);
      socket.emit('leave_conversation', {
        conversationId,
        userType: user?.userType,
        userId: user?.id,
        merchantId: user?.merchantId,
        storeId: user?.storeId,
        communicationType: 'customer_store'
      });
    }
  }, [socket, isConnected, user]);

  // Enhanced typing handler for customer↔store communication
  const handleTyping = useCallback((conversationId, action = 'start') => {
    if (!socket || !isConnected || !user?.id) return;

    const existingTimeout = typingTimeouts.current.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      typingTimeouts.current.delete(conversationId);
    }

    if (action === 'start') {
      socket.emit('typing_start', {
        conversationId,
        userId: user.id,
        userType: user.userType,
        merchantId: user.merchantId,
        storeId: user.storeId,
        communicationType: 'customer_store'
      });

      const timeout = setTimeout(() => {
        socket.emit('typing_stop', {
          conversationId,
          userId: user.id,
          userType: user.userType,
          merchantId: user.merchantId,
          storeId: user.storeId,
          communicationType: 'customer_store'
        });
        typingTimeouts.current.delete(conversationId);
      }, 2000);

      typingTimeouts.current.set(conversationId, timeout);

      return () => {
        clearTimeout(timeout);
        socket.emit('typing_stop', {
          conversationId,
          userId: user.id,
          userType: user.userType,
          merchantId: user.merchantId,
          storeId: user.storeId,
          communicationType: 'customer_store'
        });
        typingTimeouts.current.delete(conversationId);
      };
    } else {
      socket.emit('typing_stop', {
        conversationId,
        userId: user.id,
        userType: user.userType,
        merchantId: user.merchantId,
        storeId: user.storeId,
        communicationType: 'customer_store'
      });
    }
  }, [socket, isConnected, user]);

  // Event subscription with automatic cleanup
  const on = useCallback((event, handler) => {
    console.log(`📡 ${user?.userType} subscribing to customer↔store event: ${event}`);
    eventHandlers.current.set(event, handler);

    if (socket) {
      socket.on(event, handler);
    }

    return () => {
      console.log(`📡 Auto-unsubscribing from customer↔store event: ${event}`);
      eventHandlers.current.delete(event);
      if (socket) {
        socket.off(event, handler);
      }
    };
  }, [socket, user]);

  // Event unsubscription
  const off = useCallback((event, handler) => {
    console.log(`📡 ${user?.userType} unsubscribing from customer↔store event: ${event}`);
    eventHandlers.current.delete(event);

    if (socket) {
      socket.off(event, handler);
    }
  }, [socket, user]);

  // Emit custom event with customer↔store context
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      const enhancedData = {
        ...data,
        userType: user?.userType,
        userId: user?.id,
        merchantId: user?.merchantId,
        storeId: user?.storeId,
        communicationType: 'customer_store'
      };
      console.log(`📤 ${user?.userType} emitting customer↔store event: ${event}`, enhancedData);
      socket.emit(event, enhancedData);
      return true;
    } else {
      console.log(`⚠️ Cannot emit customer↔store ${event} - socket not connected`);
      return false;
    }
  }, [socket, isConnected, user]);

  // Check if user is online (enhanced for customer↔store communication)
  const isUserOnline = useCallback((userId) => {
    if (!userId) return false;

    // Check direct user ID
    if (onlineUsers.has(userId.toString())) return true;

    // For store IDs, check store-prefixed version
    if (onlineUsers.has(`store_${userId}`)) return true;

    return false;
  }, [onlineUsers]);

  // Get typing users for a conversation (excluding current user)
  const getTypingUsers = useCallback((conversationId) => {
    const users = typingUsers.get(conversationId);
    return users ? Array.from(users).filter(userId => userId !== user?.id) : [];
  }, [typingUsers, user]);

  // Get connection status with customer↔store info
  const getConnectionStatus = useCallback(() => {
    return {
      isConnected,
      connectionError,
      reconnectAttempts: reconnectAttempts.current,
      socketId: socket?.id,
      hasToken: !!getAuthToken(),
      userConnected: !!user?.id,
      userType: user?.userType,
      merchantId: user?.merchantId,
      storeId: user?.storeId,
      communicationType: 'customer_store'
    };
  }, [isConnected, connectionError, socket, getAuthToken, user]);

  // Force reconnection
  const forceReconnect = useCallback(() => {
    if (socket) {
      console.log(`🔄 Forcing customer↔store socket reconnection for ${user?.userType}...`);
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
      }, 1000);
    }
  }, [socket, user]);

  // Update user status for customer↔store communication
  const updateUserStatus = useCallback((status) => {
    if (socket && isConnected && user?.id) {
      socket.emit('user_status_update', {
        userId: user.id,
        userType: user.userType,
        merchantId: user.merchantId,
        storeId: user.storeId,
        storeName: user.storeName,
        status,
        communicationType: 'customer_store',
        timestamp: new Date().toISOString()
      });
    }
  }, [socket, isConnected, user]);

  // Enhanced debugging for customer↔store communication
  const debugConnection = useCallback(() => {
    console.group(`🔍 Customer↔Store Socket Debug for ${user?.userType}`);
    console.log('User Info:', {
      id: user?.id,
      userType: user?.userType,
      merchantId: user?.merchantId,
      storeId: user?.storeId,
      storeName: user?.storeName,
      name: user?.name
    });
    console.log('Connection Status:', getConnectionStatus());
    console.log('Online Users:', Array.from(onlineUsers));
    console.log('Active Typing Users:', Object.fromEntries(typingUsers));
    console.log('Event Handlers:', Array.from(eventHandlers.current.keys()));
    console.log('Communication Type: Customer↔Store');
    console.groupEnd();
  }, [user, getConnectionStatus, onlineUsers, typingUsers]);

  // Helper to emit customer↔store specific events
  const emitCustomerStoreEvent = useCallback((eventType, data) => {
    if (!socket || !isConnected) return false;

    const eventData = {
      ...data,
      userId: user?.id,
      userType: user?.userType,
      merchantId: user?.merchantId,
      storeId: user?.storeId,
      storeName: user?.storeName,
      communicationType: 'customer_store',
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Emitting customer↔store event: ${eventType}`, eventData);

    try {
      socket.emit(eventType, eventData);
      return true;
    } catch (error) {
      console.error(`❌ Error emitting customer↔store event ${eventType}:`, error);
      return false;
    }
  }, [socket, isConnected, user]);

  // Check if store is online (for customers)
  const isStoreOnline = useCallback((storeId) => {
    return onlineUsers.has(`store_${storeId}`) || onlineUsers.has(storeId?.toString());
  }, [onlineUsers]);

  // Check if customer is online (for merchants)
  const isCustomerOnline = useCallback((customerId) => {
    return onlineUsers.has(customerId?.toString());
  }, [onlineUsers]);

  return {
    // Core socket functionality
    socket,
    isConnected,
    connectionError,

    // User management for customer↔store communication
    onlineUsers,
    isUserOnline,
    isStoreOnline,
    isCustomerOnline,
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
    emitCustomerStoreEvent,

    // Utility functions
    getConnectionStatus,
    forceReconnect,
    debugConnection
  };
};

export default useSocket;
