// pages/MerchantChatInterface.jsx - Updated with enhanced socket event handling
import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, User, Clock, Check, CheckCheck, AlertCircle, Star, Loader2, MessageCircle, RefreshCw } from 'lucide-react';
import Layout from '../../elements/Layout';
import chatService from '../services/chatService';
import useSocket from '../hooks/useSocket';

const MerchantChatInterface = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize merchant user
  useEffect(() => {
    const initializeMerchant = async () => {
      try {
        // Get user info from multiple sources
        const tokenSources = {
          localStorage_access_token: localStorage.getItem('access_token'),
          localStorage_authToken: localStorage.getItem('authToken'),
          localStorage_token: localStorage.getItem('token')
        };

        const token = tokenSources.localStorage_access_token ||
                      tokenSources.localStorage_authToken ||
                      tokenSources.localStorage_token;

        if (!token) {
          setError('Please log in to access merchant chat');
          return;
        }

        // Try to get user info from localStorage first
        let userInfo = null;
        const possibleKeys = ['userInfo', 'user', 'userData', 'currentUser'];
        
        for (const key of possibleKeys) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && (parsed.id || parsed.userId)) {
                userInfo = parsed;
                break;
              }
            }
          } catch (e) {
            console.log(`⚠️ Failed to parse ${key}:`, e.message);
          }
        }

        if (userInfo) {
          const userData = {
            id: userInfo.id || userInfo.userId,
            name: `${userInfo.firstName || userInfo.first_name || 'Merchant'} ${userInfo.lastName || userInfo.last_name || ''}`.trim(),
            email: userInfo.email,
            role: 'merchant',
            userType: 'merchant',
            avatar: userInfo.avatar
          };
          
          console.log('✅ Merchant user initialized:', userData);
          setUser(userData);
        } else {
          // Try to fetch from API
          try {
            const response = await chatService.getCurrentUser();
            if (response.success || response.user) {
              const apiUser = response.user || response.data || response;
              const userData = {
                id: apiUser.id || apiUser.userId,
                name: `${apiUser.firstName || apiUser.first_name || 'Merchant'} ${apiUser.lastName || apiUser.last_name || ''}`.trim(),
                email: apiUser.email,
                role: 'merchant',
                userType: 'merchant',
                avatar: apiUser.avatar
              };
              setUser(userData);
            }
          } catch (apiError) {
            console.error('Failed to fetch user from API:', apiError);
            setError('Failed to load user information');
          }
        }
      } catch (error) {
        console.error('Error initializing merchant:', error);
        setError('Failed to initialize merchant chat');
      }
    };

    initializeMerchant();
  }, []);

  // Initialize socket with enhanced event handling
  const {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    handleTyping,
    on,
    off,
    isUserOnline,
    getTypingUsers
  } = useSocket(user);

  // Enhanced socket event handlers for merchant interface
  useEffect(() => {
    if (!socket || !user) return;

    console.log('🔌 Setting up merchant socket event handlers');

    // Handle new customer messages (primary event for merchants)
    const handleNewCustomerMessage = (messageData) => {
      console.log('📨 Merchant received new customer message:', messageData);
      
      // Add message to messages if it's for the currently selected chat
      if (selectedCustomer && messageData.conversationId === selectedCustomer.conversationId) {
        setMessages(prev => [...prev, messageData]);
        scrollToBottom();
      }
      
      // Update customer list with new message info
      setCustomers(prev => prev.map(customer => {
        if (customer.id === messageData.conversationId) {
          return {
            ...customer,
            lastMessage: messageData.text,
            lastMessageTime: messageData.timestamp,
            unreadCount: (customer.unreadCount || 0) + 1
          };
        }
        return customer;
      }));

      // Show browser notification if not in focus
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${messageData.chatInfo?.customer?.name || 'Customer'}`, {
          body: messageData.text,
          icon: messageData.chatInfo?.customer?.avatar || '/default-avatar.png'
        });
      }
    };

    // Handle general new messages (backup handler)
    const handleNewMessage = (messageData) => {
      console.log('📨 Merchant received general new message:', messageData);
      
      // Only handle if it's from a customer (not from this merchant)
      if (messageData.sender === 'user' || messageData.sender === 'customer') {
        if (selectedCustomer && messageData.conversationId === selectedCustomer.conversationId) {
          setMessages(prev => [...prev, messageData]);
          scrollToBottom();
        }
        
        // Update customer list
        setCustomers(prev => prev.map(customer => {
          if (customer.id === messageData.conversationId) {
            return {
              ...customer,
              lastMessage: messageData.text,
              lastMessageTime: messageData.timestamp,
              unreadCount: (customer.unreadCount || 0) + 1
            };
          }
          return customer;
        }));
      }
    };

    // Handle new conversation notifications
    const handleNewConversation = (conversationData) => {
      console.log('🆕 Merchant received new conversation:', conversationData);
      
      // Add new conversation to the list
      const newCustomerChat = {
        id: conversationData.conversationId,
        conversationId: conversationData.conversationId,
        customer: {
          id: conversationData.customer.id,
          name: conversationData.customer.name,
          avatar: conversationData.customer.avatar,
          email: conversationData.customer.email,
          customerSince: new Date().getFullYear(),
          orderCount: 0,
          priority: 'regular'
        },
        store: {
          id: conversationData.store.id,
          name: conversationData.store.name
        },
        lastMessage: conversationData.initialMessage || 'New conversation started',
        lastMessageTime: 'now',
        unreadCount: conversationData.initialMessage ? 1 : 0,
        online: true
      };

      setCustomers(prev => [newCustomerChat, ...prev]);

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New customer conversation: ${conversationData.customer.name}`, {
          body: conversationData.initialMessage || 'Started a new conversation',
          icon: conversationData.customer.avatar || '/default-avatar.png'
        });
      }
    };

    // Handle merchant chat updates
    const handleMerchantChatUpdate = (updateData) => {
      console.log('📋 Merchant received chat update:', updateData);
      
      if (updateData.action === 'new_message') {
        // Update unread count for specific chat
        setCustomers(prev => prev.map(customer => {
          if (customer.id === updateData.chatId) {
            return {
              ...customer,
              unreadCount: updateData.unreadCount || 0
            };
          }
          return customer;
        }));
      }
    };

    // Handle message status updates
    const handleMessageStatusUpdate = ({ messageId, status }) => {
      console.log('📝 Merchant received message status update:', messageId, status);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
    };

    // Handle messages read events
    const handleMessagesRead = ({ readBy, chatId }) => {
      console.log('📖 Messages read by:', readBy, 'in chat:', chatId);
      
      // Update read status for messages in current chat
      if (selectedCustomer && chatId === selectedCustomer.conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.sender === 'merchant' ? { ...msg, status: 'read' } : msg
        ));
      }
    };

    // Handle customer status updates
    const handleCustomerStatusUpdate = ({ customerId, isOnline }) => {
      console.log('👤 Customer status update:', customerId, isOnline);
      // Update customer online status in the list
      setCustomers(prev => prev.map(customer => {
        if (customer.customer?.id === customerId) {
          return {
            ...customer,
            online: isOnline
          };
        }
        return customer;
      }));
    };

    // Subscribe to events
    on('new_customer_message', handleNewCustomerMessage);
    on('new_message', handleNewMessage);
    on('new_conversation', handleNewConversation);
    on('merchant_chat_update', handleMerchantChatUpdate);
    on('message_status_update', handleMessageStatusUpdate);
    on('messages_read', handleMessagesRead);
    on('customer_status_update', handleCustomerStatusUpdate);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      console.log('🧹 Cleaning up merchant socket event handlers');
      off('new_customer_message', handleNewCustomerMessage);
      off('new_message', handleNewMessage);
      off('new_conversation', handleNewConversation);
      off('merchant_chat_update', handleMerchantChatUpdate);
      off('message_status_update', handleMessageStatusUpdate);
      off('messages_read', handleMessagesRead);
      off('customer_status_update', handleCustomerStatusUpdate);
    };
  }, [socket, user, on, off, selectedCustomer]);

  // Load conversations on mount and when user is available
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Enhanced load conversations function
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Loading merchant conversations...');
      
      const response = await chatService.getConversations('merchant');
      console.log('📋 Merchant conversations response:', response);
      
      if (response.success) {
        setCustomers(response.data);
        console.log(`✅ Loaded ${response.data.length} customer conversations`);
      } else {
        setError(response.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced refresh function
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadConversations();
      
      // If a customer is selected, reload their messages
      if (selectedCustomer) {
        await loadMessages(selectedCustomer.conversationId);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId) => {
    try {
      setError(null);
      console.log('📨 Loading messages for conversation:', conversationId);
      
      const response = await chatService.getMessages(conversationId);
      console.log('📨 Messages response:', response);
      
      if (response.success) {
        setMessages(response.data);
        scrollToBottom();
      } else {
        setError('Failed to load messages');
      }
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      setError('Failed to load messages');
    }
  };

  // Enhanced customer selection
  const handleCustomerSelect = (customer) => {
    console.log('👤 Selecting customer:', customer.customer?.name, 'Chat ID:', customer.id);
    
    // Leave previous conversation
    if (selectedCustomer) {
      leaveConversation(selectedCustomer.conversationId);
    }

    // Set selected customer with proper conversation ID
    const customerData = {
      ...customer,
      conversationId: customer.id // The chat ID from the API
    };
    
    setSelectedCustomer(customerData);

    // Join new conversation
    joinConversation(customer.id);

    // Load messages
    loadMessages(customer.id);

    // Mark messages as read
    markAsRead(customer.id);
  };

  // Mark messages as read
  const markAsRead = async (conversationId) => {
    try {
      await chatService.markMessagesAsRead(conversationId);
      
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

  // Enhanced send message function
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedCustomer || sendingMessage) return;

    const messageText = message.trim();
    
    try {
      setSendingMessage(true);
      setError(null);
      setMessage('');

      console.log('📤 Sending merchant message:', {
        chatId: selectedCustomer.conversationId,
        content: messageText
      });

      const response = await chatService.sendMessage(
        selectedCustomer.conversationId,
        messageText,
        'text'
      );

      if (response.success) {
        console.log('✅ Message sent successfully');
        
        // Update customer list
        setCustomers(prev => prev.map(customer =>
          customer.id === selectedCustomer.conversationId
            ? {
              ...customer,
              lastMessage: messageText,
              lastMessageTime: 'now'
            }
            : customer
        ));
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError(`Failed to send message: ${error.message}`);
      setMessage(messageText); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle message input changes
  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    // Handle typing indicators
    if (selectedCustomer) {
      handleTyping(selectedCustomer.conversationId);
    }
  };

  const handleBackToSidebar = () => {
    if (selectedCustomer) {
      leaveConversation(selectedCustomer.conversationId);
    }
    setSelectedCustomer(null);
    setMessages([]);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick response templates for merchants
  const quickResponses = [
    "Thank you for your message! I'll help you right away.",
    "Your order is being processed and will be ready soon.",
    "We have that item in stock. Would you like me to reserve it for you?",
    "I'll check on that for you and get back to you shortly.",
    "Is there anything else I can help you with today?",
    "Our store hours are Monday to Friday, 9 AM to 6 PM.",
    "You can track your order using the link I'll send you.",
    "We offer free delivery for orders over KES 2,000."
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
  const totalUnreadCount = customers.reduce((total, customer) => total + (customer.unreadCount || 0), 0);

  // Get typing users for current conversation
  const typingUsers = selectedCustomer ? getTypingUsers(selectedCustomer.conversationId) : [];

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading merchant chat...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: '700px' }}>
        {/* Enhanced Header */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Chat</h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-500">Manage customer conversations</p>
                <ConnectionStatus />
              </div>
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
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-800 hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex" style={{ height: 'calc(100% - 80px)' }}>
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
              {filteredCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">No conversations</p>
                    <p className="text-sm">Customer conversations will appear here</p>
                  </div>
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
                        src={customer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.customer?.name || 'Unknown')}&background=random`}
                        alt={customer.customer?.name || 'Unknown'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isUserOnline(customer.customer?.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      {customer.customer?.priority === 'vip' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{customer.customer?.name || 'Unknown'}</h3>
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
                          <span>Customer since {customer.customer?.customerSince || 'Unknown'}</span>
                          <span>{customer.customer?.orderCount || 0} orders</span>
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
                    <button
                      onClick={handleBackToSidebar}
                      className="lg:hidden mr-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="relative">
                      <img
                        src={selectedCustomer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer?.name || 'Unknown')}&background=random`}
                        alt={selectedCustomer.customer?.name || 'Unknown'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {selectedCustomer.customer?.priority === 'vip' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center space-x-2">
                        <h2 className="font-semibold text-gray-900">{selectedCustomer.customer?.name || 'Unknown'}</h2>
                        {selectedCustomer.customer?.priority === 'vip' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">VIP</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {isUserOnline(selectedCustomer.customer?.id) ? 'Online' : 'Last seen recently'} • {selectedCustomer.customer?.orderCount || 0} orders
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
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Start the conversation</p>
                        <p className="text-sm">Send a message to {selectedCustomer.customer?.name || 'this customer'}</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
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
                    ))
                  )}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
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
                        disabled={sendingMessage}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 disabled:bg-gray-100"
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
                  <p className="text-gray-600 max-w-md mb-4">
                    Select a customer from the sidebar to start chatting. Provide excellent customer service and support to grow your business.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 max-w-md mx-auto">
                    <div className="flex items-center justify-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span>{totalUnreadCount} unread</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{customers.filter(c => c.customer?.priority === 'vip').length} VIP customers</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span>{customers.length} total chats</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <User className="w-4 h-4 text-green-500" />
                      <span>{customers.filter(c => isUserOnline(c.customer?.id)).length} online</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MerchantChatInterface;