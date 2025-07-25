// hooks/useSocket.js - Enhanced version with better event handling
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const useSocket = (user) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // chatId -> Set of userIds
  const [connectionError, setConnectionError] = useState(null);
  
  const eventHandlers = useRef(new Map());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Get authentication token
  const getAuthToken = useCallback(() => {
    const tokenSources = {
      localStorage_access_token: localStorage.getItem('access_token'),
      localStorage_authToken: localStorage.getItem('authToken'),
      localStorage_token: localStorage.getItem('token'),
      cookie_authToken: getCookieValue('authToken'),
      cookie_access_token: getCookieValue('access_token'),
      cookie_token: getCookieValue('token')
    };

    return tokenSources.localStorage_access_token ||
           tokenSources.localStorage_authToken ||
           tokenSources.localStorage_token ||
           tokenSources.cookie_authToken ||
           tokenSources.cookie_access_token ||
           tokenSources.cookie_token;
  }, []);

  // Helper function to get cookie value
  const getCookieValue = (name) => {
    if (typeof document === 'undefined') return '';
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return decodeURIComponent(value);
    }
    return '';
  };

  // Initialize socket connection
  useEffect(() => {
    if (!user || !user.id) {
      console.log('⚠️ No user provided to socket hook');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.log('⚠️ No auth token available for socket connection');
      setConnectionError('No authentication token available');
      return;
    }

    console.log('🔌 Initializing socket connection for user:', user.id, 'role:', user.role || user.userType);

    const socketUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:4000';

    const newSocket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      
      // Emit user join event
      newSocket.emit('user_join', {
        id: user.id,
        name: user.name,
        role: user.role || user.userType || 'customer'
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected the client, need to reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionError(error.message);
      reconnectAttempts.current++;
      
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
      // This will be handled by individual components
    });

    // Customer-specific events (for customer chat interface)
    newSocket.on('new_merchant_message', (messageData) => {
      console.log('📨 Received new merchant message:', messageData);
      // Emit as new_message for customer interface
      if (eventHandlers.current.has('new_message')) {
        eventHandlers.current.get('new_message')(messageData);
      }
      
      // Also trigger specific customer event handlers
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

    // Merchant-specific events (for merchant chat interface)
    newSocket.on('new_customer_message', (messageData) => {
      console.log('📨 Received new customer message:', messageData);
      // Emit as new_message for merchant interface
      if (eventHandlers.current.has('new_message')) {
        eventHandlers.current.get('new_message')(messageData);
      }
      
      // Also trigger specific merchant event handlers
      if (eventHandlers.current.has('new_customer_message')) {
        eventHandlers.current.get('new_customer_message')(messageData);
      }
      
      // Update merchant chat list
      if (eventHandlers.current.has('merchant_chat_update')) {
        eventHandlers.current.get('merchant_chat_update')({
          action: 'new_message',
          chatId: messageData.conversationId,
          message: messageData,
          priority: messageData.priority || 'normal'
        });
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

    // Typing events
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

    newSocket.on('messages_delivered', (deliveredData) => {
      console.log('📬 Received messages delivered event:', deliveredData);
      if (eventHandlers.current.has('messages_delivered')) {
        eventHandlers.current.get('messages_delivered')(deliveredData);
      }
    });

    // Chat list update events
    newSocket.on('chat_list_update', (updateData) => {
      console.log('📋 Received chat list update:', updateData);
      if (eventHandlers.current.has('chat_list_update')) {
        eventHandlers.current.get('chat_list_update')(updateData);
      }
    });

    // User status events for merchants and customers
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
    });

    // System events
    newSocket.on('system_message', (systemData) => {
      console.log('🔔 System message:', systemData);
      if (eventHandlers.current.has('system_message')) {
        eventHandlers.current.get('system_message')(systemData);
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [user, getAuthToken]);

  // Join conversation
  const joinConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      console.log(`🏠 Joining conversation: ${conversationId}`);
      socket.emit('join_conversation', conversationId);
    }
  }, [socket, isConnected]);

  // Leave conversation
  const leaveConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      console.log(`🚪 Leaving conversation: ${conversationId}`);
      socket.emit('leave_conversation', conversationId);
    }
  }, [socket, isConnected]);

  // Handle typing
  const handleTyping = useCallback((conversationId, action = 'start') => {
    if (socket && isConnected) {
      const typingTimeout = setTimeout(() => {
        socket.emit('typing_stop', { conversationId, userId: user.id });
      }, 2000);

      socket.emit('typing_start', { conversationId, userId: user.id });
      
      return () => {
        clearTimeout(typingTimeout);
        socket.emit('typing_stop', { conversationId, userId: user.id });
      };
    }
  }, [socket, isConnected, user]);

  // Event subscription
  const on = useCallback((event, handler) => {
    console.log(`📡 Subscribing to event: ${event}`);
    eventHandlers.current.set(event, handler);
    
    // If socket is already connected, also add the handler directly
    if (socket) {
      socket.on(event, handler);
    }
  }, [socket]);

  // Event unsubscription
  const off = useCallback((event, handler) => {
    console.log(`📡 Unsubscribing from event: ${event}`);
    eventHandlers.current.delete(event);
    
    if (socket) {
      socket.off(event, handler);
    }
  }, [socket]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId?.toString());
  }, [onlineUsers]);

  // Get typing users for a conversation
  const getTypingUsers = useCallback((conversationId) => {
    const users = typingUsers.get(conversationId);
    return users ? Array.from(users).filter(userId => userId !== user?.id) : [];
  }, [typingUsers, user]);

  // Emit custom event
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      console.log(`📤 Emitting event: ${event}`, data);
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return {
      isConnected,
      connectionError,
      reconnectAttempts: reconnectAttempts.current
    };
  }, [isConnected, connectionError]);

  return {
    socket,
    isConnected,
    connectionError,
    onlineUsers,
    joinConversation,
    leaveConversation,
    handleTyping,
    on,
    off,
    emit,
    isUserOnline,
    getTypingUsers,
    getConnectionStatus
  };
};

export default useSocket;