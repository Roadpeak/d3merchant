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
    Loader2,
    CheckSquare,
    Square,
    ArrowUpDown,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

// Import your existing API services
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

            // Check if logout is needed
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

            // Trigger logout after a delay
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
            customer.totalBookings += 1;

            const bookingAmount = booking.amount || booking.accessFee || 0;
            customer.totalSpent += parseFloat(bookingAmount) || 0;

            const bookingType = booking.bookingType || (booking.offerId ? 'offer' : 'service');
            customer.bookingTypes.add(bookingType);

            const bookingDate = new Date(booking.createdAt || booking.created_at);
            if (!customer.lastBookingDate || bookingDate > new Date(customer.lastBookingDate)) {
                customer.lastBookingDate = bookingDate.toISOString();
            }

            if (customer.totalBookings >= 3 || customer.totalSpent >= 200) {
                customer.isVip = true;
            }
        });

        return Array.from(customerMap.values()).map(customer => ({
            ...customer,
            totalSpent: `$${customer.totalSpent.toFixed(2)}`,
            bookingType: customer.bookingTypes.has('offer') ? 'offer' : 'service',
            bookingDetails: customer.bookingTypes.has('offer') ? 'Offer Bookings' : 'Service Bookings',
            lastBookingDate: customer.lastBookingDate
        }));
    };

    // Load all data using existing API services
    const loadData = async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Check auth status before making requests
            const authCheck = merchantAuthService.checkAuthenticationStatus();
            if (!authCheck.isAuthenticated) {
                throw new Error('Authentication required. Please log in again.');
            }

            console.log('Loading client data...');

            // Fetch followers and customers in parallel using your existing API services
            const [followersResult, customersResult] = await Promise.allSettled([
                fetchMyStoreFollowers(),
                fetchBookingsWithCustomers()
            ]);

            // Handle followers result
            if (followersResult.status === 'fulfilled' && followersResult.value?.success) {
                const followersData = followersResult.value.followers || [];
                setFollowers(processFollowersData(followersData));
                console.log('✅ Loaded followers:', followersData.length);
            } else {
                console.error('❌ Failed to load followers:', followersResult.reason);
                setFollowers([]);

                // Check if it's an auth error
                if (followersResult.reason?.message?.includes('Authentication') ||
                    followersResult.reason?.message?.includes('session has expired')) {
                    handleAuthError(followersResult.reason);
                    return;
                }
            }

            // Handle customers result
            if (customersResult.status === 'fulfilled' && customersResult.value?.success) {
                const bookingsData = customersResult.value.bookings || [];
                setCustomers(processCustomersData(bookingsData));
                console.log('✅ Loaded customers:', bookingsData.length);
            } else {
                console.error('❌ Failed to load customers:', customersResult.reason);
                setCustomers([]);

                // Check if it's an auth error
                if (customersResult.reason?.message?.includes('Authentication') ||
                    customersResult.reason?.message?.includes('session has expired')) {
                    handleAuthError(customersResult.reason);
                    return;
                }
            }

        } catch (error) {
            console.error('Failed to load client data:', error);
            handleAuthError(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Debug function to check current auth status
    const debugAuth = () => {
        console.group('🔍 Authentication Debug');
        console.log('Auth Service Status:', merchantAuthService.getStatus());
        console.log('Current Merchant:', merchantAuthService.getCurrentMerchant());
        console.log('Token Available:', !!merchantAuthService.getToken());
        console.log('Is Authenticated:', merchantAuthService.isAuthenticated());
        console.groupEnd();
    };

    // Refresh data
    const handleRefresh = () => {
        debugAuth(); // Debug auth status on refresh
        loadData(true);
    };

    // Handle individual contact actions
    const handleSendMessage = (person) => {
        console.log('Navigate to chat with:', person.name);
    };

    const handleSendEmail = (person) => {
        const subject = `Message from ${merchantAuthService.getCurrentMerchant()?.first_name || 'Your Store'}`;
        const mailtoLink = `mailto:${person.email}?subject=${encodeURIComponent(subject)}`;
        window.open(mailtoLink, '_blank');
    };

    const handlePhoneCall = (person) => {
        if (typeof window !== 'undefined') {
            window.open(`tel:${person.phone}`, '_self');
        }
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

    // Filter and sort functions
    const filteredFollowers = followers
        .filter(follower =>
            follower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            follower.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'followedSince':
                    aValue = new Date(a.followedSince);
                    bValue = new Date(b.followedSince);
                    break;
                case 'lastActive':
                    aValue = new Date(a.lastActive);
                    bValue = new Date(b.lastActive);
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    const filteredCustomers = customers
        .filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBookingType = filterBookingType === 'all' || customer.bookingType === filterBookingType;
            return matchesSearch && matchesBookingType;
        })
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'lastBookingDate':
                    aValue = new Date(a.lastBookingDate);
                    bValue = new Date(b.lastBookingDate);
                    break;
                case 'totalBookings':
                    aValue = a.totalBookings;
                    bValue = b.totalBookings;
                    break;
                case 'totalSpent':
                    aValue = parseFloat(a.totalSpent.replace('$', '').replace(',', ''));
                    bValue = parseFloat(b.totalSpent.replace('$', '').replace(',', ''));
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    const handleSelectAllFollowers = () => {
        if (selectedFollowers.size === filteredFollowers.length) {
            setSelectedFollowers(new Set());
        } else {
            setSelectedFollowers(new Set(filteredFollowers.map(f => f.id)));
        }
    };

    const handleSelectAllCustomers = () => {
        if (selectedCustomers.size === filteredCustomers.length) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
        }
    };

    // Enhanced bulk email handler using your API service
    const handleBulkEmail = async () => {
        if (!bulkEmailSubject.trim() || !bulkEmailMessage.trim()) {
            alert('Please fill in both subject and message fields');
            return;
        }

        try {
            setSendingBulkEmail(true);

            const recipients = activeTab === 'followers'
                ? followers.filter(f => selectedFollowers.has(f.id))
                : customers.filter(c => selectedCustomers.has(c.id));

            // Use your existing API service
            await sendBulkEmail(
                recipients.map(r => ({
                    id: r.id,
                    email: r.email,
                    name: r.name
                })),
                bulkEmailSubject,
                bulkEmailMessage,
                'client_communication'
            );

            alert(`Bulk email sent to ${recipients.length} recipients!`);
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

    const ContactActions = ({ person }) => (
        <div className="flex space-x-2">
            <button
                onClick={() => handleSendMessage(person)}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Send Message"
            >
                <MessageCircle className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleSendEmail(person)}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                title="Send Email"
            >
                <Mail className="w-4 h-4" />
            </button>
            <button
                onClick={() => handlePhoneCall(person)}
                className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
                        <p className="text-gray-600 mb-4">Please log in to view your clients</p>
                        <button
                            onClick={() => merchantAuthService.logout()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-600">Loading your clients...</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Clients</h1>
                            <p className="text-gray-600">Manage your followers and customers</p>
                            {authStatus && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Logged in as: {authStatus.merchant?.first_name || 'Unknown'}
                                </p>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={debugAuth}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded transition-colors"
                                title="Debug Authentication"
                            >
                                Debug Auth
                            </button>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Error loading client data</span>
                        </div>
                        <p className="text-red-600 mt-1">{error}</p>
                        <div className="mt-2 space-x-2">
                            <button
                                onClick={handleRefresh}
                                className="text-red-600 hover:text-red-700 underline text-sm"
                            >
                                Try again
                            </button>
                            {error.includes('session has expired') && (
                                <button
                                    onClick={() => merchantAuthService.logout()}
                                    className="text-red-600 hover:text-red-700 underline text-sm"
                                >
                                    Go to login
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('followers')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'followers'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Followers ({followers.length})</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('customers')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'customers'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>Customers ({customers.length})</span>
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Sort */}
                    <div className="flex space-x-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Sort by Name</option>
                            {activeTab === 'followers' ? (
                                <>
                                    <option value="followedSince">Followed Since</option>
                                    <option value="lastActive">Last Active</option>
                                </>
                            ) : (
                                <>
                                    <option value="lastBookingDate">Last Booking</option>
                                    <option value="totalBookings">Total Bookings</option>
                                    <option value="totalSpent">Total Spent</option>
                                </>
                            )}
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Booking Type Filter (only for customers) */}
                    {activeTab === 'customers' && (
                        <select
                            value={filterBookingType}
                            onChange={(e) => setFilterBookingType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Bookings</option>
                            <option value="service">Service Bookings</option>
                            <option value="offer">Offer Bookings</option>
                        </select>
                    )}
                </div>

                {/* Bulk Actions */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={activeTab === 'followers' ? handleSelectAllFollowers : handleSelectAllCustomers}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                            {(activeTab === 'followers' && selectedFollowers.size === filteredFollowers.length) ||
                                (activeTab === 'customers' && selectedCustomers.size === filteredCustomers.length) ? (
                                <CheckSquare className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            <span>Select All</span>
                        </button>
                        {((activeTab === 'followers' && selectedFollowers.size > 0) ||
                            (activeTab === 'customers' && selectedCustomers.size > 0)) && (
                                <span className="text-sm text-gray-600">
                                    {activeTab === 'followers' ? selectedFollowers.size : selectedCustomers.size} selected
                                </span>
                            )}
                    </div>

                    {((activeTab === 'followers' && selectedFollowers.size > 0) ||
                        (activeTab === 'customers' && selectedCustomers.size > 0)) && (
                            <button
                                onClick={() => setShowBulkEmail(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                            >
                                <Mail className="w-4 h-4" />
                                <span>Bulk Email</span>
                            </button>
                        )}
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {activeTab === 'followers' ? (
                        filteredFollowers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    {followers.length === 0 ? 'No followers yet' : 'No followers found'}
                                </p>
                                {followers.length === 0 && (
                                    <p className="text-gray-400 text-sm mt-2">
                                        Share your store to gain followers!
                                    </p>
                                )}
                            </div>
                        ) : (
                            filteredFollowers.map((follower) => (
                                <div
                                    key={follower.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => handleSelectFollower(follower.id)}
                                            className="text-gray-600 hover:text-gray-800"
                                        >
                                            {selectedFollowers.has(follower.id) ? (
                                                <CheckSquare className="w-5 h-5 text-blue-500" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                        <div className="relative">
                                            <img
                                                src={follower.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.name)}&background=random`}
                                                alt={follower.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            {follower.isVip && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                                    <Star className="w-2 h-2 text-yellow-800" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{follower.name}</h3>
                                            <p className="text-sm text-gray-600">{follower.email}</p>
                                            <p className="text-sm text-gray-500">{follower.phone}</p>
                                            <p className="text-xs text-gray-400">
                                                Following since {new Date(follower.followedSince).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <ContactActions person={follower} />
                                </div>
                            ))
                        )
                    ) : (
                        filteredCustomers.length === 0 ? (
                            <div className="text-center py-12">
                                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    {customers.length === 0 ? 'No customers yet' : 'No customers found'}
                                </p>
                                {customers.length === 0 && (
                                    <p className="text-gray-400 text-sm mt-2">
                                        Enable bookings to start getting customers!
                                    </p>
                                )}
                            </div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => handleSelectCustomer(customer.id)}
                                            className="text-gray-600 hover:text-gray-800"
                                        >
                                            {selectedCustomers.has(customer.id) ? (
                                                <CheckSquare className="w-5 h-5 text-blue-500" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                        <div className="relative">
                                            <img
                                                src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`}
                                                alt={customer.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            {customer.isVip && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                                    <Star className="w-2 h-2 text-yellow-800" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.bookingType === 'service'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {customer.bookingType === 'service' ? 'Service' : 'Offer'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{customer.email}</p>
                                            <p className="text-sm text-gray-500">{customer.phone}</p>
                                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                                                <span>Last booking: {customer.lastBookingDate ? new Date(customer.lastBookingDate).toLocaleDateString() : 'N/A'}</span>
                                                <span>{customer.totalBookings} bookings</span>
                                                <span>{customer.totalSpent} total</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ContactActions person={customer} />
                                </div>
                            ))
                        )
                    )}
                </div>

                {/* Bulk Email Modal */}
                {showBulkEmail && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Bulk Email</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={bulkEmailSubject}
                                        onChange={(e) => setBulkEmailSubject(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter email subject"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        value={bulkEmailMessage}
                                        onChange={(e) => setBulkEmailMessage(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your message"
                                    />
                                </div>
                                <div className="text-sm text-gray-600">
                                    Sending to {activeTab === 'followers' ? selectedFollowers.size : selectedCustomers.size} recipients
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowBulkEmail(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkEmail}
                                    disabled={sendingBulkEmail}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
                                >
                                    {sendingBulkEmail ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    <span>Send Email</span>
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