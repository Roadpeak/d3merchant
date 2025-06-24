import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, User, Clock, Check, CheckCheck, AlertCircle, Star, Loader2 } from 'lucide-react';

const MerchantChatInterface = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';
  const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:4000';

  // Get auth token (assuming it's stored in localStorage)
  const getAuthToken = () => localStorage.getItem('authToken');

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const newSocket = io(WS_URL, {
          auth: {
            token: getAuthToken()
          }
        });

        newSocket.on('connect', () => {
          console.log('Connected to WebSocket');
          // Join as merchant user
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          newSocket.emit('user_join', {
            userId: userData.id,
            role: 'merchant'
          });
        });

        newSocket.on('new_message', (messageData) => {
          // Add new message to current conversation
          if (selectedCustomer && messageData.conversationId === selectedCustomer.conversationId) {
            setMessages(prev => [...prev, messageData]);
            scrollToBottom();
          }

          // Update customer list with new message
          setCustomers(prev => prev.map(customer => {
            if (customer.id === messageData.conversationId) {
              return {
                ...customer,
                lastMessage: messageData.text,
                lastMessageTime: messageData.timestamp,
                unreadCount: customer.unreadCount + (selectedCustomer?.id === customer.id ? 0 : 1)
              };
            }
            return customer;
          }));
        });

        newSocket.on('messages_read', ({ readBy }) => {
          // Update message status to read
          setMessages(prev => prev.map(msg => ({
            ...msg,
            status: msg.sender === 'merchant' ? 'read' : msg.status
          })));
        });

        newSocket.on('typing_start', ({ userId, conversationId }) => {
          if (selectedCustomer && conversationId === selectedCustomer.conversationId) {
            setTypingUsers(prev => new Set(prev).add(userId));
          }
        });

        newSocket.on('typing_stop', ({ userId, conversationId }) => {
          if (selectedCustomer && conversationId === selectedCustomer.conversationId) {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
          }
        });

        newSocket.on('user_online', (userId) => {
          setCustomers(prev => prev.map(customer =>
            customer.customer.id === userId
              ? { ...customer, online: true }
              : customer
          ));
        });

        newSocket.on('user_offline', (userId) => {
          setCustomers(prev => prev.map(customer =>
            customer.customer.id === userId
              ? { ...customer, online: false }
              : customer
          ));
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error('Socket connection failed:', error);
      }
    };

    initSocket();
  }, [WS_URL, selectedCustomer]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversations from API
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/chat/conversations');

      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId) => {
    try {
      const response = await apiCall(`/chat/conversations/${conversationId}/messages`);

      if (response.success) {
        setMessages(response.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer({
      ...customer,
      conversationId: customer.id
    });

    // Join conversation room
    if (socket) {
      socket.emit('join_conversation', customer.id);
    }

    // Load messages
    loadMessages(customer.id);

    // Mark messages as read
    markAsRead(customer.id);
  };

  // Mark messages as read
  const markAsRead = async (conversationId) => {
    try {
      // Reset unread count in UI
      setCustomers(prev => prev.map(customer =>
        customer.id === conversationId
          ? { ...customer, unreadCount: 0 }
          : customer
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedCustomer || sendingMessage) return;

    try {
      setSendingMessage(true);

      const messageData = {
        conversationId: selectedCustomer.conversationId,
        content: message.trim(),
        messageType: 'text'
      };

      const response = await apiCall('/chat/messages', {
        method: 'POST',
        body: JSON.stringify(messageData)
      });

      if (response.success) {
        // Add message to local state immediately for better UX
        const newMessage = {
          id: Date.now(), // Temporary ID
          text: message.trim(),
          sender: 'merchant',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          }),
          status: 'sent'
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage('');
        scrollToBottom();

        // Update customer list
        setCustomers(prev => prev.map(customer =>
          customer.id === selectedCustomer.conversationId
            ? {
              ...customer,
              lastMessage: message.trim(),
              lastMessageTime: 'now'
            }
            : customer
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // You might want to show an error message to the user here
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (socket && selectedCustomer) {
      socket.emit('typing_start', {
        conversationId: selectedCustomer.conversationId,
        userId: JSON.parse(localStorage.getItem('userData') || '{}').id
      });
    }
  };

  const handleTypingStop = () => {
    if (socket && selectedCustomer) {
      socket.emit('typing_stop', {
        conversationId: selectedCustomer.conversationId,
        userId: JSON.parse(localStorage.getItem('userData') || '{}').id
      });
    }
  };

  // Handle message input changes
  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    // Handle typing indicators
    handleTypingStart();

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  const handleBackToSidebar = () => {
    if (socket && selectedCustomer) {
      socket.emit('leave_conversation', selectedCustomer.conversationId);
    }
    setSelectedCustomer(null);
    setMessages([]);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick response templates
  const quickResponses = [
    "Thank you for your message! I'll help you right away.",
    "Your order is being processed and will be ready soon.",
    "We have that item in stock. Would you like me to reserve it for you?",
    "I'll check on that for you and get back to you shortly.",
    "Is there anything else I can help you with today?"
  ];

  const handleQuickResponse = (response) => {
    setMessage(response);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Calculate total unread messages
  const totalUnreadCount = customers.reduce((total, customer) => total + customer.unreadCount, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: '700px' }}>
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Customer Chat</h2>
            <p className="text-sm text-gray-500">Manage customer conversations</p>
          </div>
          <div className="flex items-center space-x-4">
            {totalUnreadCount > 0 && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  {totalUnreadCount} unread message{totalUnreadCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Customer List Sidebar */}
        <div className={`${selectedCustomer
            ? 'hidden lg:flex'
            : 'flex'
          } w-full lg:w-80 flex-col bg-gray-50 border-r border-gray-200`}>
          {/* Search */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No conversations found
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`flex items-start p-4 hover:bg-white cursor-pointer transition-colors border-b border-gray-100 ${selectedCustomer?.conversationId === customer.id ? 'bg-white border-r-2 border-blue-500' : ''
                    }`}
                >
                  <div className="relative">
                    <img
                      src={customer.customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.customer.name)}&background=random`}
                      alt={customer.customer.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {customer.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                    {customer.customer.priority === 'vip' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Star className="w-2 h-2 text-yellow-800" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{customer.customer.name}</h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">{customer.lastMessageTime}</span>
                        {customer.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {customer.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">{customer.lastMessage}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-3">
                        <span>Customer since {customer.customer.customerSince}</span>
                        <span>{customer.customer.orderCount} orders</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedCustomer
            ? 'flex w-full'
            : 'hidden lg:flex lg:flex-1'
          } flex-col`}>
          {selectedCustomer ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  {/* Back button - Only visible on mobile */}
                  <button
                    onClick={handleBackToSidebar}
                    className="lg:hidden mr-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedCustomer.customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer.name)}&background=random`}
                      alt={selectedCustomer.customer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {selectedCustomer.customer.priority === 'vip' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Star className="w-2 h-2 text-yellow-800" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <h2 className="font-semibold text-gray-900">{selectedCustomer.customer.name}</h2>
                      {selectedCustomer.customer.priority === 'vip' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">VIP</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedCustomer.online ? 'Online' : 'Last seen recently'} • {selectedCustomer.customer.orderCount} orders
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'merchant' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.sender === 'merchant'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm border'
                        }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${msg.sender === 'merchant' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{msg.timestamp}</span>
                        {msg.sender === 'merchant' && (
                          <div className="ml-1">
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3 h-3 text-blue-200" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Responses */}
              <div className="bg-white p-3 border-t border-gray-100">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {quickResponses.map((response, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickResponse(response)}
                      className="flex-shrink-0 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors whitespace-nowrap"
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="bg-white p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={handleMessageChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendingMessage}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen - Only visible on desktop when no chat selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Customer Support Chat</h2>
                <p className="text-gray-600 max-w-md">
                  Select a customer from the sidebar to start chatting. Provide excellent customer service and support to grow your business.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>{totalUnreadCount} unread</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{customers.filter(c => c.customer?.priority === 'vip').length} VIP customers</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantChatInterface;