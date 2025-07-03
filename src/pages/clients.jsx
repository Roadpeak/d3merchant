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
    ArrowUpDown
} from 'lucide-react';

const ClientsPage = () => {
    const [followers, setFollowers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
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

    // API Configuration - Fixed environment variable access
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

    const getAuthToken = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem('authToken');
        }
        return null;
    };

    const getStoreName = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem('storeName') || 'Your Store';
        }
        return 'Your Store';
    };

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

    // Mock data for demonstration
    useEffect(() => {
        // Simulate API calls
        const loadData = async () => {
            try {
                setLoading(true);

                // Mock followers data
                const mockFollowers = [
                    {
                        id: 1,
                        name: 'John Doe',
                        email: 'john.doe@email.com',
                        phone: '+1234567890',
                        avatar: null,
                        followedSince: '2024-01-15',
                        isVip: false,
                        lastActive: '2024-03-15'
                    },
                    {
                        id: 2,
                        name: 'Jane Smith',
                        email: 'jane.smith@email.com',
                        phone: '+1234567891',
                        avatar: null,
                        followedSince: '2024-02-20',
                        isVip: true,
                        lastActive: '2024-03-14'
                    },
                    {
                        id: 3,
                        name: 'Mike Johnson',
                        email: 'mike.johnson@email.com',
                        phone: '+1234567892',
                        avatar: null,
                        followedSince: '2024-03-01',
                        isVip: false,
                        lastActive: '2024-03-13'
                    }
                ];

                // Mock customers data
                const mockCustomers = [
                    {
                        id: 1,
                        name: 'Sarah Wilson',
                        email: 'sarah.wilson@email.com',
                        phone: '+1234567893',
                        avatar: null,
                        bookingType: 'service',
                        lastBookingDate: '2024-03-10',
                        totalBookings: 5,
                        totalSpent: '$450.00',
                        isVip: true,
                        bookingDetails: 'Hair Styling Service'
                    },
                    {
                        id: 2,
                        name: 'David Brown',
                        email: 'david.brown@email.com',
                        phone: '+1234567894',
                        avatar: null,
                        bookingType: 'offer',
                        lastBookingDate: '2024-03-08',
                        totalBookings: 2,
                        totalSpent: '$120.00',
                        isVip: false,
                        bookingDetails: 'Special Discount Offer'
                    },
                    {
                        id: 3,
                        name: 'Emma Davis',
                        email: 'emma.davis@email.com',
                        phone: '+1234567895',
                        avatar: null,
                        bookingType: 'service',
                        lastBookingDate: '2024-03-12',
                        totalBookings: 8,
                        totalSpent: '$680.00',
                        isVip: true,
                        bookingDetails: 'Massage Therapy'
                    }
                ];

                setFollowers(mockFollowers);
                setCustomers(mockCustomers);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Handle individual contact actions
    const handleSendMessage = (person) => {
        // This would integrate with your chat interface
        console.log('Navigate to chat with:', person.name);
        // You could emit an event or use routing to navigate to chat
    };

    const handleSendEmail = (person) => {
        const subject = `Message from ${getStoreName()}`;
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

    // Bulk email handler
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

            // Here you would make an API call to send bulk emails
            console.log('Sending bulk email to:', recipients.length, 'recipients');
            console.log('Subject:', bulkEmailSubject);
            console.log('Message:', bulkEmailMessage);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            alert(`Bulk email sent to ${recipients.length} recipients!`);
            setShowBulkEmail(false);
            setBulkEmailSubject('');
            setBulkEmailMessage('');
            setSelectedFollowers(new Set());
            setSelectedCustomers(new Set());
        } catch (error) {
            console.error('Failed to send bulk email:', error);
            alert('Failed to send bulk email. Please try again.');
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

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Clients</h1>
                    <p className="text-gray-600">Manage your followers and customers</p>
                </div>

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
                                <p className="text-gray-500">No followers found</p>
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
                                <p className="text-gray-500">No customers found</p>
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
                                                <span>Last booking: {new Date(customer.lastBookingDate).toLocaleDateString()}</span>
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