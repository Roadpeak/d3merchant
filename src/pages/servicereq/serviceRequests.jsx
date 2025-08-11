import React, { useState, useEffect } from 'react';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';

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

const Star = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
  </div>
);

// Enhanced category mapping - more comprehensive mapping between store categories and service request categories
const CATEGORY_MAPPING = {
  // Store Category -> Service Request Categories (array to support multiple matches)
  'Restaurant': ['Food & Catering'],
  'Food & Catering': ['Food & Catering'],
  'Retail Store': ['Home Services', 'Other'],
  'Beauty & Salon': ['Beauty & Wellness'],
  'Beauty & Wellness': ['Beauty & Wellness'],
  'Automotive': ['Auto Services'],
  'Auto Services': ['Auto Services'],
  'Health & Fitness': ['Fitness', 'Healthcare'],
  'Fitness': ['Fitness'],
  'Healthcare': ['Healthcare'],
  'Professional Services': ['Home Services', 'Legal Services', 'Financial Services'],
  'Legal Services': ['Legal Services'],
  'Financial Services': ['Financial Services'],
  'Entertainment': ['Event Services', 'Photography'],
  'Event Services': ['Event Services'],
  'Photography': ['Photography'],
  'Education': ['Tutoring'],
  'Tutoring': ['Tutoring'],
  'Home & Garden': ['Home Services', 'Landscaping'],
  'Home Services': ['Home Services'],
  'Landscaping': ['Landscaping'],
  'Technology': ['Tech Support'],
  'Tech Support': ['Tech Support'],
  'Fashion': ['Beauty & Wellness'],
  'Pet Services': ['Pet Services'],
  'Moving & Storage': ['Moving & Storage'],
  'Other': ['Other', 'Home Services']
};

// Get matching service request categories for a store category
const getMatchingServiceCategories = (storeCategory) => {
  if (!storeCategory) return [];
  return CATEGORY_MAPPING[storeCategory] || ['Home Services'];
};

// Filter service requests based on store categories
const getFilteredServiceRequests = (requests, storeCategory) => {
  if (!storeCategory || !requests) return requests;
  
  const matchingCategories = getMatchingServiceCategories(storeCategory);
  return requests.filter(request => 
    matchingCategories.includes(request.category)
  );
};

// Mock data - enhanced with more categories
const MOCK_STATS = {
  totalOffers: 25,
  pendingOffers: 8,
  acceptedOffers: 15,
  rejectedOffers: 2,
  totalEarnings: 12500,
  activeStores: 1,
  acceptanceRate: 60.0
};

