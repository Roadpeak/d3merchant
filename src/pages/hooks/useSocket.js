// hooks/useSocket.js
import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (user) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typing, setTyping] = useState(new Map());
  const typingTimeoutRef = useRef(null);

  // Determine socket URL based on environment
  const getSocketUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      // In production, use the same origin
      return window.location.origin;
    } else {
      // In development, use localhost with your backend port
      return 'http://localhost:4000';
    }
  };

  const SOCKET_URL = getSocketUrl();

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      socketInstance.emit('user_join', user);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // User presence events
    socketInstance.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socketInstance.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Typing events
    socketInstance.on('typing_start', ({ userId, conversationId }) => {
      setTyping(prev => new Map(prev.set(`${conversationId}-${userId}`, true)));
    });

    socketInstance.on('typing_stop', ({ userId, conversationId }) => {
      setTyping(prev => {
        const newMap = new Map(prev);
        newMap.delete(`${conversationId}-${userId}`);
        return newMap;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, SOCKET_URL]);

  // Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }
  }, [socket]);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socket) {
      socket.emit('leave_conversation', conversationId);
    }
  }, [socket]);

  // Send typing start
  const startTyping = useCallback((conversationId) => {
    if (socket && user) {
      socket.emit('typing_start', {
        conversationId,
        userId: user.id
      });
    }
  }, [socket, user]);

  // Send typing stop
  const stopTyping = useCallback((conversationId) => {
    if (socket && user) {
      socket.emit('typing_stop', {
        conversationId,
        userId: user.id
      });
    }
  }, [socket, user]);

  // Handle typing with debounce
  const handleTyping = useCallback((conversationId) => {
    startTyping(conversationId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  }, [startTyping, stopTyping]);

  // Subscribe to events
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  // Unsubscribe from events
  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  // Emit events
  const emit = useCallback((event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  }, [socket]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get typing users for a conversation
  const getTypingUsers = useCallback((conversationId) => {
    if (!user) return [];
    
    const typingKey = `${conversationId}-`;
    return Array.from(typing.keys())
      .filter(key => key.startsWith(typingKey) && !key.endsWith(user.id))
      .map(key => key.replace(typingKey, ''));
  }, [typing, user]);

  return {
    socket,
    isConnected,
    onlineUsers,
    typing,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    handleTyping,
    on,
    off,
    emit,
    isUserOnline,
    getTypingUsers
  };
};

export default useSocket;