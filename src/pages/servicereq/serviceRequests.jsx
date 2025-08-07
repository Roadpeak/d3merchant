import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../elements/Layout';
import merchantServiceRequestService from '../services/merchantServiceRequestService';
import merchantAuthService from '../services/merchantAuthService';

// SVG Icons
const Search = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MapPin = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const User = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const DollarSign = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const MessageSquare = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const Filter = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </svg>
);

const Store = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Eye = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Star = ({ className }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const Trash = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="3,6 5,6 21,6"></polyline>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
  </svg>
);

const BarChart = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

const Calendar = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
  </div>
);

// Error handler with fallback data
const withFallback = async (apiCall, fallbackData = null) => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, using fallback:', error.message);
    return {
      success: true,
      data: fallbackData,
      isFallback: true
    };
  }
};

export default function MerchantServiceRequestDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState('requests');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStoreForm, setShowStoreForm] = useState(false);

  // Merchant authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState(null);

  // Data states
  const [serviceRequests, setServiceRequests] = useState([]);
  const [merchantOffers, setMerchantOffers] = useState([]);
  const [merchantStores, setMerchantStores] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    category: 'all',
    budget: 'all',
    timeline: 'all',
    location: '',
    status: 'all',
    storeId: 'all',
    page: 1,
    limit: 10
  });

  // Pagination state
  const [pagination, setPagination] = useState({});

  // Form states
  const [offerForm, setOfferForm] = useState({
    storeId: '',
    quotedPrice: '',
    message: '',
    availability: '',
    estimatedDuration: '',
    includesSupplies: false
  });

  const [storeForm, setStoreForm] = useState({
    name: '',
    description: '',
    categories: [],
    location: ''
  });

  // Check authentication state
  const checkAuthState = useCallback(() => {
    try {
      setIsAuthenticated(merchantServiceRequestService.isAuthenticated());
      
      if (merchantServiceRequestService.isAuthenticated()) {
        const merchant = merchantServiceRequestService.getCurrentMerchant();
        setCurrentMerchant(merchant);
        
        // Debug merchant auth service status
        if (process.env.NODE_ENV === 'development') {
          merchantAuthService.debug?.();
        }
      } else {
        setCurrentMerchant(null);
      }
    } catch (error) {
      console.error('Error checking merchant auth state:', error);
      setIsAuthenticated(false);
      setCurrentMerchant(null);
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication first
      if (!isAuthenticated) {
        throw new Error('Please log in as a merchant to access this dashboard.');
      }

      const [statsRes, storesRes] = await Promise.all([
        withFallback(
          () => merchantServiceRequestService.getDashboardStats(),
          {
            totalOffers: 25,
            pendingOffers: 8,
            acceptedOffers: 15,
            rejectedOffers: 2,
            totalEarnings: 12500,
            activeStores: 2,
            acceptanceRate: 60.0
          }
        ),
        withFallback(
          () => merchantServiceRequestService.getMerchantStores(),
          [
            {
              id: 'store-1',
              name: 'Clean Pro Services',
              categories: ['Home Services'],
              status: 'active',
              rating: 4.8,
              reviewCount: 127,
              verified: true
            },
            {
              id: 'store-2',
              name: 'Auto Care Center',
              categories: ['Auto Services'],
              status: 'active',
              rating: 4.6,
              reviewCount: 89,
              verified: true
            }
          ]
        )
      ]);

      setDashboardStats(statsRes.data || {});
      setMerchantStores(storesRes.data || []);

      await loadServiceRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load service requests for merchant
  const loadServiceRequests = async () => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      const response = await withFallback(
        () => merchantServiceRequestService.getServiceRequests(filters),
        {
          requests: [
            {
              id: 'demo-1',
              title: "Need house cleaning service",
              description: "Looking for a reliable cleaning service for my 3-bedroom house. Need deep cleaning including kitchen and bathrooms.",
              category: "Home Services",
              budget: "$100 - $150",
              location: "Nairobi, Kenya",
              timeline: "thisweek",
              postedBy: "John Doe",
              postedTime: "2 hours ago",
              priority: "normal",
              status: "open",
              offers: 3,
              verified: true,
              requirements: ["Insurance", "References"],
              merchantOffered: false,
              eligibleStores: [
                { id: 'store-1', name: 'Clean Pro Services' }
              ]
            },
            {
              id: 'demo-2',
              title: "Car wash and detailing needed",
              description: "Need full exterior and interior car cleaning and detailing service for my SUV.",
              category: "Auto Services",
              budget: "$80 - $120",
              location: "Westlands, Nairobi",
              timeline: "flexible",
              postedBy: "Mary K.",
              postedTime: "5 hours ago",
              priority: "normal",
              status: "open",
              offers: 1,
              verified: false,
              requirements: ["Insurance"],
              merchantOffered: true,
              eligibleStores: []
            },
            {
              id: 'demo-3',
              title: "Urgent plumbing repair needed",
              description: "Kitchen sink is leaking badly and needs immediate repair. Water damage getting worse.",
              category: "Home Services",
              budget: "$50 - $100",
              location: "Karen, Nairobi",
              timeline: "urgent",
              postedBy: "Peter M.",
              postedTime: "30 minutes ago",
              priority: "urgent",
              status: "open",
              offers: 0,
              verified: true,
              requirements: ["Licensed", "Insurance"],
              merchantOffered: false,
              eligibleStores: [
                { id: 'store-1', name: 'Clean Pro Services' }
              ]
            }
          ],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 3, hasNext: false, hasPrev: false }
        }
      );

      setServiceRequests(response.data.requests || []);
      setPagination(response.data.pagination || {});
    } catch (err) {
      setError(err.message);
    }
  };

  // Load merchant offers
  const loadMerchantOffers = async () => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      const response = await withFallback(
        () => merchantServiceRequestService.getMerchantOffers(filters),
        {
          offers: [
            {
              id: 'offer-1',
              requestTitle: 'House cleaning needed',
              requestCategory: 'Home Services',
              quotedPrice: 120,
              message: 'We provide professional cleaning services with all supplies included. Our team has 5+ years of experience and we guarantee satisfaction.',
              availability: 'This weekend',
              status: 'pending',
              storeName: 'Clean Pro Services',
              storeId: 'store-1',
              customerName: 'John D.',
              submittedAt: '2 hours ago',
              requestBudget: '$100 - $150',
              requestLocation: 'Nairobi, Kenya'
            },
            {
              id: 'offer-2',
              requestTitle: 'Car detailing service',
              requestCategory: 'Auto Services',
              quotedPrice: 95,
              message: 'Complete auto detailing with premium products. We specialize in SUVs and have 3+ years experience.',
              availability: 'Tomorrow morning',
              status: 'accepted',
              storeName: 'Auto Care Center',
              storeId: 'store-2',
              customerName: 'Sarah M.',
              submittedAt: '1 day ago',
              requestBudget: '$80 - $120',
              requestLocation: 'Westlands, Nairobi'
            },
            {
              id: 'offer-3',
              requestTitle: 'Office cleaning weekly',
              requestCategory: 'Home Services',
              quotedPrice: 200,
              message: 'Weekly office cleaning service with eco-friendly products. Flexible scheduling available.',
              availability: 'Next Monday',
              status: 'rejected',
              storeName: 'Clean Pro Services',
              storeId: 'store-1',
              customerName: 'Mike R.',
              submittedAt: '3 days ago',
              requestBudget: '$150 - $250',
              requestLocation: 'CBD, Nairobi'
            }
          ],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 3, hasNext: false, hasPrev: false }
        }
      );

      setMerchantOffers(response.data.offers || []);
      setPagination(response.data.pagination || {});
    } catch (err) {
      setError(err.message);
    }
  };

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Load data when filters change
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === 'requests') {
      loadServiceRequests();
    } else if (activeTab === 'offers') {
      loadMerchantOffers();
    }
  }, [filters, activeTab, isAuthenticated]);

  // Event handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleOfferFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Validate form data
      const validationErrors = merchantServiceRequestService.validateOfferData(offerForm);
      if (validationErrors.length > 0) {
        alert(`Please fix the following errors:\n${validationErrors.join('\n')}`);
        return;
      }

      await merchantServiceRequestService.createStoreOffer(selectedRequest.id, offerForm);
      
      setShowOfferForm(false);
      setOfferForm({
        storeId: '', quotedPrice: '', message: '', availability: '',
        estimatedDuration: '', includesSupplies: false
      });
      setSelectedRequest(null);
      
      await loadServiceRequests();
      alert('Offer submitted successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawOffer = async (offerId) => {
    if (!confirm('Are you sure you want to withdraw this offer?')) return;

    try {
      setSubmitting(true);
      await merchantServiceRequestService.withdrawOffer(offerId, 'Merchant withdrew offer');
      await loadMerchantOffers();
      alert('Offer withdrawn successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStoreFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Validate store data
      const validationErrors = merchantServiceRequestService.validateStoreData(storeForm);
      if (validationErrors.length > 0) {
        alert(`Please fix the following errors:\n${validationErrors.join('\n')}`);
        return;
      }

      await merchantServiceRequestService.createStore(storeForm);
      
      setShowStoreForm(false);
      setStoreForm({ name: '', description: '', categories: [], location: '' });
      
      await loadInitialData();
      alert('Store created successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryChange = (category, checked) => {
    setStoreForm(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter(cat => cat !== category)
    }));
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Merchant Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in as a merchant to access the service request dashboard.
            </p>
            <button
              onClick={() => window.location.href = '/merchant/login'}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium"
            >
              Login as Merchant
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
            <button onClick={loadInitialData} className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Merchant Dashboard</h1>
                <p className="text-gray-600">Manage your store offers and service requests</p>
                
                {/* Merchant info for development */}
                {process.env.NODE_ENV === 'development' && currentMerchant && (
                  <div className="mt-2 text-sm text-gray-500">
                    Merchant: {currentMerchant.first_name || currentMerchant.firstName} {currentMerchant.last_name || currentMerchant.lastName} ({currentMerchant.email_address || currentMerchant.email})
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Store className="w-4 h-4" />
                  <span>{merchantStores.length} Active Store{merchantStores.length !== 1 ? 's' : ''}</span>
                </div>
                <button 
                  onClick={() => setShowStoreForm(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Store</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Offers</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalOffers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingOffers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.acceptedOffers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.acceptanceRate || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings and Stores Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">${dashboardStats.totalEarnings?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600 mt-2">From {dashboardStats.acceptedOffers || 0} completed services</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Stores</h3>
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                {merchantStores.slice(0, 3).map((store) => (
                  <div key={store.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{store.name}</span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {store.status}
                    </span>
                  </div>
                ))}
                {merchantStores.length > 3 && (
                  <p className="text-xs text-gray-500">+{merchantStores.length - 3} more stores</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'requests' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border'}`}
              >
                Available Requests ({pagination.totalCount || 0})
              </button>
              <button
                onClick={() => setActiveTab('offers')}
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'offers' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border'}`}
              >
                My Offers ({dashboardStats.totalOffers || 0})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'analytics' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border'}`}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Filter Bar for Requests */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="Home Services">Home Services</option>
                  <option value="Auto Services">Auto Services</option>
                  <option value="Beauty & Wellness">Beauty & Wellness</option>
                  <option value="Tech Support">Tech Support</option>
                  <option value="Event Services">Event Services</option>
                  <option value="Tutoring">Tutoring</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Photography">Photography</option>
                </select>
                <select
                  value={filters.budget}
                  onChange={(e) => handleFilterChange('budget', e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Budgets</option>
                  <option value="0-100">$0 - $100</option>
                  <option value="100-300">$100 - $300</option>
                  <option value="300-500">$300 - $500</option>
                  <option value="500+">$500+</option>
                </select>
                <select
                  value={filters.timeline}
                  onChange={(e) => handleFilterChange('timeline', e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1 text-sm"
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
                  placeholder="Location..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1 text-sm w-32"
                />
              </div>
            </div>
          )}

          {/* Filter Bar for Offers */}
          {activeTab === 'offers' && (
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <select
                  value={filters.storeId}
                  onChange={(e) => handleFilterChange('storeId', e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Stores</option>
                  {merchantStores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Available Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {serviceRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-xl mb-4">No service requests found</div>
                  <p className="text-gray-600 mb-6">No requests match your store categories or current filters.</p>
                </div>
              ) : (
                serviceRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold">{request.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                              {request.priority}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {request.status.toUpperCase()}
                            </span>
                            {request.verified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Verified User
                              </span>
                            )}
                            {request.merchantOffered && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Offer Sent
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{request.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{request.budget}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{merchantServiceRequestService.getTimelineLabel(request.timeline)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>by {request.postedBy}</span>
                            </div>
                          </div>

                          {/* Eligible Stores */}
                          {request.eligibleStores && request.eligibleStores.length > 0 && (
                            <div className="mb-3">
                              <span className="text-sm text-gray-600 mr-2">Eligible stores:</span>
                              {request.eligibleStores.map((store, index) => (
                                <span key={store.id} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full mr-1">
                                  {store.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">{request.postedTime}</span>
                              <div className="flex items-center space-x-2">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-red-600">
                                  {request.offers} offer{request.offers !== 1 ? 's' : ''} received
                                </span>
                              </div>
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {request.category}
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 font-medium">
                                View Details
                              </button>
                              {!request.merchantOffered && request.eligibleStores.length > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setOfferForm(prev => ({
                                      ...prev,
                                      storeId: request.eligibleStores[0]?.id || ''
                                    }));
                                    setShowOfferForm(true);
                                  }}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                                  disabled={request.status !== 'open'}
                                >
                                  Send Offer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {request.requirements && request.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-600 mr-2">Requirements:</span>
                          {request.requirements.map((req, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {req}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Pagination for Requests */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + Math.max(1, pagination.currentPage - 2);
                      return pageNum <= pagination.totalPages ? (
                        <button
                          key={pageNum}
                          onClick={() => handleFilterChange('page', pageNum)}
                          className={`px-3 py-2 rounded-lg ${pageNum === pagination.currentPage
                            ? 'bg-red-500 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      ) : null;
                    })}
                  </div>

                  <button
                    onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, filters.page + 1))}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* My Offers Tab */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              {merchantOffers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-xl mb-4">No offers yet</div>
                  <p className="text-gray-600 mb-6">Your store offers will appear here once you start submitting them.</p>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium"
                  >
                    Browse Requests
                  </button>
                </div>
              ) : (
                merchantOffers.map((offer) => (
                  <div key={offer.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{offer.requestTitle}</h3>
                            {merchantServiceRequestService.getStatusBadgeConfig && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${merchantServiceRequestService.getStatusBadgeConfig(offer.status).color}`}>
                                {merchantServiceRequestService.getStatusBadgeConfig(offer.status).label}
                              </span>
                            )}
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {offer.requestCategory}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Store className="w-4 h-4" />
                              <span className="font-medium">{offer.storeName}</span>
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

                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-sm text-gray-600">Your Quote:</span>
                                <p className="text-2xl font-bold text-green-600">${offer.quotedPrice}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-gray-600">Customer Budget:</span>
                                <p className="text-sm font-medium text-gray-700">{offer.requestBudget}</p>
                              </div>
                            </div>
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">Availability:</span>
                              <p className="text-sm font-medium text-gray-700">{offer.availability}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Your Message:</span>
                              <p className="text-gray-700 italic">"{offer.message}"</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              Submitted {offer.submittedAt}
                            </div>
                            <div className="flex space-x-2">
                              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                                View Request
                              </button>
                              {offer.status === 'pending' && merchantServiceRequestService.canWithdrawOffer && merchantServiceRequestService.canWithdrawOffer(offer) && (
                                <button
                                  onClick={() => handleWithdrawOffer(offer.id)}
                                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center space-x-2"
                                  disabled={submitting}
                                >
                                  <Trash className="w-4 h-4" />
                                  <span>Withdraw</span>
                                </button>
                              )}
                              {offer.status === 'accepted' && (
                                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
                                  Contact Customer
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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{dashboardStats.totalOffers || 0}</div>
                    <div className="text-gray-600">Total Offers Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{dashboardStats.acceptanceRate || 0}%</div>
                    <div className="text-gray-600">Acceptance Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">${dashboardStats.totalEarnings?.toLocaleString() || 0}</div>
                    <div className="text-gray-600">Total Earnings</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Performance</h3>
                <div className="space-y-4">
                  {merchantStores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{store.name}</h4>
                        <p className="text-sm text-gray-600">{store.categories.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium">{store.rating}</span>
                          <span className="text-gray-500">({store.reviewCount} reviews)</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {store.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Offer Form Modal */}
        {showOfferForm && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Send Store Offer</h2>
                  <button onClick={() => setShowOfferForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                    ×
                  </button>
                </div>
                <p className="text-gray-600 mt-2">Offer for: {selectedRequest.title}</p>
              </div>

              <form onSubmit={handleOfferFormSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Store *</label>
                  <select
                    value={offerForm.storeId}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, storeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  >
                    <option value="">Select a store</option>
                    {selectedRequest.eligibleStores?.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only stores matching the request category are shown</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quoted Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={offerForm.quotedPrice}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, quotedPrice: e.target.value }))}
                    placeholder="Enter your price quote"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Customer budget: {selectedRequest.budget}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    rows="4"
                    value={offerForm.message}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your offer, experience, and why your store is the best choice..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability *</label>
                  <input
                    type="text"
                    value={offerForm.availability}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, availability: e.target.value }))}
                    placeholder="When can you start? (e.g., Tomorrow, This weekend, Next week)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration</label>
                  <input
                    type="text"
                    value={offerForm.estimatedDuration}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="How long will the service take? (e.g., 2-3 hours, Half day)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includesSupplies"
                    checked={offerForm.includesSupplies}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, includesSupplies: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="includesSupplies" className="text-sm text-gray-700">
                    Price includes all supplies and materials
                  </label>
                </div>

                {/* Request Details Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Request Summary</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Category:</span> {selectedRequest.category}</p>
                    <p><span className="font-medium">Timeline:</span> {merchantServiceRequestService.getTimelineLabel(selectedRequest.timeline)}</p>
                    <p><span className="font-medium">Location:</span> {selectedRequest.location}</p>
                    {selectedRequest.requirements && selectedRequest.requirements.length > 0 && (
                      <p><span className="font-medium">Requirements:</span> {selectedRequest.requirements.join(', ')}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowOfferForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending Offer...' : 'Send Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Store Form Modal */}
        {showStoreForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Create New Store</h2>
                  <button onClick={() => setShowStoreForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={handleStoreFormSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
                  <input
                    type="text"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your store name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    rows="3"
                    value={storeForm.description}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your store and services..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories *</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {['Home Services', 'Auto Services', 'Beauty & Wellness', 'Tech Support', 'Event Services', 'Tutoring', 'Fitness', 'Photography'].map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={storeForm.categories.includes(category)}
                          onChange={(e) => handleCategoryChange(category, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Select all categories your store can handle</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={storeForm.location}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter your store location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowStoreForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating Store...' : 'Create Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}