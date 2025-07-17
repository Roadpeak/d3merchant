import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';

const AccountPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [merchantInfo, setMerchantInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [branches, setBranches] = useState([]);
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        businessType: '',
        taxId: '',
        website: ''
    });
    const [newBranch, setNewBranch] = useState({
        name: '',
        address: '',
        phone: '',
        manager: '',
        email: ''
    });

    const getMerchantInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 Starting merchant info fetch...');
            
            // Debug: Check service status first
            const serviceStatus = merchantAuthService.getStatus();
            console.log('📊 Service Status:', serviceStatus);
            
            // Debug: Test basic API connection first
            try {
                console.log('🧪 Testing API connection...');
                const testResult = await merchantAuthService.testConnection();
                console.log('✅ API connection test result:', testResult);
            } catch (testError) {
                console.warn('⚠️ API connection test failed:', testError.message);
                // Continue anyway in case the test endpoint doesn't exist yet
            }
            
            // Check authentication
            console.log('🔐 Checking authentication...');
            if (!merchantAuthService.isAuthenticated()) {
                console.log('❌ User not authenticated');
                throw new Error('Authentication required');
            }
            console.log('✅ User is authenticated');
            
            // Debug: Log the request details
            const token = merchantAuthService.getToken();
            const merchant = merchantAuthService.getCurrentMerchant();
            console.log('📋 Request details:', {
                hasToken: !!token,
                tokenStart: token ? token.substring(0, 20) + '...' : 'None',
                merchantId: merchant?.id,
                merchantEmail: merchant?.email_address
            });
            
            // Try to fetch profile
            console.log('🔄 Fetching current merchant profile...');
            const response = await merchantAuthService.getCurrentMerchantProfile();
            
            // Handle logout scenario
            if (!response) {
                console.log('🚪 No response received - user may have been logged out');
                return;
            }
    
            if (!response.success) {
                console.error('❌ Profile fetch unsuccessful:', response);
                throw new Error(response.message || 'Failed to load profile information');
            }
    
            const merchantProfile = response.merchantProfile;
            console.log('✅ Merchant profile loaded successfully:', {
                id: merchantProfile.id,
                name: `${merchantProfile.first_name} ${merchantProfile.last_name}`,
                email: merchantProfile.email_address,
                hasStore: !!merchantProfile.store
            });
            
            // Set the merchant info
            setMerchantInfo(merchantProfile);
            
            // Set profile data for editing
            setProfileData({
                firstName: merchantProfile.first_name || '',
                lastName: merchantProfile.last_name || '',
                email: merchantProfile.email_address || '',
                phoneNumber: merchantProfile.phone_number || '',
                businessType: 'Retail', // Default value
                taxId: '', // Add if available in your backend
                website: merchantProfile.store?.website_url || ''
            });
            
            // Set branches data (mock data as in original)
            setBranches([
                {
                    id: 1,
                    name: merchantProfile.store?.name || 'Main Branch',
                    address: merchantProfile.store?.location || 'Address not set',
                    phone: merchantProfile.store?.phone_number || merchantProfile.phone_number,
                    manager: `${merchantProfile.first_name} ${merchantProfile.last_name}`,
                    email: merchantProfile.store?.primary_email || merchantProfile.email_address,
                    status: 'Active'
                }
            ]);
    
            console.log('✅ All merchant data set successfully');
            
        } catch (error) {
            console.error('💥 Error in getMerchantInfo:', error);
            
            // Enhanced error logging
            console.group('🔍 Error Details');
            console.log('Error message:', error.message);
            console.log('Error stack:', error.stack);
            console.log('Service status:', merchantAuthService.getStatus());
            console.groupEnd();
            
            // Check if it's an authentication error
            if (error.message?.includes('Authentication') || 
                error.message?.includes('session has expired') ||
                error.message?.includes('401') || 
                error.message?.includes('403')) {
                console.log('🚪 Authentication error detected');
                // The service will handle logout automatically
                return;
            }
            
            // For other errors, show error message
            const errorMessage = error.message || 'Failed to load profile information';
            setError(errorMessage);
            toast.error(errorMessage);
            
        } finally {
            setLoading(false);
            console.log('🏁 getMerchantInfo completed');
        }
    };
    const handleProfileUpdate = async () => {
        try {
            setLoading(true);
            // TODO: Implement profile update API call
            // const token = merchantAuthService.getToken();
            // const response = await fetch('/api/merchants/update-profile', {
            //     method: 'PUT',
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(profileData)
            // });
            
            // For now, just update the local state
            setMerchantInfo(prev => ({
                ...prev,
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email_address: profileData.email,
                phone_number: profileData.phoneNumber
            }));
            
            // Update auth data in storage
            const currentMerchant = merchantAuthService.getCurrentMerchant();
            merchantAuthService.updateMerchantProfile({
                ...currentMerchant,
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email_address: profileData.email,
                phone_number: profileData.phoneNumber
            });
            
            setEditingProfile(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBranch = () => {
        if (newBranch.name && newBranch.address) {
            setBranches([...branches, {
                id: branches.length + 1,
                ...newBranch,
                status: 'Active'
            }]);
            setNewBranch({ name: '', address: '', phone: '', manager: '', email: '' });
            setShowAddBranch(false);
            toast.success('Branch added successfully!');
        }
    };

    const handleDeleteBranch = (id) => {
        setBranches(branches.filter(branch => branch.id !== id));
        toast.success('Branch deleted successfully!');
    };

    const handleLogout = () => {
        merchantAuthService.logout();
    };

    useEffect(() => {
        getMerchantInfo();
    }, []);

    const tabs = [
        { name: 'Profile', icon: '👤' },
        { name: 'Security', icon: '🔒' },
        { name: 'Subscription', icon: '💳' },
        { name: 'Activity', icon: '📊' }
    ];

    // Loading component
    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
        </div>
    );

    // Error component
    const ErrorMessage = ({ message, onRetry }) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Profile</h3>
            <p className="text-red-700 mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
                Try Again
            </button>
        </div>
    );

    return (
        <Layout 
            title={`Good Day, ${merchantInfo?.first_name || 'Merchant'} 👋`}
            subtitle="Manage your merchant account and business information"
        >
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-gray-600 mt-2">Manage your merchant account and business information</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:w-64">
                            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="space-y-2">
                                    {tabs.map((tab, index) => (
                                        <button
                                            key={index}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${activeTab === index
                                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            onClick={() => setActiveTab(index)}
                                        >
                                            <span className="text-lg">{tab.icon}</span>
                                            <span className="font-medium">{tab.name}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Logout Button */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                                    >
                                        <span className="text-lg">🚪</span>
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </div>
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Profile Tab */}
                            {activeTab === 0 && (
                                <div className="space-y-6">
                                    {loading && <LoadingSpinner />}

                                    {error && (
                                        <ErrorMessage
                                            message={error}
                                            onRetry={getMerchantInfo}
                                        />
                                    )}

                                    {merchantInfo && !loading && !error && (
                                        <>
                                            {/* Business Overview Card */}
                                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h2 className="text-2xl font-bold">{merchantInfo.store?.name || 'Your Store'}</h2>
                                                        <p className="text-blue-100 mt-1">{merchantInfo.store?.location || 'Location not set'}</p>
                                                        <p className="text-blue-100 text-sm mt-2">
                                                            Member since {new Date(merchantInfo.joined).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-3xl">🏪</div>
                                                        <p className="text-sm text-blue-100 mt-1">
                                                            {branches.length} Branch{branches.length !== 1 ? 'es' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Personal Information */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                                                    <button
                                                        onClick={() => setEditingProfile(!editingProfile)}
                                                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        disabled={loading}
                                                    >
                                                        {editingProfile ? 'Cancel' : 'Edit'}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                            {editingProfile ? (
                                                                <input
                                                                    type="text"
                                                                    value={profileData.firstName}
                                                                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.first_name}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                            {editingProfile ? (
                                                                <input
                                                                    type="text"
                                                                    value={profileData.lastName}
                                                                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.last_name}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                                            {editingProfile ? (
                                                                <input
                                                                    type="email"
                                                                    value={profileData.email}
                                                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.email_address}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                                            {editingProfile ? (
                                                                <input
                                                                    type="tel"
                                                                    value={profileData.phoneNumber}
                                                                    onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.phone_number}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                                                            {editingProfile ? (
                                                                <select 
                                                                    value={profileData.businessType}
                                                                    onChange={(e) => setProfileData({...profileData, businessType: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                >
                                                                    <option value="Retail">Retail</option>
                                                                    <option value="Restaurant">Restaurant</option>
                                                                    <option value="Service">Service</option>
                                                                    <option value="E-commerce">E-commerce</option>
                                                                    <option value="Beauty & Salon">Beauty & Salon</option>
                                                                    <option value="Automotive">Automotive</option>
                                                                    <option value="Health & Fitness">Health & Fitness</option>
                                                                    <option value="Other">Other</option>
                                                                </select>
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{profileData.businessType}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                                                            {editingProfile ? (
                                                                <input
                                                                    type="text"
                                                                    value={profileData.taxId}
                                                                    onChange={(e) => setProfileData({...profileData, taxId: e.target.value})}
                                                                    placeholder="Enter Tax ID"
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{profileData.taxId || '***-***-1234'}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                                                            {editingProfile ? (
                                                                <input
                                                                    type="url"
                                                                    value={profileData.website}
                                                                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                                                                    placeholder="https://yourwebsite.com"
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{profileData.website || 'Not set'}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {editingProfile && (
                                                    <div className="flex gap-3 mt-6">
                                                        <button 
                                                            onClick={handleProfileUpdate}
                                                            disabled={loading}
                                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                'Save Changes'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingProfile(false);
                                                                // Reset form data
                                                                setProfileData({
                                                                    firstName: merchantInfo.first_name || '',
                                                                    lastName: merchantInfo.last_name || '',
                                                                    email: merchantInfo.email_address || '',
                                                                    phoneNumber: merchantInfo.phone_number || '',
                                                                    businessType: profileData.businessType,
                                                                    taxId: profileData.taxId,
                                                                    website: profileData.website
                                                                });
                                                            }}
                                                            disabled={loading}
                                                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Store Branches */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xl font-semibold text-gray-900">Store Branches</h3>
                                                    <button
                                                        onClick={() => setShowAddBranch(true)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                        disabled={loading}
                                                    >
                                                        <span>+</span> Add Branch
                                                    </button>
                                                </div>

                                                {/* Add Branch Form */}
                                                {showAddBranch && (
                                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                                                        <h4 className="font-medium text-gray-900 mb-4">Add New Branch</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <input
                                                                type="text"
                                                                placeholder="Branch Name"
                                                                value={newBranch.name}
                                                                onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Full Address"
                                                                value={newBranch.address}
                                                                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            <input
                                                                type="tel"
                                                                placeholder="Phone Number"
                                                                value={newBranch.phone}
                                                                onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Branch Manager"
                                                                value={newBranch.manager}
                                                                onChange={(e) => setNewBranch({ ...newBranch, manager: e.target.value })}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            <input
                                                                type="email"
                                                                placeholder="Branch Email"
                                                                value={newBranch.email}
                                                                onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="flex gap-3 mt-4">
                                                            <button
                                                                onClick={handleAddBranch}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                            >
                                                                Add Branch
                                                            </button>
                                                            <button
                                                                onClick={() => setShowAddBranch(false)}
                                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Branches List */}
                                                <div className="space-y-4">
                                                    {branches.map((branch) => (
                                                        <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <h4 className="font-semibold text-gray-900">{branch.name}</h4>
                                                                        <span className={`px-2 py-1 text-xs rounded-full ${branch.status === 'Active'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                            {branch.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                                        <div>
                                                                            <span className="font-medium">📍 Address:</span>
                                                                            <p>{branch.address}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-medium">📞 Phone:</span>
                                                                            <p>{branch.phone}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-medium">👨‍💼 Manager:</span>
                                                                            <p>{branch.manager}</p>
                                                                        </div>
                                                                    </div>
                                                                    {branch.email && (
                                                                        <div className="mt-2 text-sm text-gray-600">
                                                                            <span className="font-medium">✉️ Email:</span> {branch.email}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2 ml-4">
                                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                                        ✏️
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteBranch(branch.id)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 1 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                                                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Password</h4>
                                                <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                                            </div>
                                            <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                Change Password
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Login Notifications</h4>
                                                <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Subscription Tab */}
                            {activeTab === 2 && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Current Plan</h3>
                                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="text-2xl font-bold text-gray-900">Pro Plan</h4>
                                                    <p className="text-gray-600">Perfect for growing businesses</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-green-600">$49</div>
                                                    <div className="text-sm text-gray-600">/month</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-500">✓</span>
                                                    <span className="text-sm">Advanced Analytics</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-500">✓</span>
                                                    <span className="text-sm">50GB Storage</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-500">✓</span>
                                                    <span className="text-sm">Priority Support</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-500">✓</span>
                                                    <span className="text-sm">Multiple Branches</span>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-600">Storage Usage</span>
                                                    <span className="text-sm text-gray-600">10 GB of 50 GB</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                    Upgrade Plan
                                                </button>
                                                <button className="px-6 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    Cancel Subscription
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h3>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((item) => (
                                                <div key={item} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                    <div>
                                                        <div className="font-medium text-gray-900">Pro Plan - Monthly</div>
                                                        <div className="text-sm text-gray-600">Dec {item}, 2024</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium text-gray-900">$49.00</div>
                                                        <div className="text-sm text-green-600">Paid</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 3 && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
                                        <div className="space-y-4">
                                            {[
                                                { action: 'Profile updated', time: '2 hours ago', icon: '👤' },
                                                { action: 'New branch added', time: '1 day ago', icon: '🏪' },
                                                { action: 'Password changed', time: '3 days ago', icon: '🔒' },
                                                { action: 'Plan upgraded', time: '1 week ago', icon: '⬆️' }
                                            ].map((activity, index) => (
                                                <div key={index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                                                    <div className="text-2xl">{activity.icon}</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{activity.action}</div>
                                                        <div className="text-sm text-gray-600">{activity.time}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Login History</h3>
                                        <div className="space-y-3">
                                            {[
                                                { device: 'Chrome on Windows', location: 'Nairobi, Kenya', time: 'Current session' },
                                                { device: 'Safari on iPhone', location: 'Nairobi, Kenya', time: '2 hours ago' },
                                                { device: 'Chrome on Windows', location: 'Nairobi, Kenya', time: '1 day ago' }
                                            ].map((login, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{login.device}</div>
                                                        <div className="text-sm text-gray-600">{login.location}</div>
                                                    </div>
                                                    <div className="text-sm text-gray-600">{login.time}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AccountPage;