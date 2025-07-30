// pages/MerchantChatInterface.jsx - FIXED: Merchant responding as Store to Customers
import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, User, Clock, Check, CheckCheck, AlertCircle, Star, Loader2, MessageCircle, RefreshCw, Store, Users } from 'lucide-react';
import Layout from '../../elements/Layout';
import merchantChatService from '../services/merchantChatService';
import merchantAuthService from '../../services/merchantAuthService';
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

  // Enhanced merchant initialization
  useEffect(() => {
    const initializeMerchant = async () => {
      try {
        console.log('🏪 Starting MERCHANT initialization for store communication...');
        
        if (!merchantAuthService.isAuthenticated()) {
          console.log('🏪 Merchant not authenticated, redirecting...');
          setError('Please log in as a merchant to access store chat');
          setLoading(false);
          setTimeout(() => {
            window.location.href = '/accounts/sign-in';
          }, 2000);
          return;
        }

        const merchantToken = merchantAuthService.getToken();
        console.log('🏪 Merchant token check:', merchantToken ? `Found (${merchantToken.substring(0, 20)}...)` : 'NOT FOUND');

        if (!merchantToken) {
          setError('No valid merchant session found. Please log in as a merchant.');
          setLoading(false);
          return;
        }

        // Verify token is merchant type
        try {
          const tokenPayload = JSON.parse(atob(merchantToken.split('.')[1]));
          console.log('🏪 Token payload:', tokenPayload);
          
          if (tokenPayload.type !== 'merchant') {
            console.log('🏪 Token is not merchant type:', tokenPayload.type);
            setError('Invalid session type. Please log in as a merchant.');
            merchantAuthService.logout();
            return;
          }
        } catch (tokenError) {
          console.error('🏪 Error parsing token:', tokenError);
          setError('Invalid authentication token. Please log in again.');
          merchantAuthService.logout();
          return;
        }

        console.log('🏪 Getting merchant profile...');
        const profileResponse = await merchantAuthService.getCurrentMerchantProfile();
        
        console.log('🏪 Merchant profile response:', profileResponse);

        if (profileResponse && profileResponse.success && profileResponse.merchantProfile) {
          const merchantProfile = profileResponse.merchantProfile;
          
          // Create merchant user object for store communication
          const merchantUserData = {
            id: merchantProfile.id || merchantProfile.merchant_id,
            name: `${merchantProfile.first_name || 'Merchant'} ${merchantProfile.last_name || ''}`.trim(),
            email: merchantProfile.email_address,
            role: 'merchant',
            userType: 'merchant',
            type: 'merchant',
            avatar: merchantProfile.avatar,
            storeId: merchantProfile.store?.id,
            storeName: merchantProfile.store?.name,
            merchantId: merchantProfile.id || merchantProfile.merchant_id,
            merchantProfile: merchantProfile,
            // Store information for proper representation
            storeInfo: merchantProfile.store ? {
              id: merchantProfile.store.id,
              name: merchantProfile.store.name,
              logo: merchantProfile.store.logo_url,
              category: merchantProfile.store.category
            } : null
          };

          console.log('✅ Merchant user for store communication initialized:', merchantUserData);
          setUser(merchantUserData);
          localStorage.setItem('currentMerchant', JSON.stringify(merchantUserData));
          
        } else {
          console.log('🏪 Profile API failed, trying stored merchant data...');
          
          const storedMerchant = localStorage.getItem('currentMerchant');
          if (storedMerchant) {
            try {
              const parsedMerchant = JSON.parse(storedMerchant);
              if (parsedMerchant && parsedMerchant.id && parsedMerchant.userType === 'merchant') {
                console.log('✅ Merchant restored from localStorage:', parsedMerchant);
                setUser(parsedMerchant);
                return;
              }
            } catch (e) {
              console.error('Error parsing stored merchant:', e);
            }
          }

          // Construct merchant from token if profile fails
          console.log('🏪 Constructing merchant from token...');
          
          const token = merchantAuthService.getToken();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              
              if (payload.type === 'merchant') {
                const basicMerchant = {
                  id: payload.id || payload.merchantId,
                  name: payload.name || 'Merchant User',
                  email: payload.email,
                  role: 'merchant',
                  userType: 'merchant',
                  type: 'merchant',
                  merchantId: payload.id || payload.merchantId
                };
                
                if (basicMerchant.id) {
                  console.log('✅ Basic merchant constructed from token:', basicMerchant);
                  setUser(basicMerchant);
                  localStorage.setItem('currentMerchant', JSON.stringify(basicMerchant));
                  return;
                }
              } else {
                throw new Error(`Invalid token type: ${payload.type}. Expected 'merchant'.`);
              }
            } catch (tokenError) {
              console.error('Error parsing merchant token:', tokenError);
            }
          }

          throw new Error('Failed to initialize merchant data - no valid merchant token found');
        }

      } catch (error) {
        console.error('🏪 Error in merchant initialization:', error);
        setError('Failed to initialize merchant store chat: ' + error.message);
        
        if (error.message?.includes('Authentication') || 
            error.message?.includes('401') || 
            error.message?.includes('403') ||
            error.message?.includes('merchant')) {
          setTimeout(() => {
            window.location.href = '/accounts/sign-in';
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeMerchant();
  }, []);

  // Initialize socket with merchant user data
  const {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    handleTyping,
    on,
    off,
    isUserOnline,
    getTypingUsers,
    connectionError
  } = useSocket(user && user.id && user.userType === 'merchant' ? user : null);

  console.log('🔌 Merchant socket status:', { 
    isConnected, 
    connectionError, 
    merchantReady: !!user?.id,
    userType: user?.userType,
    merchantId: user?.merchantId
  });

  // FIXED: Socket event handlers for merchant handling customer↔store messages
  useEffect(() => {
    if (!socket || !user || !isConnected || user.userType !== 'merchant') {
      console.log('🏪 Skipping socket handlers - merchant not ready');
      return;
    }
  
    console.log('🔌 Setting up MERCHANT socket handlers for customer↔store communication');
  
    // FIXED: Handle customer messages to merchant's stores
    const handleCustomerToStoreMessage = (messageData) => {
      console.log('📨 MERCHANT received customer→store message:', messageData);
      
      // Only handle messages FROM customers TO this merchant's stores
      if ((messageData.sender === 'user' || messageData.sender === 'customer' || messageData.sender_type === 'user')) {
        
        // Add message if it's for the currently selected conversation
        if (selectedCustomer && messageData.conversationId === selectedCustomer.conversationId) {
          console.log('✅ Adding customer→store message to merchant interface');
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.find(msg => msg.id === messageData.id);
            if (exists) return prev;
            
            return [...prev, messageData];
          });
          scrollToBottom();
        }
        
        // CRITICAL: Update customer list with new message
        setCustomers(prev => {
          console.log('🔄 Updating customer list with new message');
          return prev.map(customer => {
            if (customer.id === messageData.conversationId) {
              console.log('✅ Updating customer conversation:', customer.customer?.name);
              return {
                ...customer,
                lastMessage: messageData.text || messageData.content,
                lastMessageTime: messageData.timestamp || 'now',
                unreadCount: (customer.unreadCount || 0) + 1
              };
            }
            return customer;
          });
        });
  
        // Force UI refresh
        setTimeout(() => {
          console.log('🔄 Forcing customer list refresh');
          // Trigger a re-render by updating a timestamp
          setRefreshing(true);
          setTimeout(() => setRefreshing(false), 100);
        }, 100);
      }
    };

    
  
    // Handle general new messages but filter for customer→store
    const handleNewMessage = (messageData) => {
      console.log('📨 MERCHANT received general message:', messageData);
      
      // Call the customer-to-store handler for consistency
      handleCustomerToStoreMessage(messageData);
    };
  
    // Handle new customer↔store conversation notifications
    const handleNewCustomerStoreConversation = (conversationData) => {
      console.log('🆕 MERCHANT received new customer→store conversation:', conversationData);
      
      // Only handle if this conversation is for this merchant's store
      if (conversationData.store?.merchantId === user.merchantId || 
          conversationData.merchantId === user.merchantId) {
        
        const newCustomerChat = {
          id: conversationData.chatId || conversationData.conversationId,
          conversationId: conversationData.chatId || conversationData.conversationId,
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
            name: conversationData.store.name,
            logo: conversationData.store.logo
          },
          lastMessage: conversationData.initialMessage || 'Started a conversation with your store',
          lastMessageTime: 'now',
          unreadCount: conversationData.initialMessage ? 1 : 0,
          online: true
        };
  
        console.log('✅ Adding new customer conversation:', newCustomerChat);
        setCustomers(prev => [newCustomerChat, ...prev]);
      }
    };
  
    // Handle message status updates
    const handleMessageStatusUpdate = ({ messageId, status }) => {
      console.log('📝 MERCHANT received message status update:', messageId, status);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
    };
  
    // Handle messages read events
    const handleMessagesRead = ({ readBy, chatId }) => {
      console.log('📖 Messages read by customer:', readBy, 'in chat:', chatId);
      
      if (selectedCustomer && chatId === selectedCustomer.conversationId) {
        // Mark store messages as read
        setMessages(prev => prev.map(msg => 
          msg.sender === 'store' ? { ...msg, status: 'read' } : msg
        ));
      }
    };
  
    // Subscribe to merchant store events
    const unsubscribers = [
      on('new_customer_to_store_message', handleCustomerToStoreMessage),
      on('new_message', handleNewMessage),
      on('new_customer_store_conversation', handleNewCustomerStoreConversation),
      on('message_status_update', handleMessageStatusUpdate),
      on('messages_read', handleMessagesRead)
    ];
  
    return () => {
      console.log('🧹 Cleaning up merchant store socket handlers');
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [socket, user, isConnected, on, selectedCustomer, setCustomers, setMessages]);
  // Load customer↔store conversations for merchant
  const loadConversations = async () => {
    if (!user || !user.id || user.userType !== 'merchant') {
      console.log('🏪 Cannot load conversations - merchant not ready');
      setError('Merchant user not initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏪 Loading customer↔store conversations for merchant:', user.id);
      
      if (!merchantAuthService.isAuthenticated()) {
        throw new Error('Merchant authentication expired. Please log in again.');
      }

      const response = await merchantChatService.getCustomerConversations();
      console.log('🏪 Customer↔store conversations response:', response);
      
      if (response && response.success) {
        console.log('🏪 Setting customer↔store conversations:', response.data);
        setCustomers(response.data || []);
        console.log(`✅ Loaded ${(response.data || []).length} customer↔store conversations`);
      } else {
        console.error('🏪 API returned success=false:', response?.message);
        setError(response?.message || 'Failed to load customer↔store conversations');
      }
    } catch (error) {
      console.error('🏪 Error loading conversations:', error);
      
      if (error.message?.includes('Authentication') || 
          error.message?.includes('401') || 
          error.message?.includes('403')) {
        setError('Merchant session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/accounts/sign-in';
        }, 2000);
      } else {
        setError('Failed to load store conversations: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load conversations when merchant is ready and connected
  useEffect(() => {
    if (user && user.id && user.userType === 'merchant' && isConnected) {
      console.log('🏪 Merchant and socket ready for store chat, loading conversations...');
      loadConversations();
    }
  }, [user, isConnected]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadConversations();
      
      if (selectedCustomer) {
        await loadMessages(selectedCustomer.conversationId);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setError(null);
      console.log('📨 Loading customer↔store messages for conversation:', conversationId);
      
      const response = await merchantChatService.getCustomerMessages(conversationId);
      console.log('📨 Customer↔store messages response:', response);
      
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

  const handleCustomerSelect = (customer) => {
    console.log('👤 Merchant selecting customer conversation:', customer.customer?.name);
    
    if (selectedCustomer) {
      leaveConversation(selectedCustomer.conversationId);
    }

    const customerData = {
      ...customer,
      conversationId: customer.id
    };
    
    setSelectedCustomer(customerData);
    joinConversation(customer.id);
    loadMessages(customer.id);
    markAsRead(customer.id);
  };

  const markAsRead = async (conversationId) => {
    try {
      await merchantChatService.markCustomerMessagesAsRead(conversationId);
      
      setCustomers(prev => prev.map(customer =>
        customer.id === conversationId
          ? { ...customer, unreadCount: 0 }
          : customer
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };


// Add this debug button to MerchantChatInterface.jsx
<button
  onClick={async () => {
    console.log('🔍 DEBUGGING API CALLS');
    try {
      console.log('Token:', merchantAuthService.getToken()?.substring(0, 20) + '...');
      const response = await merchantChatService.getCustomerConversations();
      console.log('Direct API response:', response);
      setCustomers(response.data || []);
    } catch (error) {
      console.error('API Debug Error:', error);
      setError('API Debug: ' + error.message);
    }
  }}
  className="px-3 py-1 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
>
  🔍 Debug API
</button>

  // FIXED: Send message as store to customer
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedCustomer || sendingMessage) return;

    const messageText = message.trim();
    
    try {
      setSendingMessage(true);
      setError(null);
      setMessage('');

      console.log('📤 MERCHANT sending message AS STORE to customer:', {
        chatId: selectedCustomer.conversationId,
        customer: selectedCustomer.customer?.name,
        store: user.storeName || 'Store',
        content: messageText,
        messageType: 'store_to_customer'
      });

      const response = await merchantChatService.replyToCustomer(
        selectedCustomer.conversationId,
        messageText,
        'text'
      );

      if (response.success) {
        console.log('✅ Store message to customer sent successfully');
        
        // Add the message to the merchant's view as a store message
        const newMessage = {
          id: response.data.id || `temp-${Date.now()}`,
          text: messageText,
          sender: 'store', // FIXED: Message is from store, not merchant
          sender_type: 'store',
          senderInfo: {
            id: user.storeId || user.id,
            name: user.storeName || user.name + "'s Store",
            avatar: user.storeInfo?.logo || null,
            isStore: true
          },
          timestamp: 'now',
          status: 'sent',
          messageType: 'text',
          conversationId: selectedCustomer.conversationId
        };

        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
        
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
        throw new Error(response.message || 'Failed to send store message');
      }
    } catch (error) {
      console.error('❌ Failed to send store message to customer:', error);
      setError(`Failed to send store message: ${error.message}`);
      setMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);

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

  // Store quick responses for merchants
  const quickResponses = [
    "Thank you for contacting our store! How can we assist you today?",
    "Your order is being processed at our store and will be ready soon.",
    "We have that item in stock at our store. Would you like us to reserve it for you?",
    "Let me check that for you in our store inventory and get back to you shortly.",
    "Is there anything else our store can help you with today?",
    "Our store hours are Monday to Friday, 9 AM to 6 PM.",
    "You can visit our store or we can arrange delivery for you.",
    "Our store offers free delivery for orders over KES 2,000."
  ];

  const handleQuickResponse = (response) => {
    setMessage(response);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const totalUnreadCount = customers.reduce((total, customer) => total + (customer.unreadCount || 0), 0);
  const typingUsers = selectedCustomer ? getTypingUsers(selectedCustomer.conversationId) : [];

  // Connection status component
  const ConnectionStatus = () => {
    const getStatus = () => {
      if (!user?.id) return { color: 'text-yellow-600', bg: 'bg-yellow-500', text: 'Initializing...' };
      if (user?.userType !== 'merchant') return { color: 'text-red-600', bg: 'bg-red-500', text: 'Invalid User Type' };
      if (!isConnected && connectionError) return { color: 'text-red-600', bg: 'bg-red-500', text: 'Connection Failed' };
      if (!isConnected) return { color: 'text-orange-600', bg: 'bg-orange-500', text: 'Connecting...' };
      return { color: 'text-green-600', bg: 'bg-green-500', text: 'Store Online' };
    };

    const status = getStatus();
    
    return (
      <div className={`flex items-center gap-2 text-sm ${status.color}`}>
        <div className={`w-2 h-2 rounded-full ${status.bg}`}></div>
        {status.text}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading merchant store chat...</p>
            {user && (
              <div className="text-sm text-gray-500 mt-2">
                <p>Merchant: {user.name}</p>
                <p>Store: {user.storeName || 'Loading...'}</p>
                <p>Type: {user.userType}</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (user && user.userType !== 'merchant') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Store Access Required</h2>
            <p className="text-gray-600 mb-4">
              This page is only accessible to store merchants.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Current user type: {user.userType || 'unknown'}
            </p>
            <button
              onClick={() => window.location.href = '/accounts/sign-in'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Go to Merchant Login
            </button>
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
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-500" />
                Store Customer Chat
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-500">Managing conversations for {user?.storeName || 'your store'}</p>
                <ConnectionStatus />
                {user && (
                  <span className="text-xs text-gray-400">
                    {user.storeName ? `Store: ${user.storeName}` : `Merchant: ${user.name}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {totalUnreadCount > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {totalUnreadCount} unread customer message{totalUnreadCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing || !user?.id || user?.userType !== 'merchant'}
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
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">No customer conversations</p>
                    <p className="text-sm">Customer messages will appear here</p>
                    {!isConnected && (
                      <p className="text-xs text-red-500 mt-1">Store offline</p>
                    )}
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
                        src={customer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.customer?.name || 'Customer')}&background=random`}
                        alt={customer.customer?.name || 'Customer'}
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
                            <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                        <div className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span>{customer.store?.name || 'Store'}</span>
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
                {/* Customer Chat Header */}
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
                        src={selectedCustomer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer?.name || 'Customer')}&background=random`}
                        alt={selectedCustomer.customer?.name || 'Customer'}
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
                        <h2 className="font-semibold text-gray-900">{selectedCustomer.customer?.name || 'Customer'}</h2>
                        {selectedCustomer.customer?.priority === 'vip' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">VIP</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {isUserOnline(selectedCustomer.customer?.id) ? 'Online' : 'Last seen recently'} • 
                        {selectedCustomer.customer?.orderCount || 0} orders • 
                        Chatting with {selectedCustomer.store?.name || 'your store'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-xs text-gray-500">
                      <div>Responding as:</div>
                      <div className="font-medium text-blue-600 flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        {selectedCustomer.store?.name || user?.storeName || 'Store'}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="w-5 h-5 text-gray-600" />
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
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Customer Service Chat</p>
                        <p className="text-sm">Respond as {selectedCustomer.store?.name || 'your store'} to help {selectedCustomer.customer?.name || 'this customer'}</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === 'store' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className="flex items-end space-x-2 max-w-xs md:max-w-md lg:max-w-lg">
                          {/* Customer avatar for customer messages */}
                          {(msg.sender === 'user' || msg.sender === 'customer') && (
                            <img
                              src={selectedCustomer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer?.name || 'Customer')}&background=random`}
                              alt="Customer"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              msg.sender === 'store'
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                              }`}
                          >
                            {/* Store name for store messages */}
                            {msg.sender === 'store' && (
                              <div className="flex items-center gap-1 mb-1">
                                <Store className="w-3 h-3 text-blue-100" />
                                <span className="text-xs font-medium text-blue-100">
                                  {selectedCustomer.store?.name || user?.storeName || 'Store'}
                                </span>
                              </div>
                            )}
                            
                            {/* Customer name for customer messages */}
                            {(msg.sender === 'user' || msg.sender === 'customer') && (
                              <div className="flex items-center gap-1 mb-1">
                                <User className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">
                                  {selectedCustomer.customer?.name || 'Customer'}
                                </span>
                              </div>
                            )}
                            
                            <p className="text-sm">{msg.text}</p>
                            <div className={`flex items-center justify-end mt-1 space-x-1 ${
                              msg.sender === 'store' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{msg.timestamp}</span>
                              {msg.sender === 'store' && (
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

                          {/* Store avatar for store messages */}
                          {msg.sender === 'store' && (
                            <img
                              src={selectedCustomer.store?.logo || user?.storeInfo?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.store?.name || 'Store')}&background=2563eb&color=ffffff`}
                              alt="Store"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="flex items-center space-x-2">
                        <img
                          src={selectedCustomer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer?.name || 'Customer')}&background=random`}
                          alt="Customer"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="bg-gray-200 px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Responses for Store */}
                <div className="bg-white p-3 border-t border-gray-100">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {quickResponses.map((response, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickResponse(response)}
                        className="flex-shrink-0 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-full transition-colors whitespace-nowrap"
                        title="Store quick response"
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
                      <div className="absolute top-2 left-3 flex items-center gap-1 text-xs text-gray-500">
                        <Store className="w-3 h-3" />
                        <span>Replying as {selectedCustomer.store?.name || user?.storeName || 'Store'}</span>
                      </div>
                      <textarea
                        value={message}
                        onChange={handleMessageChange}
                        onKeyPress={handleKeyPress}
                        placeholder={`Type your store response to ${selectedCustomer.customer?.name || 'customer'}...`}
                        rows={1}
                        disabled={sendingMessage || !isConnected}
                        className="w-full px-4 pt-8 pb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 disabled:bg-gray-100"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendingMessage || !isConnected}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                      title={!isConnected ? 'Store offline' : 'Send store response'}
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-orange-500 mt-1">Store is offline - reconnecting...</p>
                  )}
                </div>
              </>
            ) : (
              /* Welcome Screen */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-12 h-12 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Store Customer Support</h2>
                  <p className="text-gray-600 max-w-md mb-4">
                    Select a customer from the sidebar to start providing store support. You'll be responding as your store to help customers.
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
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{customers.length} conversations</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Store className="w-4 h-4 text-green-500" />
                      <span>{customers.filter(c => isUserOnline(c.customer?.id)).length} online</span>
                    </div>
                  </div>
                  
                  {user?.storeName && (
                    <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Managing conversations for: <span className="font-medium">{user.storeName}</span>
                      </p>
                    </div>
                  )}
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