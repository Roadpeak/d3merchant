import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
// ✅ FIXED: Changed from dynamic import to static import
import merchantServiceRequestService from '../../services/merchantServiceRequestService';
import io from 'socket.io-client';

// Simple SVG Icons (keeping the same as before)
const Search = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MapPin = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const User = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Clock = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const DollarSign = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const MessageSquare = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const Filter = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </svg>
);

const Store = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const TrendingUp = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const CheckCircle = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircle = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const Phone = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 dark:border-red-400"></div>
  </div>
);

const InfoBox = ({ type, message, onClose }) => (
  <div className={`border rounded-lg p-4 mb-6 ${type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' :
      type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300' :
        'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
    }`}>
    <div className="flex justify-between items-start">
      <p>{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ×
        </button>
      )}
    </div>
  </div>
);

export default function MerchantServiceRequestDashboard() {
  // Refs
  const socketRef = useRef(null);

  // Core state
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [merchantStores, setMerchantStores] = useState([]);

  // Socket state
  const [newRequestNotification, setNewRequestNotification] = useState(null);

  // Data state
  const [dashboardStats, setDashboardStats] = useState({
    totalOffers: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    rejectedOffers: 0,
    totalEarnings: 0,
    activeStores: 0,
    acceptanceRate: 0
  });
  const [serviceRequests, setServiceRequests] = useState([]);
  const [merchantOffers, setMerchantOffers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Modal states
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    budget: 'all',
    timeline: 'all',
    location: '',
    page: 1,
    limit: 20
  });

  // Form states
  const [offerForm, setOfferForm] = useState({
    storeId: '',
    quotedPrice: '',
    message: '',
    availability: '',
    estimatedDuration: '',
    includesSupplies: false
  });

  // ✅ FIXED: Load service requests for merchants using correct endpoint
  const loadServiceRequests = async () => {
    try {
      console.log('📊 Loading service requests for merchant...');

      // ✅ FIXED: Using static import instead of dynamic import
      const response = await merchantServiceRequestService.getServiceRequestsForMerchant(filters);

      if (response && response.success) {
        console.log('✅ Loaded service requests from API:', response.data.requests.length);
        setServiceRequests(response.data.requests);

        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }

        return response.data.requests;
      } else {
        throw new Error(response?.message || 'Failed to load service requests');
      }
    } catch (err) {
      console.error('💥 Error loading service requests:', err);
      setError(`Failed to load service requests: ${err.message}`);
      setServiceRequests([]);
      return [];
    }
  };

  // ✅ FIXED: Load merchant's stores
  const loadMerchantStores = async () => {
    try {
      console.log('🏪 Loading merchant stores...');

      // ✅ FIXED: Using static import instead of dynamic import
      const response = await merchantServiceRequestService.getMerchantStores();

      if (response && response.success) {
        console.log('✅ Loaded merchant stores:', response.data?.stores?.length || 0);
        setMerchantStores(response.data?.stores || []);
        return response.data?.stores || [];
      } else {
        throw new Error(response?.message || 'Failed to load merchant stores');
      }
    } catch (err) {
      console.error('💥 Error loading merchant stores:', err);
      console.warn('⚠️ Using empty store data');
      setMerchantStores([]);
      return [];
    }
  };

  // ✅ FIXED: Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      console.log('📊 Loading dashboard statistics...');

      // ✅ FIXED: Using static import instead of dynamic import
      const response = await merchantServiceRequestService.getDashboardStats();

      if (response && response.success) {
        console.log('✅ Loaded dashboard stats:', response.data);
        setDashboardStats(response.data);
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to load dashboard stats');
      }
    } catch (err) {
      console.error('💥 Error loading dashboard stats:', err);
      console.warn('⚠️ Using default dashboard stats');
    }
  };

  // ✅ FIXED: Load merchant offers
  const loadMerchantOffers = async () => {
    try {
      console.log('📤 Loading merchant offers...');

      // ✅ FIXED: Using static import instead of dynamic import
      const response = await merchantServiceRequestService.getMerchantOffers();

      if (response && response.success) {
        console.log('✅ Loaded merchant offers:', response.data?.offers?.length || 0);
        setMerchantOffers(response.data?.offers || []);
        return response.data?.offers || [];
      } else {
        throw new Error(response?.message || 'Failed to load merchant offers');
      }
    } catch (err) {
      console.error('💥 Error loading merchant offers:', err);
      setMerchantOffers([]);
      return [];
    }
  };

  // Authentication check and initialization
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔧 Initializing Merchant Dashboard...');

        // Check authentication
        const isAuth = merchantAuthService.isAuthenticated();
        console.log('🔐 Authentication status:', isAuth);

        if (!isAuth) {
          console.log('❌ User not authenticated, redirecting to login...');
          merchantAuthService.logout();
          return;
        }

        setIsAuthenticated(true);

        // Get current merchant
        const merchant = merchantAuthService.getCurrentMerchant();
        console.log('👤 Current merchant:', merchant);
        setCurrentMerchant(merchant);

        if (!merchant) {
          throw new Error('No merchant data found. Please log in again.');
        }

        // Load all dashboard data
        await loadDashboardData();

      } catch (err) {
        console.error('💥 Dashboard initialization error:', err);
        setError(err.message || 'Failed to initialize dashboard');

        // If it's an auth error, redirect to login
        if (err.message?.includes('log in') || err.message?.includes('authenticate')) {
          setTimeout(() => merchantAuthService.logout(), 2000);
        }
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    if (!initialized) {
      initializeDashboard();
    }
  }, [initialized]);

  // Reload data when filters change
  useEffect(() => {
    if (initialized && isAuthenticated) {
      loadServiceRequests();
    }
  }, [filters, initialized, isAuthenticated]);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    if (isAuthenticated && currentMerchant && merchantStores.length > 0) {
      const wsUrl = process.env.REACT_APP_WS_URL || 'https://api.discoun3ree.com';
      const token = merchantAuthService.getToken();

      if (!token) {
        console.error('❌ No token found for Socket.IO connection');
        return;
      }

      socketRef.current = io(wsUrl, {
        auth: { token, userId: currentMerchant.id, userType: 'merchant' },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket.IO connected for merchant');

        // Join category rooms for each merchant store
        merchantStores.forEach(store => {
          const categoryRoom = `category:${store.category}`;
          socketRef.current.emit('join', categoryRoom);
          console.log(`📡 Joined category room: ${categoryRoom}`);
        });
      });

      // Listen for new service requests matching merchant's categories
      socketRef.current.on('service-request:new', (data) => {
        console.log('🔔 New service request notification:', data);
        setNewRequestNotification(data);

        // Auto-reload service requests to show the new one
        loadServiceRequests();

        // Clear notification after 5 seconds
        setTimeout(() => setNewRequestNotification(null), 5000);
      });

      // Listen for offer acceptance
      socketRef.current.on('offer:accepted', (data) => {
        console.log('✅ Offer accepted notification:', data);

        // Reload offers and stats
        Promise.all([
          loadMerchantOffers(),
          loadDashboardStats()
        ]);

        alert(`Great news! Your offer for request #${data.requestId} has been accepted!`);
      });

      return () => {
        if (socketRef.current) {
          console.log('Disconnecting Socket.IO...');
          socketRef.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, currentMerchant, merchantStores]);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading all dashboard data...');

      // Load all data in parallel
      const [stores, requests, offers, stats] = await Promise.allSettled([
        loadMerchantStores(),
        loadServiceRequests(),
        loadMerchantOffers(),
        loadDashboardStats()
      ]);

      // Log results
      console.log('📊 Dashboard data loaded:', {
        stores: stores.status === 'fulfilled' ? stores.value?.length : 'failed',
        requests: requests.status === 'fulfilled' ? requests.value?.length : 'failed',
        offers: offers.status === 'fulfilled' ? offers.value?.length : 'failed',
        stats: stats.status === 'fulfilled' ? 'loaded' : 'failed'
      });

    } catch (err) {
      console.error('💥 Error loading dashboard data:', err);
    }
  };

  // ✅ NEW: Handle contacting customer (fetch phone and initiate call)
  const handleContactCustomer = async (offer) => {
    try {
      console.log('📞 Fetching customer contact for offer:', offer.id);

      // Get customer phone number from the offer or request details
      const customerPhone = offer.customerPhone || offer.customerContact;

      if (customerPhone) {
        // Format the phone number for calling
        const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+254${customerPhone.replace(/^0/, '')}`;
        
        console.log('📞 Calling customer:', formattedPhone);
        
        // Initiate phone call
        window.location.href = `tel:${formattedPhone}`;
      } else {
        // If phone not in offer, fetch from service request details
        console.log('📞 Fetching customer details from request:', offer.requestId);
        
        const response = await merchantServiceRequestService.getServiceRequestDetails(offer.requestId);
        
        if (response && response.success && response.data) {
          const customerPhone = response.data.customerPhone || response.data.customer?.phone;
          
          if (customerPhone) {
            const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+254${customerPhone.replace(/^0/, '')}`;
            console.log('📞 Calling customer:', formattedPhone);
            window.location.href = `tel:${formattedPhone}`;
          } else {
            alert('Customer phone number not available. Please contact through the platform messaging system.');
          }
        } else {
          throw new Error('Failed to fetch customer contact details');
        }
      }
    } catch (err) {
      console.error('💥 Error contacting customer:', err);
      alert('Failed to retrieve customer contact information. Please try again.');
    }
  };

  // ✅ FIXED: Submit STORE offer (not individual merchant offer)
  const handleOfferFormSubmit = async () => {
    setSubmitting(true);

    try {
      console.log('📤 Submitting STORE offer for request:', selectedRequest.id);

      // Validate required fields
      if (!offerForm.storeId || !offerForm.quotedPrice || !offerForm.message || !offerForm.availability) {
        throw new Error('Please fill in all required fields');
      }

      // Validate price
      const price = parseFloat(offerForm.quotedPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      // ✅ FIXED: Using static import instead of dynamic import
      // Validate offer data
      const validationErrors = merchantServiceRequestService.validateOfferData(offerForm);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      // Get selected store details for logging
      const selectedStore = merchantStores.find(store => store.id === offerForm.storeId);
      console.log('📋 Submitting STORE offer data:', {
        requestId: selectedRequest.id,
        storeId: offerForm.storeId,
        storeName: selectedStore?.name,
        storeCategory: selectedStore?.category,
        quotedPrice: price,
        requestCategory: selectedRequest.category
      });

      // ✅ CRITICAL: Verify store category matches request category
      if (selectedStore && selectedStore.category !== selectedRequest.category) {
        throw new Error(`Your store category "${selectedStore.category}" does not match the request category "${selectedRequest.category}"`);
      }

      const result = await merchantServiceRequestService.createStoreOffer(selectedRequest.id, {
        storeId: offerForm.storeId,
        quotedPrice: price,
        message: offerForm.message.trim(),
        availability: offerForm.availability.trim(),
        estimatedDuration: offerForm.estimatedDuration.trim() || null,
        includesSupplies: offerForm.includesSupplies
      });

      if (result && result.success) {
        console.log('✅ Store offer submitted successfully');

        // Reset form and close modal
        setShowOfferForm(false);
        setOfferForm({
          storeId: '',
          quotedPrice: '',
          message: '',
          availability: '',
          estimatedDuration: '',
          includesSupplies: false
        });
        setSelectedRequest(null);

        // Refresh data
        await Promise.all([
          loadMerchantOffers(),
          loadDashboardStats(),
          loadServiceRequests()
        ]);

        alert(`Store offer submitted successfully! Your store "${selectedStore?.name}" has offered $${price} for this service request.`);
      } else {
        throw new Error(result?.message || 'Failed to submit store offer');
      }
    } catch (err) {
      console.error('💥 Store offer submission error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Event handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getTimelineLabel = (timeline) => {
    const timelineMap = {
      'urgent': 'ASAP/Urgent',
      'thisweek': 'This Week',
      'nextweek': 'Next Week',
      'thismonth': 'This Month',
      'flexible': 'Flexible'
    };
    return timelineMap[timeline] || timeline;
  };

  const getUrgencyBadge = (urgency) => {
    const configs = {
      'IMMEDIATE': { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700', label: '🔥 IMMEDIATE', icon: '⚡' },
      'SCHEDULED': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700', label: '📅 SCHEDULED', icon: '📅' },
      'CHECK_LATER': { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600', label: '🕐 CHECK LATER', icon: '🕐' }
    };
    const config = configs[urgency] || configs['CHECK_LATER'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const configs = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'accepted': { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      'withdrawn': { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' }
    };
    const config = configs[status] || configs['pending'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Calculate if price is within budget
  const isPriceInBudget = (quotedPrice, request) => {
    const price = parseFloat(quotedPrice);
    const budgetMin = request.budgetMin || 0;
    const budgetMax = request.budgetMax || 999999;
    return price >= budgetMin && price <= budgetMax;
  };

  // ✅ NEW: Filter stores by request category
  const getEligibleStores = (requestCategory) => {
    return merchantStores.filter(store => store.category === requestCategory);
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Merchant Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in as a merchant to access the service request dashboard.
            </p>
            <button
              onClick={() => merchantAuthService.logout()}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium"
            >
              Login as Merchant
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
          <p className="text-center text-gray-600 mt-4">Loading merchant dashboard...</p>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <InfoBox
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
          <div className="text-center">
            <button
              onClick={() => {
                setError(null);
                setInitialized(false);
              }}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium mr-4"
            >
              Retry
            </button>
            <button
              onClick={() => merchantAuthService.logout()}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Merchant Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage service requests and offers for your stores</p>

                {currentMerchant && (
                  <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Welcome, {currentMerchant.first_name} {currentMerchant.last_name} ({currentMerchant.email_address})
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {merchantStores.length > 0 && (
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Store className="w-4 h-4" />
                    <span>{merchantStores.length} store{merchantStores.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {[...new Set(merchantStores.map(s => s.category))].join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Available Requests</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{serviceRequests.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">Matching your store categories</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Your Store Offers</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{merchantOffers.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">Total sent</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.acceptanceRate || 0}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">Offer acceptance</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">KSH {dashboardStats.totalEarnings?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">From completed services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Categories Info */}
          {merchantStores.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-300">
                  Your Store Categories: {[...new Set(merchantStores.map(s => s.category))].join(', ')}
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Only showing service requests that match your store categories. Total requests: {pagination.totalCount}
              </p>
            </div>
          )}

          {/* No Stores Warning */}
          {merchantStores.length === 0 && (
            <InfoBox
              type="warning"
              message="You don't have any active stores yet. Create a store to start receiving service requests that match your business categories!"
            />
          )}

          {/* Tabs */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTabChange('requests')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${activeTab === 'requests' ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
              >
                Available Requests ({serviceRequests.length})
              </button>
              <button
                onClick={() => handleTabChange('offers')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${activeTab === 'offers' ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
              >
                My Store Offers ({merchantOffers.length})
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {activeTab === 'requests' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Filters:</span>
                </div>

                <select
                  value={filters.budget}
                  onChange={(e) => handleFilterChange('budget', e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                >
                  <option value="0-1000">KSH 0 - 1000</option>
                  <option value="1000-10000">KSH 1000 - 10000</option>
                  <option value="10000-50000">KSH 10000 - 50000</option>
                  <option value="50000+">KSH 50000+</option>
                </select>

                <select
                  value={filters.timeline}
                  onChange={(e) => handleFilterChange('timeline', e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                >
                  <option value="all">All Timelines</option>
                  <option value="urgent">ASAP/Urgent</option>
                  <option value="thisweek">This Week</option>
                  <option value="nextweek">Next Week</option>
                  <option value="thismonth">This Month</option>
                  <option value="flexible">Flexible</option>
                </select>

                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full sm:w-48 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                />
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4 sm:space-y-6">
              {serviceRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl mb-4">No service requests available</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
                    {merchantStores.length === 0
                      ? 'Create stores first to start receiving service requests that match your business categories.'
                      : 'Check back later for new service requests matching your store categories.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {serviceRequests.map((request) => {
                    const eligibleStores = getEligibleStores(request.category);
                    const isImmediate = request.urgency === 'IMMEDIATE';
                    return (
                      <div key={request.id} className={`rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                        isImmediate
                          ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-300 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="p-4 sm:p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                                {request.urgency && getUrgencyBadge(request.urgency)}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                    request.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  }`}>
                                  {request.priority}
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                  {request.status.toUpperCase()}
                                </span>
                                {request.verified && (
                                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                    ✓ Verified User
                                  </span>
                                )}
                                {request.merchantOffered && (
                                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs px-2 py-1 rounded-full">
                                    Store Already Offered
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm sm:text-base">{request.description}</p>

                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{request.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span className="font-medium text-green-600 dark:text-green-400">{request.budget}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{getTimelineLabel(request.timeline)}</span>
                                </div>
                                {request.urgency === 'SCHEDULED' && request.scheduledDateTime && (
                                  <div className="flex items-center space-x-1 font-medium text-blue-600 dark:text-blue-400">
                                    <Clock className="w-4 h-4" />
                                    <span>📅 {new Date(request.scheduledDateTime).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span>by {request.postedBy}</span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{request.postedTime}</span>
                                  <div className="flex items-center space-x-2">
                                    <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    <span className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                                      {request.offers} offer{request.offers !== 1 ? 's' : ''} received
                                    </span>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                    {request.category}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="px-3 sm:px-4 py-2 border border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm transition-colors"
                                    onClick={() => {
                                      alert('View Details functionality would show full request details');
                                    }}
                                  >
                                    View Details
                                  </button>
                                  {eligibleStores.length > 0 && !request.merchantOffered && (
                                    <button
                                      onClick={() => {
                                        setSelectedRequest(request);
                                        setOfferForm(prev => ({
                                          ...prev,
                                          storeId: eligibleStores[0]?.id || '',
                                          quotedPrice: ''
                                        }));
                                        setShowOfferForm(true);
                                      }}
                                      className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm transition-colors"
                                      disabled={request.status !== 'open'}
                                    >
                                      Send Store Offer
                                    </button>
                                  )}
                                  {eligibleStores.length === 0 && (
                                    <span className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
                                      No eligible stores
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {request.requirements && request.requirements.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mr-2">Requirements:</span>
                              {request.requirements.map((req, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                  {req}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* ✅ NEW: Show eligible stores for this request */}
                          {eligibleStores.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mr-2">Your eligible stores:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {eligibleStores.map((store) => (
                                  <span key={store.id} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                    🏪 {store.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-6 sm:mt-8">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* My Store Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-4 sm:space-y-6">
              {merchantOffers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl mb-4">No store offers yet</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">Your store offers will appear here once you start submitting them.</p>
                  <button
                    onClick={() => handleTabChange('requests')}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium transition-colors"
                  >
                    Browse Requests
                  </button>
                </div>
              ) : (
                merchantOffers.map((offer) => (
                  <div key={offer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{offer.requestTitle}</h3>
                            {getStatusBadge(offer.status)}
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                              {offer.requestCategory}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center space-x-1">
                              <Store className="w-4 h-4" />
                              <span className="font-medium">🏪 {offer.storeName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>Customer: {offer.customerName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{offer.requestLocation}</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                              <div>
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Store Quote:</span>
                                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">KSH {offer.quotedPrice}</p>
                              </div>
                              <div className="sm:text-right">
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Customer Budget:</span>
                                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{offer.requestBudget}</p>
                              </div>
                            </div>
                            <div className="mb-2">
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Availability:</span>
                              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{offer.availability}</p>
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Store Message:</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{offer.message}"</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              Submitted {offer.submittedAt}
                            </div>
                            <div className="flex space-x-2">
                              {offer.status === 'accepted' && (
                                <button
                                  onClick={() => handleContactCustomer(offer)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center gap-2 transition-colors text-sm"
                                >
                                  <Phone className="w-4 h-4" />
                                  Call Customer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ✅ ENHANCED: Store-Based Offer Form Modal */}
        {showOfferForm && selectedRequest && (
          <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Send Store Offer</h2>
                  <button onClick={() => setShowOfferForm(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl">
                    ×
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Store offer for: <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.title}</span></p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Customer Budget: <span className="font-medium text-green-600 dark:text-green-400">{selectedRequest.budget}</span></p>
                  <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Category: <span className="font-medium">{selectedRequest.category}</span></p>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* ✅ FIXED: Store Selection - Only show stores that match request category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Store *</label>
                  <select
                    value={offerForm.storeId}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, storeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                    required
                  >
                    <option value="">Choose a store...</option>
                    {getEligibleStores(selectedRequest.category).map(store => (
                      <option key={store.id} value={store.id}>
                        🏪 {store.name} ({store.category})
                      </option>
                    ))}
                  </select>
                  {getEligibleStores(selectedRequest.category).length === 0 && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">
                      No stores available for "{selectedRequest.category}" category. Create a store in this category first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quoted Price * (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={offerForm.quotedPrice}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, quotedPrice: e.target.value }))}
                      placeholder="Enter your store's price quote"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                      required
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Customer budget: {selectedRequest.budget}</span>
                    {offerForm.quotedPrice && (
                      <span className={`font-medium ${isPriceInBudget(offerForm.quotedPrice, selectedRequest)
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                        }`}>
                        {isPriceInBudget(offerForm.quotedPrice, selectedRequest)
                          ? '✓ Within budget'
                          : '⚠ Outside budget range'
                        }
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Message * (Pitch your store's services)</label>
                  <textarea
                    rows="4"
                    value={offerForm.message}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your store's offer, experience, and why your store is the best choice for this job. Mention your store's qualifications, past work, and what makes your store stand out..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                    required
                    minLength="10"
                    maxLength="1000"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {offerForm.message.length}/1000 characters (minimum 10 required)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability *</label>
                  <input
                    type="text"
                    value={offerForm.availability}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, availability: e.target.value }))}
                    placeholder="When can your store start? (e.g., Tomorrow at 2 PM, This weekend, Next Monday)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                    required
                    maxLength="200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Customer timeline: {getTimelineLabel(selectedRequest.timeline)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estimated Duration</label>
                  <input
                    type="text"
                    value={offerForm.estimatedDuration}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="How long will the service take? (e.g., 2-3 hours, Half day, 2 days)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includesSupplies"
                    checked={offerForm.includesSupplies}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, includesSupplies: e.target.checked }))}
                    className="mr-2 w-4 h-4 text-red-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500 dark:focus:ring-red-400"
                  />
                  <label htmlFor="includesSupplies" className="text-sm text-gray-700 dark:text-gray-300">
                    Price includes all supplies and materials needed
                  </label>
                </div>

                {selectedRequest.requirements && selectedRequest.requirements.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Customer Requirements:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.requirements.map((req, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          {req}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Make sure your store meets these requirements before submitting the offer.
                    </p>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowOfferForm(false)}
                    className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleOfferFormSubmit}
                    className="w-full sm:w-auto px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium transition-colors"
                    disabled={submitting || !offerForm.storeId || !offerForm.quotedPrice || !offerForm.message || !offerForm.availability || getEligibleStores(selectedRequest.category).length === 0}
                  >
                    {submitting ? 'Sending Store Offer...' : 'Send Store Offer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}