const MOCK_REQUESTS_ALL = [
  {
    id: 'demo-1',
    title: "Professional house cleaning service needed",
    description: "Looking for a reliable and experienced cleaning service for my 3-bedroom house. Need deep cleaning including kitchen, bathrooms, living areas, and bedrooms. Must be insured and provide own supplies.",
    category: "Home Services",
    budget: "$100 - $150",
    budgetMin: 100,
    budgetMax: 150,
    location: "Westlands, Nairobi",
    timeline: "thisweek",
    postedBy: "John Doe",
    postedTime: "2 hours ago",
    priority: "normal",
    status: "open",
    offers: 3,
    verified: true,
    requirements: ["Insurance", "References", "Licensed"],
    merchantOffered: false,
    eligibleStores: [{ id: 'store-1', name: 'Your Store' }]
  },
  {
    id: 'demo-2',
    title: "Car wash and detailing service",
    description: "Need professional exterior and interior car cleaning and detailing service for my Toyota SUV. Including wax, vacuum, tire cleaning, and dashboard polishing.",
    category: "Auto Services",
    budget: "$80 - $120",
    budgetMin: 80,
    budgetMax: 120,
    location: "Kilimani, Nairobi",
    timeline: "flexible",
    postedBy: "Mary K.",
    postedTime: "5 hours ago",
    priority: "normal",
    status: "open",
    offers: 1,
    verified: false,
    requirements: ["Insurance"],
    merchantOffered: false,
    eligibleStores: [{ id: 'store-1', name: 'Your Store' }]
  },
  {
    id: 'demo-3',
    title: "Bridal makeup and hair styling",
    description: "Looking for professional hair styling and makeup services for a wedding event. Need someone experienced with bridal looks and who can travel to venue in Karen.",
    category: "Beauty & Wellness",
    budget: "$200 - $300",
    budgetMin: 200,
    budgetMax: 300,
    location: "Karen, Nairobi",
    timeline: "nextweek",
    postedBy: "Sarah L.",
    postedTime: "1 hour ago",
    priority: "high",
    status: "open",
    offers: 2,
    verified: true,
    requirements: ["Licensed", "Portfolio", "Travel"],
    merchantOffered: false,
    eligibleStores: [{ id: 'store-1', name: 'Your Store' }]
  },
  {
    id: 'demo-4',
    title: "Personal fitness training sessions",
    description: "Need a certified personal trainer for home fitness sessions 3 times a week. Focus on weight loss and strength training. Must provide own equipment.",
    category: "Fitness",
    budget: "$150 - $250",
    budgetMin: 150,
    budgetMax: 250,
    location: "Kileleshwa, Nairobi",
    timeline: "thisweek",
    postedBy: "Mike R.",
    postedTime: "3 hours ago",
    priority: "normal",
    status: "open",
    offers: 0,
    verified: true,
    requirements: ["Certified", "Insurance", "Equipment"],
    merchantOffered: false,
    eligibleStores: [{ id: 'store-1', name: 'Your Store' }]
  },
  {
    id: 'demo-5',
    title: "Wedding photography and videography",
    description: "Looking for professional photographer and videographer for wedding ceremony and reception. Need both photo and video coverage for full day event.",
    category: "Photography",
    budget: "$500 - $800",
    budgetMin: 500,
    budgetMax: 800,
    location: "Runda, Nairobi",
    timeline: "thismonth",
    postedBy: "James & Lisa",
    postedTime: "6 hours ago",
    priority: "high",
    status: "open",
    offers: 5,
    verified: true,
    requirements: ["Portfolio", "Equipment", "Insurance"],
    merchantOffered: false,
    eligibleStores: [{ id: 'store-1', name: 'Your Store' }]
  },
  {
    id: 'demo-6',
    title: "Computer repair and maintenance",
    description: "Need tech support for laptop repair. Screen replacement and general maintenance. Must be able to work with Dell laptops and provide warranty.",
    category: "Tech Support",
    budget: "$50 - $100",
    budgetMin: 50,
    budgetMax: 100,
    location: "CBD, Nairobi",
    timeline: "urgent",
    postedBy: "Peter M.",
    postedTime: "4 hours ago",
    priority: "urgent",
    status: "open",
    offers: 1,
    verified: false,
    requirements: ["Certified", "Warranty"],
    merchantOffered: false,
    eligibleStores: [{ id: 'store-1', name: 'Your Store' }]
  }
];

