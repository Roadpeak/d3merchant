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
  Award,
  BarChart3,
  Users,
  Heart,
  Shield,
  RefreshCw,
  X,
  Lightbulb,
  Quote
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
  const [refreshing, setRefreshing] = useState(false);

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
      'Authorization': `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_KEY
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
      if (!checkAuthStatus()) {
        throw new Error('Authentication required');
      }

      const token = merchantAuthService.getToken();
      const url = `${import.meta.env.VITE_API_BASE_URL}/stores/merchant/my-stores`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': import.meta.env.VITE_API_KEY
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Your session may have expired.');
        } else if (response.status === 404) {
          throw new Error('No store found for your merchant account. Please create a store first.');
        } else {
          throw new Error(`Failed to fetch stores: ${response.status}`);
        }
      }

      const data = await response.json();

      if (data.success && data.stores && data.stores.length > 0) {
        const store = data.stores[0];
        setStoreData(store);
        return store.id;
      }

      throw new Error('No store found for your merchant account. Please create a store first.');
    } catch (error) {
      console.error('getMerchantStore Error:', error);
      throw error;
    }
  };

  // Fetch reviews for the merchant's store
  const fetchStoreReviews = async (storeId = null) => {
    try {
      if (!checkAuthStatus()) {
        return { reviews: [], stats: null };
      }

      const url = `${import.meta.env.VITE_API_BASE_URL}/merchant/reviews`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.status === 404) {
        return { reviews: [], stats: null };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error('Authentication failed while fetching reviews.');
        }

        throw new Error(errorData.message || `Failed to fetch reviews (${response.status})`);
      }

      const data = await response.json();

      return {
        reviews: data.success ? (data.reviews || []) : [],
        stats: data.success ? data.stats : null
      };

    } catch (error) {
      console.error('fetchStoreReviews Error:', error);
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
    const averageRating = (reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    // Determine trend
    const recentReviews = reviewsData.slice(0, Math.min(10, totalReviews));
    const recentAverage = recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length;
    
    let recentTrend = 'stable';
    if (recentAverage > averageRating + 0.3) {
      recentTrend = 'improving';
    } else if (recentAverage < averageRating - 0.3) {
      recentTrend = 'declining';
    }

    return {
      totalReviews,
      averageRating: parseFloat(averageRating),
      ratingDistribution,
      recentTrend
    };
  };

  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    if (filterRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filterRating));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at);
        case 'oldest':
          return new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // Get time ago string
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

  // Refresh data
  const handleRefresh = async () => {
    if (!storeId) return;

    try {
      setRefreshing(true);

      const { reviews: storeReviews, stats: backendStats } = await fetchStoreReviews(storeId);
      setReviews(storeReviews);

      const stats = backendStats || calculateReviewStats(storeReviews);
      setReviewStats(stats);

    } catch (error) {
      console.error('Error refreshing reviews:', error);
      setError('Failed to refresh reviews. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!merchantAuthService.isAuthenticated()) {
          throw new Error('Your session has expired. Please log in again.');
        }

        const merchantStoreId = await getMerchantStore();
        setStoreId(merchantStoreId);

        const { reviews: storeReviews, stats: backendStats } = await fetchStoreReviews(merchantStoreId);
        setReviews(storeReviews);

        const stats = backendStats || calculateReviewStats(storeReviews);
        setReviewStats(stats);

      } catch (error) {
        console.error('Error loading reviews data:', error);
        setError(error.message);

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

    loadData();
  }, []);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12 sm:py-16">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">Loading customer reviews...</p>
      </div>
    </div>
  );

  const filteredReviews = getFilteredAndSortedReviews();

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Customer Reviews
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {storeData ? `Reviews for ${storeData.name}` : 'Monitor your customer feedback'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {reviews.length > 0 && (
              <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-600 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-gray-700 transition-colors flex-1 sm:flex-initial">
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start sm:items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-sm sm:text-base text-green-800 font-medium">{success}</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start sm:items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-sm sm:text-base text-red-800 font-medium break-words">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{reviewStats.totalReviews}</div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Total Reviews</div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{reviewStats.averageRating}</div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{reviewStats.ratingDistribution[5]}</div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">5-Star Reviews</div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 capitalize">{reviewStats.recentTrend}</div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Recent Trend</div>
          </div>
        </div>

        {error && (error.includes('No store found') || error.includes('session has expired') || error.includes('Authentication failed')) ? (
          /* Error State */
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unable to Load Reviews</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>

              {error.includes('No store found') ? (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-gray-500">
                    You need to create a store before viewing customer reviews.
                  </p>
                  <button
                    onClick={() => window.location.href = '/dashboard/account'}
                    className="bg-blue-600 text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Create Your Store
                  </button>
                </div>
              ) : error.includes('session has expired') || error.includes('Authentication failed') ? (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Your session has expired. Please log in again to continue.
                  </p>
                  <button
                    onClick={() => merchantAuthService.logout()}
                    className="bg-red-600 text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  <span className="text-sm sm:text-base font-medium text-gray-900">Filters & Sorting</span>
                </div>
                <X className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${showFilters ? 'rotate-0' : 'rotate-45'}`} />
              </button>

              {showFilters && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Filter by Rating
                      </label>
                      <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Customer Reviews
                        {filterRating !== 'all' && (
                          <span className="ml-2 text-xs sm:text-sm font-normal text-gray-600">
                            ({filterRating} star{filterRating !== '1' ? 's' : ''})
                          </span>
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Showing {filteredReviews.length} of {reviews.length} reviews
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {filteredReviews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Customer Avatar */}
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-semibold text-sm sm:text-lg flex-shrink-0">
                          {(review.User?.firstName || review.user?.first_name || review.customerName || 'A').charAt(0).toUpperCase()}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 min-w-0">
                          {/* Customer Info */}
                          <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900">
                              {review.User?.firstName
                                ? `${review.User.firstName} ${review.User.lastName?.charAt(0) || ''}.`
                                : review.user?.first_name
                                  ? `${review.user.first_name} ${review.user.last_name?.charAt(0) || ''}.`
                                  : review.customerName || review.name || 'Anonymous Customer'
                              }
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Shield className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                              {review.User ? 'Verified' : 'Customer'}
                            </span>
                          </div>

                          {/* Rating and Date */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm sm:text-base font-semibold text-gray-900">{review.rating}/5</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>
                                {new Date(review.createdAt || review.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span>{getTimeAgo(review.createdAt || review.created_at)}</span>
                            </div>
                          </div>

                          {/* Review Text */}
                          <div className="relative">
                            <Quote className="absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4 text-gray-300 -translate-x-1 -translate-y-1" />
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 ml-2 sm:ml-3">
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                {review.text || review.comment || 'No comment provided.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No reviews match your filters</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">
                    Try adjusting your filter criteria to see more reviews.
                  </p>
                  <button
                    onClick={() => {
                      setFilterRating('all');
                      setSortBy('newest');
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md mx-auto">
                    {storeData ?
                      `Customers haven't left any reviews for ${storeData.name} yet. Reviews will appear here once customers start sharing their experiences.` :
                      'Customer reviews will appear here once they start sharing their experiences with your store.'
                    }
                  </p>

                  {/* Tips for getting reviews */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6 max-w-md mx-auto">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-4">Tips to Get More Reviews</h4>
                    <ul className="text-blue-800 text-xs sm:text-sm space-y-3 text-left">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Provide exceptional customer service</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Follow up with customers after purchases</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Respond to existing reviews promptly</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Encourage satisfied customers to share feedback</span>
                      </li>
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