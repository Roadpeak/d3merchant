import React, { useState, useEffect } from 'react';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
import { 
  Star, 
  User, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Filter,
  Download,
  Eye,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Users,
  Award
} from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [storeData, setStoreData] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Review statistics
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recentTrend: 'stable'
  });

  // Get auth headers
  const getAuthHeaders = () => {
    const token = merchantAuthService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Check authentication status
  const checkAuthStatus = () => {
    if (!merchantAuthService.isAuthenticated()) {
      setError('Your session has expired. Please log in again.');
      setTimeout(() => {
        merchantAuthService.logout();
      }, 2000);
      return false;
    }
    return true;
  };

  // Get merchant's store
  const getMerchantStore = async () => {
    try {
      console.log('🔍 Fetching merchant stores for reviews...');
      
      if (!checkAuthStatus()) {
        throw new Error('Authentication required');
      }
      
      const token = merchantAuthService.getToken();
      console.log('🎫 Using token:', token ? 'Found' : 'Not found');
      
      const response = await fetch('http://localhost:4000/api/v1/stores/merchant/my-stores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Store fetch failed:', errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Your session may have expired.');
        } else if (response.status === 404) {
          throw new Error('No store found for your merchant account. Please create a store first.');
        } else {
          throw new Error(`Failed to fetch stores: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('✅ Store data received:', data);

      if (data.success && data.stores && data.stores.length > 0) {
        const store = data.stores[0];
        console.log('🏪 Store found:', store.name);
        setStoreData(store);
        return store.id;
      }
      
      throw new Error('No store found for your merchant account. Please create a store first.');
    } catch (error) {
      console.error('💥 Error fetching merchant store:', error);
      throw error;
    }
  };

  // Fetch reviews for the merchant's store using the enhanced endpoint
  const fetchStoreReviews = async (storeId = null) => {
    try {
      console.log('📝 Fetching reviews for merchant store:', storeId);
      
      if (!checkAuthStatus()) {
        return { reviews: [], stats: null };
      }
      
      // Use the merchant-specific endpoint that gets reviews for the merchant's own store
      const response = await fetch(`http://localhost:4000/api/v1/merchant/reviews`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      console.log('📡 Merchant reviews response status:', response.status);

      if (response.status === 404) {
        console.log('📭 No reviews found yet - this is normal for new stores');
        return { reviews: [], stats: null };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Merchant reviews fetch failed:', errorData);
        
        if (response.status === 401) {
          throw new Error('Authentication failed while fetching reviews.');
        }
        
        throw new Error(errorData.message || `Failed to fetch reviews (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Merchant reviews data received:', data);
      
      return {
        reviews: data.success ? (data.reviews || []) : [],
        stats: data.success ? data.stats : null
      };
      
    } catch (error) {
      console.error('💥 Error fetching merchant reviews:', error);
      throw error;
    }
  };

  // Calculate review statistics
  const calculateReviewStats = (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentTrend: 'stable'
      };
    }

    const totalReviews = reviewsData.length;
    const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      if (ratingDistribution[review.rating] !== undefined) {
        ratingDistribution[review.rating]++;
      }
    });

    // Calculate recent trend (last 10 reviews vs previous 10)
    let recentTrend = 'stable';
    if (totalReviews >= 10) {
      const recentReviews = reviewsData.slice(0, 10);
      const olderReviews = reviewsData.slice(10, 20);
      
      if (olderReviews.length > 0) {
        const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
        const olderAvg = olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length;
        
        if (recentAvg > olderAvg + 0.2) recentTrend = 'improving';
        else if (recentAvg < olderAvg - 0.2) recentTrend = 'declining';
      }
    }

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recentTrend
    };
  };

  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    let filteredReviews = [...reviews];

    // Filter by rating
    if (filterRating !== 'all') {
      filteredReviews = filteredReviews.filter(review => review.rating === parseInt(filterRating));
    }

    // Sort reviews
    switch (sortBy) {
      case 'newest':
        filteredReviews.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
        break;
      case 'oldest':
        filteredReviews.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
        break;
      case 'highest':
        filteredReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filteredReviews.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return filteredReviews;
  };

  // Render star rating
  const renderStars = (rating = 0, size = 'default') => {
    const sizeClasses = {
      small: 'w-3 h-3',
      default: 'w-4 h-4',
      large: 'w-5 h-5'
    };

    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render rating distribution bar
  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 w-12">
          <span className="text-sm font-medium">{rating}</span>
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  // Utility function to calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffInHours = Math.floor((now - reviewDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  // Refresh reviews when filters change
  const refreshReviews = async () => {
    if (!storeId) return;
    
    try {
      console.log('🔄 Refreshing reviews with filters:', { filterRating, sortBy });
      
      const { reviews: storeReviews, stats: backendStats } = await fetchStoreReviews(storeId);
      setReviews(storeReviews);
      
      const stats = backendStats || calculateReviewStats(storeReviews);
      setReviewStats(stats);
      
    } catch (error) {
      console.error('Error refreshing reviews:', error);
      setError('Failed to refresh reviews. Please try again.');
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🚀 Starting reviews page data load...');
        console.log('🔐 Auth status:', merchantAuthService.isAuthenticated());
        
        // Check authentication first
        if (!merchantAuthService.isAuthenticated()) {
          throw new Error('Your session has expired. Please log in again.');
        }
        
        // Get the merchant's store
        const merchantStoreId = await getMerchantStore();
        setStoreId(merchantStoreId);
        
        // Fetch reviews and stats for the store
        const { reviews: storeReviews, stats: backendStats } = await fetchStoreReviews(merchantStoreId);
        setReviews(storeReviews);
        
        // Use backend stats if available, otherwise calculate frontend stats
        const stats = backendStats || calculateReviewStats(storeReviews);
        setReviewStats(stats);
        
        console.log(`📋 Loaded ${storeReviews.length} reviews`);
        console.log('📊 Review stats:', stats);
        
      } catch (error) {
        console.error('💥 Error loading reviews data:', error);
        setError(error.message);
        
        // If authentication error, redirect after showing message
        if (error.message.includes('session has expired') || 
            error.message.includes('Authentication failed')) {
          setTimeout(() => {
            merchantAuthService.logout();
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (merchantAuthService.isInitialized) {
      loadData();
    } else {
      setTimeout(() => {
        if (merchantAuthService.isAuthenticated()) {
          loadData();
        } else {
          setLoading(false);
          setError('Authentication service not available. Please refresh the page.');
        }
      }, 1000);
    }
  }, []);

  // Refresh reviews when filters change (optional - for real-time filtering)
  useEffect(() => {
    if (storeId && reviews.length > 0) {
      // Only refresh if we want server-side filtering
      // For now, we'll use client-side filtering which is faster
      console.log('🔄 Filter changed, using client-side filtering');
    }
  }, [filterRating, sortBy, storeId]);

  // Show success message temporarily
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const filteredReviews = getFilteredAndSortedReviews();

  if (loading) {
    return (
      <Layout title="Customer Reviews">
        <div className="max-w-7xl mx-auto py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading customer reviews...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Customer Reviews">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
            <p className="text-gray-600 mt-1">
              {storeData ? `Reviews for ${storeData.name}` : 'Manage your store\'s customer feedback'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {reviews.length > 0 && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Error State */}
        {error ? (
          <div className="bg-white rounded-xl shadow-sm border border-red-200">
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Reviews</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              
              {error.includes('No store found') ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    You need to create a store before viewing customer reviews.
                  </p>
                  <button
                    onClick={() => window.location.href = '/dashboard/stores'}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your Store
                  </button>
                </div>
              ) : error.includes('session has expired') || error.includes('Authentication failed') ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Your session has expired. Please log in again to continue.
                  </p>
                  <button
                    onClick={() => merchantAuthService.logout()}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Review Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Reviews */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                    <p className="text-3xl font-bold text-gray-900">{reviewStats.totalReviews}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-gray-900">{reviewStats.averageRating}</p>
                      <div className="flex">
                        {renderStars(reviewStats.averageRating, 'small')}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* 5-Star Reviews */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">5-Star Reviews</p>
                    <p className="text-3xl font-bold text-gray-900">{reviewStats.ratingDistribution[5]}</p>
                    <p className="text-sm text-gray-500">
                      {reviewStats.totalReviews > 0 
                        ? `${Math.round((reviewStats.ratingDistribution[5] / reviewStats.totalReviews) * 100)}%` 
                        : '0%'
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Trend */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Trend</p>
                    <p className={`text-lg font-semibold ${
                      reviewStats.recentTrend === 'improving' ? 'text-green-600' : 
                      reviewStats.recentTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {reviewStats.recentTrend === 'improving' ? '📈 Improving' :
                       reviewStats.recentTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    reviewStats.recentTrend === 'improving' ? 'bg-green-100' : 
                    reviewStats.recentTrend === 'declining' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <TrendingUp className={`w-6 h-6 ${
                      reviewStats.recentTrend === 'improving' ? 'text-green-600' : 
                      reviewStats.recentTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            {reviewStats.totalReviews > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating}>
                      {renderRatingBar(rating, reviewStats.ratingDistribution[rating], reviewStats.totalReviews)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter & Sort</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Rating</label>
                    <select
                      value={filterRating}
                      onChange={(e) => setFilterRating(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Customer Reviews 
                    {filterRating !== 'all' && (
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({filterRating} star{filterRating !== '1' ? 's' : ''})
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Showing {filteredReviews.length} of {reviews.length} reviews
                  </span>
                </div>
              </div>

              {filteredReviews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          {/* Customer Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {(review.User?.firstName || review.user?.first_name || review.customerName || 'A').charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Customer Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {review.User?.firstName 
                                  ? `${review.User.firstName} ${review.User.lastName?.charAt(0) || ''}.`
                                  : review.user?.first_name
                                  ? `${review.user.first_name} ${review.user.last_name?.charAt(0) || ''}.`
                                  : review.customerName || review.name || 'Anonymous Customer'
                                }
                              </h4>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                {review.User ? 'Verified Customer' : 'Customer'}
                              </span>
                            </div>
                            
                            {/* Rating and Date */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                {renderStars(review.rating)}
                                <span className="font-medium text-gray-900">{review.rating}/5</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(review.createdAt || review.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{getTimeAgo(review.createdAt || review.created_at)}</span>
                              </div>
                            </div>

                            {/* Review Text */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-700 leading-relaxed">
                                {review.text || review.comment || 'No comment provided.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View customer profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Helpful review"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Review Metadata */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                        <span>Review #{review.id.substring(0, 8)}...</span>
                        <span>{getTimeAgo(review.createdAt || review.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="p-12 text-center">
                  <Filter className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews match your filters</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filter criteria to see more reviews.
                  </p>
                  <button
                    onClick={() => {
                      setFilterRating('all');
                      setSortBy('newest');
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600 mb-6">
                    {storeData ? 
                      `Customers haven't left any reviews for ${storeData.name} yet. Reviews will appear here once customers start sharing their experiences.` :
                      'Customer reviews will appear here once they start sharing their experiences with your store.'
                    }
                  </p>
                  
                  {/* Tips for getting reviews */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold text-blue-900 mb-3">💡 Tips to Get More Reviews</h4>
                    <ul className="text-blue-800 text-sm space-y-2 text-left">
                      <li>• Provide excellent customer service</li>
                      <li>• Follow up with customers after purchases</li>
                      <li>• Respond to existing reviews promptly</li>
                      <li>• Encourage satisfied customers to share feedback</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reviews;