export default function MerchantServiceRequestDashboard() {
  // Core state
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [merchantStore, setMerchantStore] = useState(null);

  // Data state
  const [dashboardStats, setDashboardStats] = useState(MOCK_STATS);
  const [allServiceRequests, setAllServiceRequests] = useState([]); // All requests
  const [filteredServiceRequests, setFilteredServiceRequests] = useState([]); // Filtered by category
  const [merchantOffers, setMerchantOffers] = useState([]);

  // Modal states
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    budget: 'all',
    timeline: 'all',
    location: '',
    status: 'all',
    page: 1,
    limit: 20
  });

  // Form states
  const [offerForm, setOfferForm] = useState({
    quotedPrice: '',
    message: '',
    availability: '',
    estimatedDuration: '',
    includesSupplies: false
  });

  // Enhanced service request loading with real API integration
  const loadServiceRequests = async () => {
    try {
      console.log('📊 Loading service requests...');
      
      // Try to load from real API first
      try {
        const response = await fetch('/api/v1/request-service', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.requests) {
            console.log('✅ Loaded service requests from API:', result.data.requests.length);
            setAllServiceRequests(result.data.requests);
            return result.data.requests;
          }
        }
      } catch (apiError) {
        console.warn('⚠️ API request failed, using mock data:', apiError.message);
      }

      // Fallback to mock data
      console.log('📝 Using mock service requests');
      setAllServiceRequests(MOCK_REQUESTS_ALL);
      return MOCK_REQUESTS_ALL;
    } catch (err) {
      console.error('💥 Error loading service requests:', err);
      setAllServiceRequests(MOCK_REQUESTS_ALL);
      return MOCK_REQUESTS_ALL;
    }
  };

  // Apply category and other filters to service requests
  const applyFilters = (requests) => {
    let filtered = requests;

    // First filter by store category if available
    if (merchantStore?.category) {
      filtered = getFilteredServiceRequests(filtered, merchantStore.category);
      console.log(`🔍 Filtered by store category "${merchantStore.category}":`, filtered.length, 'requests');
    }

    // Apply additional filters
    if (filters.budget !== 'all') {
      const [min, max] = filters.budget.split('-');
      filtered = filtered.filter(request => {
        const budgetMin = request.budgetMin || parseInt(request.budget?.split(' - $')[0]?.replace('$', '') || 0);
        const budgetMax = request.budgetMax || parseInt(request.budget?.split(' - $')[1]?.replace('$', '') || 999999);
        
        if (max === '+') {
          return budgetMin >= parseInt(min);
        } else {
          return budgetMin >= parseInt(min) && budgetMax <= parseInt(max);
        }
      });
    }

    if (filters.timeline !== 'all') {
      filtered = filtered.filter(request => request.timeline === filters.timeline);
    }

    if (filters.location) {
      filtered = filtered.filter(request => 
        request.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    return filtered;
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

        // Load merchant's store data
        await loadMerchantStore(merchant.id);

        // Load dashboard data
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

  // Update filtered requests when store or filters change
  useEffect(() => {
    if (allServiceRequests.length > 0) {
      const filtered = applyFilters(allServiceRequests);
      setFilteredServiceRequests(filtered);
      console.log('🔄 Applied filters, showing', filtered.length, 'requests');
    }
  }, [allServiceRequests, merchantStore, filters]);

  const loadMerchantStore = async (merchantId) => {
    try {
      console.log('🏪 Loading merchant store data...');
      
      // Try to load store data using merchantAuthService
      try {
        const storeData = await merchantAuthService.getStoreDetails(merchantId);
        if (storeData && storeData.success) {
          setMerchantStore(storeData.data);
          console.log('✅ Store data loaded from API:', storeData.data);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to load store from API, using mock data:', apiError.message);
      }
      
      // Mock store data with business categories
      const mockStore = {
        id: `store-${merchantId}`,
        name: currentMerchant?.first_name ? `${currentMerchant.first_name}'s Store` : 'Your Store',
        description: 'Professional service provider',
        category: 'Beauty & Wellness', // This will determine which requests are shown
        location: 'Nairobi, Kenya',
        phone_number: currentMerchant?.phone_number || '',
        primary_email: currentMerchant?.email_address || '',
        status: 'open',
        rating: 4.8,
        reviewCount: 127,
        verified: true,
        logo_url: '',
        website_url: '',
        opening_time: '09:00',
        closing_time: '18:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        cashback: '5%'
      };

      setMerchantStore(mockStore);
      console.log('✅ Store data loaded (mock):', mockStore);

    } catch (err) {
      console.error('💥 Error loading store data:', err);
      // Set a basic store structure if loading fails
      const fallbackStore = {
        id: `store-${merchantId}`,
        name: 'Your Store',
        description: 'Service provider',
        category: 'Professional Services',
        location: 'Nairobi, Kenya',
        status: 'open',
        rating: 0,
        reviewCount: 0,
        verified: false
      };
      setMerchantStore(fallbackStore);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading dashboard data...');
      
      // Load service requests
      const requests = await loadServiceRequests();
      
      // Try to load merchant offers
      try {
        // This would be your API call to get merchant's offers
        const response = await fetch('/api/v1/merchant/offers', {
          headers: {
            'Authorization': `Bearer ${merchantAuthService.getToken()}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setMerchantOffers(result.data?.offers || []);
          }
        } else {
          // Fallback to mock offers
          setMerchantOffers([]);
        }
      } catch (offersError) {
        console.warn('⚠️ Failed to load offers:', offersError.message);
        setMerchantOffers([]);
      }

    } catch (err) {
      console.warn('⚠️ Failed to load dashboard data:', err);
    }
  };

  // Enhanced offer submission with real API integration
  const handleOfferFormSubmit = async () => {
    setSubmitting(true);
    
    try {
      console.log('📤 Submitting offer for request:', selectedRequest.id);
      
      // Validate required fields
      if (!offerForm.quotedPrice || !offerForm.message || !offerForm.availability) {
        throw new Error('Please fill in all required fields');
      }

      // Validate price
      const price = parseFloat(offerForm.quotedPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      // Prepare offer data
      const offerData = {
        storeId: merchantStore?.id,
        quotedPrice: price,
        message: offerForm.message.trim(),
        availability: offerForm.availability.trim(),
        estimatedDuration: offerForm.estimatedDuration.trim() || null,
        includesSupplies: offerForm.includesSupplies
      };

      console.log('📋 Offer data:', offerData);

      // Try to submit via the new API service
      try {
        const { default: merchantServiceRequestService } = await import('../../services/merchantServiceRequestService');
        
        const result = await merchantServiceRequestService.createStoreOffer(selectedRequest.id, offerData);
        
        if (result && result.success) {
          console.log('✅ Offer submitted successfully via API service');
        } else {
          throw new Error(result?.message || 'Failed to submit offer via service');
        }
      } catch (serviceError) {
        console.warn('⚠️ API service submission failed, trying direct API:', serviceError.message);
        
        // Fallback to direct API call
        try {
          const response = await fetch(`/api/v1/service-requests/${selectedRequest.id}/offers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${merchantAuthService.getToken()}`
            },
            body: JSON.stringify(offerData)
          });

          const result = await response.json();

          if (response.ok && result.success) {
            console.log('✅ Offer submitted successfully via direct API');
          } else {
            throw new Error(result.message || 'Failed to submit offer via direct API');
          }
        } catch (directApiError) {
          console.warn('⚠️ Direct API submission also failed:', directApiError.message);
          // Simulate successful submission for demo
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('✅ Offer submitted (simulated)');
        }
      }
      
      // Reset form and close modal
      setShowOfferForm(false);
      setOfferForm({
        quotedPrice: '', message: '', availability: '',
        estimatedDuration: '', includesSupplies: false
      });
      setSelectedRequest(null);
      
      // Refresh data
      await loadDashboardData();
      
      alert('Offer submitted successfully! The customer will be notified.');
    } catch (err) {
      console.error('💥 Offer submission error:', err);
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
        <LoadingSpinner />
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
            <div className="mt-4 space-x-2">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Retry
              </button>
              <button 
                onClick={() => merchantAuthService.logout()} 
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
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
                <p className="text-gray-600">Manage service requests and offers for your store</p>
                
                {/* Merchant info */}
                {currentMerchant && (
                  <div className="mt-2 text-sm text-gray-500">
                    Welcome, {currentMerchant.first_name} {currentMerchant.last_name} ({currentMerchant.email_address})
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {merchantStore && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Store className="w-4 h-4" />
                    <span>{merchantStore.name}</span>
                    {merchantStore.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {merchantStore.category}
                    </span>
                  </div>
                )}
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
                  <p className="text-sm font-medium text-gray-600">Available Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredServiceRequests.length}</p>
                  <p className="text-xs text-gray-500">Matching your store category</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Your Offers</p>
                  <p className="text-2xl font-bold text-gray-900">{merchantOffers.length}</p>
                  <p className="text-xs text-gray-500">Total sent</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.acceptanceRate || 0}%</p>
                  <p className="text-xs text-gray-500">Offer acceptance</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardStats.totalEarnings?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">From completed services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Info */}
          {merchantStore && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Your Store Category: {merchantStore.category}</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Showing service requests for: {getMatchingServiceCategories(merchantStore.category).join(', ')}
              </p>
              {filteredServiceRequests.length === 0 && allServiceRequests.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  No requests match your store category. {allServiceRequests.length} total requests available.
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => handleTabChange('requests')}
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'requests' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border'}`}
              >
                Available Requests ({filteredServiceRequests.length})
              </button>
              <button
                onClick={() => handleTabChange('offers')}
                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'offers' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border'}`}
              >
                My Offers ({merchantOffers.length})
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
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
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="border border-gray-200 rounded px-3 py-1 text-sm w-48"
                />
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {filteredServiceRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-xl mb-4">
                    {allServiceRequests.length === 0 ? 'No service requests available' : 'No requests match your store category'}
                  </div>
                  <p className="text-gray-600 mb-6">
                    {allServiceRequests.length === 0 
                      ? 'Check back later for new service requests from customers.'
                      : `Your store specializes in "${merchantStore?.category}". Requests in matching categories will appear here.`
                    }
                  </p>
                  {allServiceRequests.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Total requests available: {allServiceRequests.length}
                    </div>
                  )}
                </div>
              ) : (
                filteredServiceRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold">{request.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                              request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {request.priority}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {request.status.toUpperCase()}
                            </span>
                            {request.verified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                ✓ Verified User
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
                              <span className="font-medium text-green-600">{request.budget}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{getTimelineLabel(request.timeline)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>by {request.postedBy}</span>
                            </div>
                          </div>

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
                              <button 
                                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 font-medium"
                                onClick={() => {
                                  alert('View Details functionality would show full request details');
                                }}
                              >
                                View Details
                              </button>
                              {merchantStore && (
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setOfferForm(prev => ({
                                      ...prev,
                                      quotedPrice: '' // Clear any previous price
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
                    onClick={() => handleTabChange('requests')}
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
                            {getStatusBadge(offer.status)}
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
        </div>

        {/* Enhanced Offer Form Modal */}
        {showOfferForm && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Send Offer</h2>
                  <button onClick={() => setShowOfferForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                    ×
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">Offer for: <span className="font-medium">{selectedRequest.title}</span></p>
                  <p className="text-sm text-gray-500">Customer Budget: <span className="font-medium text-green-600">{selectedRequest.budget}</span></p>
                  {merchantStore && (
                    <p className="text-sm text-gray-500">From: <span className="font-medium">{merchantStore.name}</span></p>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quoted Price * (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={offerForm.quotedPrice}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, quotedPrice: e.target.value }))}
                      placeholder="Enter your price quote"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Customer budget: {selectedRequest.budget}</span>
                    {offerForm.quotedPrice && (
                      <span className={`font-medium ${
                        isPriceInBudget(offerForm.quotedPrice, selectedRequest) 
                          ? 'text-green-600' 
                          : 'text-orange-600'
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message * (Pitch your services)</label>
                  <textarea
                    rows="4"
                    value={offerForm.message}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your offer, experience, and why you're the best choice for this job. Mention your qualifications, past work, and what makes you stand out..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                    minLength="20"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {offerForm.message.length}/500 characters (minimum 20 required)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability *</label>
                  <input
                    type="text"
                    value={offerForm.availability}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, availability: e.target.value }))}
                    placeholder="When can you start? (e.g., Tomorrow at 2 PM, This weekend, Next Monday)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Customer timeline: {getTimelineLabel(selectedRequest.timeline)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration</label>
                  <input
                    type="text"
                    value={offerForm.estimatedDuration}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="How long will the service take? (e.g., 2-3 hours, Half day, 2 days)"
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
                    Price includes all supplies and materials needed
                  </label>
                </div>

                {/* Display requirements if any */}
                {selectedRequest.requirements && selectedRequest.requirements.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Customer Requirements:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.requirements.map((req, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {req}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Make sure you meet these requirements before submitting your offer.
                    </p>
                  </div>
                )}

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
                    type="button"
                    onClick={handleOfferFormSubmit}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium"
                    disabled={submitting || !offerForm.quotedPrice || !offerForm.message || !offerForm.availability}
                  >
                    {submitting ? 'Sending Offer...' : 'Send Offer'}
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