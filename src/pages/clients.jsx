import React, { useState, useEffect } from 'react';
import Layout from '../elements/Layout';
import {
    Search,
    Filter,
    Mail,
    Phone,
    MessageCircle,
    Star,
    Calendar,
    User,
    Users,
    Send,
    ChevronDown,
    SortAsc,
    SortDesc,
    CheckSquare,
    Square,
    AlertCircle,
    RefreshCw,
    X,
    Plus,
    UserPlus,
    Heart,
    ShoppingBag,
    TrendingUp,
    Eye,
    Crown,
    Clock,
    Activity
} from 'lucide-react';

// Import existing API services
import {
    fetchMyStoreFollowers,
    fetchBookingsWithCustomers,
    sendBulkEmail,
    getMerchantStores
} from '../services/api_service';
import merchantAuthService from '../services/merchantAuthService';

const ClientsPage = () => {
    const [followers, setFollowers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('followers');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterBookingType, setFilterBookingType] = useState('all');
    const [selectedFollowers, setSelectedFollowers] = useState(new Set());
    const [selectedCustomers, setSelectedCustomers] = useState(new Set());
    const [showBulkEmail, setShowBulkEmail] = useState(false);
    const [bulkEmailSubject, setBulkEmailSubject] = useState('');
    const [bulkEmailMessage, setBulkEmailMessage] = useState('');
    const [sendingBulkEmail, setSendingBulkEmail] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [authStatus, setAuthStatus] = useState(null);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            const status = merchantAuthService.checkAuthenticationStatus();
            setAuthStatus(status);

            if (!status.isAuthenticated) {
                setError('Please log in to view your clients');
                setLoading(false);
                return false;
            }

            if (merchantAuthService.shouldLogout()) {
                console.log('Logout required due to authentication error');
                merchantAuthService.logout();
                return false;
            }

            return true;
        };

        if (checkAuth()) {
            loadData();
        }
    }, []);

    // Enhanced error handling for auth issues
    const handleAuthError = (error) => {
        console.error('Authentication error:', error);

        if (error.message.includes('session has expired') ||
            error.message.includes('Authentication required') ||
            error.message.includes('Please log in again')) {

            setError('Your session has expired. Please log in again.');
            setTimeout(() => {
                merchantAuthService.logout();
            }, 2000);
        } else {
            setError(error.message || 'Failed to load client data');
        }
    };

    // Process followers data
    const processFollowersData = (followersData) => {
        if (!Array.isArray(followersData)) return [];

        return followersData.map(follower => ({
            id: follower.id,
            name: `${follower.first_name || follower.firstName || ''} ${follower.last_name || follower.lastName || ''}`.trim() || 'Unknown User',
            email: follower.email || follower.email_address || 'No email provided',
            phone: follower.phone || follower.phone_number || 'No phone provided',
            avatar: follower.avatar || null,
            followedSince: follower.Follow?.createdAt || follower.followedAt || new Date().toISOString(),
            isVip: follower.isVip || false,
            lastActive: follower.lastActiveAt || follower.updatedAt || new Date().toISOString()
        }));
    };

    // Process customers data from bookings
    const processCustomersData = (bookingsData) => {
        if (!Array.isArray(bookingsData)) return [];

        const customerMap = new Map();

        bookingsData.forEach(booking => {
            const userId = booking.userId || booking.user_id;
            const user = booking.User || booking.user;

            if (!user || !userId) return;

            const userName = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || 'Unknown Customer';
            const userEmail = user.email || user.email_address || 'No email provided';
            const userPhone = user.phone || user.phone_number || 'No phone provided';

            if (!customerMap.has(userId)) {
                customerMap.set(userId, {
                    id: userId,
                    name: userName,
                    email: userEmail,
                    phone: userPhone,
                    avatar: user.avatar || null,
                    bookings: [],
                    totalBookings: 0,
                    totalSpent: 0,
                    lastBookingDate: null,
                    isVip: false,
                    bookingTypes: new Set()
                });
            }

            const customer = customerMap.get(userId);
            customer.bookings.push(booking);
            customer.totalBookings++;
            customer.totalSpent += parseFloat(booking.total_price || booking.totalPrice || 0);

            const bookingDate = new Date(booking.createdAt || booking.created_at);
            if (!customer.lastBookingDate || bookingDate > new Date(customer.lastBookingDate)) {
                customer.lastBookingDate = bookingDate.toISOString();
            }

            const bookingType = booking.booking_type || booking.bookingType || 'service';
            customer.bookingTypes.add(bookingType);

            if (customer.totalBookings >= 5 || customer.totalSpent >= 1000) {
                customer.isVip = true;
            }
        });

        return Array.from(customerMap.values()).map(customer => ({
            ...customer,
            bookingType: customer.bookingTypes.size > 1 ? 'mixed' : Array.from(customer.bookingTypes)[0] || 'service',
            bookingTypes: Array.from(customer.bookingTypes)
        }));
    };

    // Load data from APIs
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [followersResponse, bookingsResponse] = await Promise.all([
                fetchMyStoreFollowers().catch(err => {
                    console.error('Error fetching followers:', err);
                    return { followers: [] };
                }),
                fetchBookingsWithCustomers().catch(err => {
                    console.error('Error fetching bookings:', err);
                    return { bookings: [] };
                })
            ]);

            const processedFollowers = processFollowersData(followersResponse.followers || []);
            const processedCustomers = processCustomersData(bookingsResponse.bookings || []);

            setFollowers(processedFollowers);
            setCustomers(processedCustomers);

        } catch (error) {
            console.error('Error loading data:', error);
            if (error.message.includes('Authentication') || error.message.includes('session has expired')) {
                handleAuthError(error);
            } else {
                setError(error.message || 'Failed to load client data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // Selection handlers
    const handleSelectFollower = (followerId) => {
        setSelectedFollowers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(followerId)) {
                newSet.delete(followerId);
            } else {
                newSet.add(followerId);
            }
            return newSet;
        });
    };

    const handleSelectCustomer = (customerId) => {
        setSelectedCustomers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(customerId)) {
                newSet.delete(customerId);
            } else {
                newSet.add(customerId);
            }
            return newSet;
        });
    };

    const handleSelectAllFollowers = () => {
        if (selectedFollowers.size === filteredAndSortedFollowers.length) {
            setSelectedFollowers(new Set());
        } else {
            setSelectedFollowers(new Set(filteredAndSortedFollowers.map(f => f.id)));
        }
    };

    const handleSelectAllCustomers = () => {
        if (selectedCustomers.size === filteredAndSortedCustomers.length) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(filteredAndSortedCustomers.map(c => c.id)));
        }
    };

    // Contact action handlers
    const handleSendMessage = (person) => {
        window.open(`sms:${person.phone}`, '_blank');
    };

    const handleSendEmail = (person) => {
        window.location.href = `mailto:${person.email}`;
    };

    const handlePhoneCall = (person) => {
        window.location.href = `tel:${person.phone}`;
    };

    // Bulk email handler
    const handleBulkEmail = async () => {
        if (!bulkEmailSubject.trim() || !bulkEmailMessage.trim()) {
            alert('Please fill in both subject and message');
            return;
        }

        const selectedIds = activeTab === 'followers'
            ? Array.from(selectedFollowers)
            : Array.from(selectedCustomers);

        if (selectedIds.length === 0) {
            alert('Please select at least one recipient');
            return;
        }

        try {
            setSendingBulkEmail(true);

            await sendBulkEmail({
                recipientIds: selectedIds,
                subject: bulkEmailSubject,
                message: bulkEmailMessage,
                recipientType: activeTab
            });

            alert(`Email sent successfully to ${selectedIds.length} ${activeTab}`);
            setShowBulkEmail(false);
            setBulkEmailSubject('');
            setBulkEmailMessage('');
            setSelectedFollowers(new Set());
            setSelectedCustomers(new Set());
        } catch (error) {
            console.error('Failed to send bulk email:', error);

            if (error.message.includes('Authentication') || error.message.includes('session has expired')) {
                handleAuthError(error);
            } else {
                alert('Failed to send bulk email. Please try again.');
            }
        } finally {
            setSendingBulkEmail(false);
        }
    };

    // Filter and sort data
    const filteredAndSortedFollowers = followers
        .filter(follower =>
            follower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            follower.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'date') {
                comparison = new Date(a.followedSince) - new Date(b.followedSince);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const filteredAndSortedCustomers = customers
        .filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBookingType = filterBookingType === 'all' || customer.bookingTypes.includes(filterBookingType);
            return matchesSearch && matchesBookingType;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'bookings') {
                comparison = a.totalBookings - b.totalBookings;
            } else if (sortBy === 'spent') {
                comparison = a.totalSpent - b.totalSpent;
            } else if (sortBy === 'date') {
                comparison = new Date(a.lastBookingDate) - new Date(b.lastBookingDate);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center">
                <div className="relative">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">Loading your clients...</p>
            </div>
        </div>
    );

    const ContactActions = ({ person }) => (
        <div className="flex space-x-2">
            <button
                onClick={() => handleSendMessage(person)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Send Message"
            >
                <MessageCircle className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleSendEmail(person)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Send Email"
            >
                <Mail className="w-4 h-4" />
            </button>
            <button
                onClick={() => handlePhoneCall(person)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Call"
            >
                <Phone className="w-4 h-4" />
            </button>
        </div>
    );

    // Show login prompt if not authenticated
    if (authStatus && !authStatus.isAuthenticated) {
        return (
            <Layout>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8 sm:p-12 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-6">Please log in to view your clients</p>
                        <button
                            onClick={() => merchantAuthService.logout()}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Go to Login
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

    return (
        <Layout>
            <div className="space-y-6 sm:space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Client Management
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            Connect with your customers and followers
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm sm:text-base">Refresh</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900">{followers.length}</div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Followers</div>
                    </div>
                    
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900">{customers.length}</div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Customers</div>
                    </div>
                    
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                {[...followers, ...customers].filter(c => c.isVip).length}
                            </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">VIP Clients</div>
                    </div>
                    
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900">{followers.length + customers.length}</div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Total Reach</div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start sm:items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base text-red-800 font-medium break-words">{error}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    onClick={handleRefresh}
                                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 underline"
                                >
                                    Try again
                                </button>
                                {error.includes('session has expired') && (
                                    <button
                                        onClick={() => merchantAuthService.logout()}
                                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 underline"
                                    >
                                        Go to login
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
                        <nav className="flex min-w-full">
                            <button
                                onClick={() => setActiveTab('followers')}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm border-b-2 whitespace-nowrap flex-shrink-0 ${
                                    activeTab === 'followers'
                                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Heart className="w-4 h-4" />
                                <span>Followers ({followers.length})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('customers')}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm border-b-2 whitespace-nowrap flex-shrink-0 ${
                                    activeTab === 'customers'
                                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Customers ({customers.length})</span>
                            </button>
                        </nav>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 sm:p-6 border-b border-gray-200 space-y-4">
                        {/* Search and Filters Row */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            
                            {activeTab === 'customers' && (
                                <select
                                    value={filterBookingType}
                                    onChange={(e) => setFilterBookingType(e.target.value)}
                                    className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    <option value="all">All Types</option>
                                    <option value="service">Services</option>
                                    <option value="offer">Offers</option>
                                </select>
                            )}
                            
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    <option value="name">Name</option>
                                    {activeTab === 'customers' && (
                                        <>
                                            <option value="bookings">Bookings</option>
                                            <option value="spent">Amount Spent</option>
                                        </>
                                    )}
                                    <option value="date">Date</option>
                                </select>
                                
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="p-2 sm:p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                >
                                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 sm:h-5 sm:w-5" /> : <SortDesc className="h-4 w-4 sm:h-5 sm:w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Selection Actions Row */}
                        {((activeTab === 'followers' && selectedFollowers.size > 0) ||
                          (activeTab === 'customers' && selectedCustomers.size > 0)) && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-indigo-50 rounded-xl">
                                <span className="text-xs sm:text-sm font-medium text-indigo-900">
                                    {activeTab === 'followers' ? selectedFollowers.size : selectedCustomers.size} selected
                                </span>
                                <button
                                    onClick={() => setShowBulkEmail(true)}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Send Bulk Email
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="p-4 sm:p-6">
                        {/* Followers List */}
                        {activeTab === 'followers' && (
                            filteredAndSortedFollowers.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
                                    <p className="text-sm sm:text-base text-gray-600">
                                        {searchTerm ? 'No followers match your search' : 'Start building your follower base'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    {/* Select All */}
                                    <button
                                        onClick={handleSelectAllFollowers}
                                        className="flex items-center gap-2 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        {selectedFollowers.size === filteredAndSortedFollowers.length ? (
                                            <>
                                                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Select All
                                            </>
                                        )}
                                    </button>

                                    {filteredAndSortedFollowers.map((follower) => (
                                        <div
                                            key={follower.id}
                                            className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                                <button
                                                    onClick={() => handleSelectFollower(follower.id)}
                                                    className="flex-shrink-0 text-gray-400 hover:text-indigo-600"
                                                >
                                                    {selectedFollowers.has(follower.id) ? (
                                                        <CheckSquare className="w-5 h-5" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                                
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={follower.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.name)}&background=6366f1&color=fff`}
                                                        alt={follower.name}
                                                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-gray-100"
                                                    />
                                                    {follower.isVip && (
                                                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                                            <Crown className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-800" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{follower.name}</h3>
                                                        {follower.isVip && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600 mb-1">
                                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{follower.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{follower.phone}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                                        <Clock className="w-3 h-3 flex-shrink-0" />
                                                        <span>Followed: {new Date(follower.followedSince).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-2 sm:ml-0">
                                                <ContactActions person={follower} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* Customers List */}
                        {activeTab === 'customers' && (
                            filteredAndSortedCustomers.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                                    <p className="text-sm sm:text-base text-gray-600">
                                        {searchTerm ? 'No customers match your search' : 'Start receiving bookings to see customers'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    {/* Select All */}
                                    <button
                                        onClick={handleSelectAllCustomers}
                                        className="flex items-center gap-2 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        {selectedCustomers.size === filteredAndSortedCustomers.length ? (
                                            <>
                                                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                                                Select All
                                            </>
                                        )}
                                    </button>

                                    {filteredAndSortedCustomers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                                <button
                                                    onClick={() => handleSelectCustomer(customer.id)}
                                                    className="flex-shrink-0 text-gray-400 hover:text-indigo-600"
                                                >
                                                    {selectedCustomers.has(customer.id) ? (
                                                        <CheckSquare className="w-5 h-5" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                                
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=059669&color=fff`}
                                                        alt={customer.name}
                                                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-gray-100"
                                                    />
                                                    {customer.isVip && (
                                                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                                            <Crown className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-800" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">{customer.name}</h3>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                                                            customer.bookingType === 'service'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : customer.bookingType === 'offer'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {customer.bookingType === 'service' ? 'Service' : customer.bookingType === 'offer' ? 'Offer' : 'Mixed'}
                                                        </span>
                                                        {customer.isVip && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600 mb-1">
                                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{customer.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600 mb-2">
                                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{customer.phone}</span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                                            <span>Last: {customer.lastBookingDate ? new Date(customer.lastBookingDate).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <ShoppingBag className="w-3 h-3 flex-shrink-0" />
                                                            <span>{customer.totalBookings} bookings</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <TrendingUp className="w-3 h-3 flex-shrink-0" />
                                                            <span>${customer.totalSpent.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-2 sm:ml-0">
                                                <ContactActions person={customer} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Bulk Email Modal */}
                {showBulkEmail && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Send Bulk Email</h3>
                                <button
                                    onClick={() => setShowBulkEmail(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                <div className="p-3 sm:p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-medium text-indigo-900">Recipients</h4>
                                            <p className="text-xs sm:text-sm text-indigo-700">
                                                Sending to {activeTab === 'followers' ? selectedFollowers.size : selectedCustomers.size} {activeTab}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-medium text-gray-700">Email Subject *</label>
                                    <input
                                        type="text"
                                        value={bulkEmailSubject}
                                        onChange={(e) => setBulkEmailSubject(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                        placeholder="Enter email subject"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs sm:text-sm font-medium text-gray-700">Email Message *</label>
                                    <textarea
                                        value={bulkEmailMessage}
                                        onChange={(e) => setBulkEmailMessage(e.target.value)}
                                        rows={5}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                                        placeholder="Enter your message to clients"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3 p-4 sm:p-6 bg-gray-50 rounded-b-2xl sticky bottom-0">
                                <button
                                    onClick={() => setShowBulkEmail(false)}
                                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkEmail}
                                    disabled={sendingBulkEmail || !bulkEmailSubject.trim() || !bulkEmailMessage.trim()}
                                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {sendingBulkEmail ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ClientsPage;