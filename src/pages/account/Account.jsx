import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
import BranchManagement from '../../components/BranchManagement';
import { uploadStoreLogo, updateStoreProfile } from '../../services/api_service';

const AccountPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [merchantInfo, setMerchantInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [branches, setBranches] = useState([]);
    const [editingProfile, setEditingProfile] = useState(false);
    const [editingStore, setEditingStore] = useState(false);
    
    // Logo upload states
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [editingLogo, setEditingLogo] = useState(false);
    
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        businessType: '',
        taxId: '',
        website: ''
    });
    
    const [storeData, setStoreData] = useState({
        name: '',
        location: '',
        phoneNumber: '',
        email: '',
        description: '',
        openingTime: '',
        closingTime: '',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        websiteUrl: '',
        logoUrl: ''
    });

    // Get merchant info and store details
    const getMerchantInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!merchantAuthService.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const response = await merchantAuthService.getCurrentMerchantProfile();
            
            if (!response) {
                return;
            }

            if (!response.success) {
                throw new Error(response.message || 'Failed to load profile information');
            }

            const merchantProfile = response.merchantProfile;
            
            setMerchantInfo(merchantProfile);
            
            // Set profile data
            setProfileData({
                firstName: merchantProfile.first_name || '',
                lastName: merchantProfile.last_name || '',
                email: merchantProfile.email_address || '',
                phoneNumber: merchantProfile.phone_number || '',
                businessType: 'Retail',
                taxId: '',
                website: merchantProfile.store?.website_url || ''
            });

            // Set store data including logo
            if (merchantProfile.store) {
                setStoreData({
                    name: merchantProfile.store.name || '',
                    location: merchantProfile.store.location || '',
                    phoneNumber: merchantProfile.store.phone_number || '',
                    email: merchantProfile.store.primary_email || '',
                    description: merchantProfile.store.description || '',
                    openingTime: merchantProfile.store.opening_time || '',
                    closingTime: merchantProfile.store.closing_time || '',
                    workingDays: merchantProfile.store.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    websiteUrl: merchantProfile.store.website_url || '',
                    logoUrl: merchantProfile.store.logo_url || merchantProfile.store.logo || ''
                });


                
                
                
                // Set logo preview if exists
                if (merchantProfile.store.logo_url || merchantProfile.store.logo) {
                    setLogoPreview(merchantProfile.store.logo_url || merchantProfile.store.logo);
                }
            }
            
        } catch (error) {
            console.error('Error fetching merchant info:', error);
            
            if (error.message?.includes('Authentication') || 
                error.message?.includes('401') || 
                error.message?.includes('403')) {
                return;
            }
            
            setError(error.message || 'Failed to load profile information');
            toast.error('Failed to load profile information');
        } finally {
            setLoading(false);
        }
    };

    // Handle logo file selection
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            
            setLogoFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle logo upload and store update
    const handleLogoUpload = async () => {
        if (!logoFile) {
            toast.error('Please select a logo to upload');
            return;
        }
        
        if (!merchantInfo?.store?.id) {
            toast.error('Store information not found');
            return;
        }
        
        try {
            setLogoUploading(true);
            
            console.log('DEBUG: Starting logo upload for store:', merchantInfo.store.id);
            
            // Upload the logo
            const uploadResult = await uploadStoreLogo(logoFile);
            
            if (!uploadResult.success || !uploadResult.logoUrl) {
                throw new Error('Failed to upload logo');
            }
            
            console.log('DEBUG: Logo uploaded successfully:', uploadResult.logoUrl);
            
            // Update store with new logo URL
            const updateResult = await updateStoreProfile(merchantInfo.store.id, {
                logo_url: uploadResult.logoUrl
            });
            
            if (updateResult && updateResult.success !== false) {
                // Update local state
                setStoreData(prev => ({
                    ...prev,
                    logoUrl: uploadResult.logoUrl
                }));
                
                // Refresh merchant info
                await getMerchantInfo();
                
                setEditingLogo(false);
                setLogoFile(null);
                toast.success('Store logo updated successfully!');
            } else {
                throw new Error(updateResult?.message || 'Failed to update store logo');
            }
            
        } catch (error) {
            console.error('Error updating store logo:', error);
            toast.error(error.message || 'Failed to update store logo');
        } finally {
            setLogoUploading(false);
        }
    };

    // Handle logo removal
    const handleLogoRemove = async () => {
        if (!merchantInfo?.store?.id) {
            toast.error('Store information not found');
            return;
        }
        
        try {
            setLogoUploading(true);
            
            // Update store to remove logo
            const updateResult = await updateStoreProfile(merchantInfo.store.id, {
                logo_url: null
            });
            
            if (updateResult && updateResult.success !== false) {
                // Update local state
                setStoreData(prev => ({
                    ...prev,
                    logoUrl: ''
                }));
                
                setLogoPreview(null);
                setLogoFile(null);
                setEditingLogo(false);
                
                // Refresh merchant info
                await getMerchantInfo();
                
                toast.success('Store logo removed successfully!');
            } else {
                throw new Error(updateResult?.message || 'Failed to remove store logo');
            }
            
        } catch (error) {
            console.error('Error removing store logo:', error);
            toast.error(error.message || 'Failed to remove store logo');
        } finally {
            setLogoUploading(false);
        }
    };

    // Handle profile update
    const handleProfileUpdate = async () => {
        try {
            setLoading(true);
            
            // Update merchant profile using the current merchant ID
            const updateResponse = await merchantAuthService.updateMerchantProfile(null, {
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email_address: profileData.email,
                phone_number: profileData.phoneNumber
            });

            if (updateResponse && (updateResponse.success !== false)) {
                // Refresh merchant info
                await getMerchantInfo();
                setEditingProfile(false);
                toast.success('Profile updated successfully!');
            } else {
                throw new Error(updateResponse?.message || 'Failed to update profile');
            }
            
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Handle store update (main branch info)
    const handleStoreUpdate = async () => {
        try {
            setLoading(true);
            
            // Update store information (which serves as main branch)
            const updateResponse = await merchantAuthService.updateStoreProfile(merchantInfo.store.id, {
                name: storeData.name,
                location: storeData.location,
                phone_number: storeData.phoneNumber,
                primary_email: storeData.email,
                description: storeData.description,
                opening_time: storeData.openingTime,
                closing_time: storeData.closingTime,
                working_days: storeData.workingDays,
                website_url: storeData.websiteUrl
            });

            if (updateResponse && (updateResponse.success !== false)) {
                // Refresh merchant info
                await getMerchantInfo();
                setEditingStore(false);
                toast.success('Store information updated successfully! This updates your main branch.');
            } else {
                throw new Error(updateResponse?.message || 'Failed to update store');
            }
            
        } catch (error) {
            console.error('Error updating store:', error);
            toast.error(error.message || 'Failed to update store information');
        } finally {
            setLoading(false);
        }
    };

    // Handle working days change for store
    const handleStoreWorkingDaysChange = (day) => {
        setStoreData(prev => ({
            ...prev,
            workingDays: prev.workingDays.includes(day)
                ? prev.workingDays.filter(d => d !== day)
                : [...prev.workingDays, day]
        }));
    };

    // Handle branches update callback
    const handleBranchesUpdate = (updatedBranches) => {
        setBranches(updatedBranches);
        console.log('Branches updated:', updatedBranches.length, 'branches');
    };

    const handleLogout = () => {
        merchantAuthService.logout();
    };

    useEffect(() => {
        getMerchantInfo();
    }, []);

    const tabs = [
        { name: 'Profile', icon: '👤' },
        { name: 'Store & Branches', icon: '🏪' },
        { name: 'Security', icon: '🔒' },
        { name: 'Subscription', icon: '💳' },
        { name: 'Activity', icon: '📊' }
    ];

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
                                                    </div>

                                                    <div className="space-y-4">
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
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Store & Branches Tab */}
                            {activeTab === 1 && (
                                <div className="space-y-6">
                                    {loading && <LoadingSpinner />}

                                    {merchantInfo && !loading && !error && (
                                        <>
                                            {/* Store Logo Section */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-gray-900">Store Logo</h3>
                                                        <p className="text-sm text-gray-600 mt-1">Upload or update your store logo</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingLogo(!editingLogo)}
                                                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        disabled={logoUploading}
                                                    >
                                                        {editingLogo ? 'Cancel' : 'Edit Logo'}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    {/* Logo Display */}
                                                    <div className="flex-shrink-0">
                                                        <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                                            {logoPreview || storeData.logoUrl ? (
                                                                <img 
                                                                    src={logoPreview || storeData.logoUrl} 
                                                                    alt="Store logo" 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="text-gray-400 text-center">
                                                                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="text-xs">No Logo</span>
                                                                </div>
                                                            )}
                                                            {/* Fallback for broken images */}
                                                            {(logoPreview || storeData.logoUrl) && (
                                                                <div className="text-gray-400 text-center hidden">
                                                                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="text-xs">Failed to Load</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Logo Upload Controls */}
                                                    <div className="flex-1">
                                                        {editingLogo ? (
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Select Logo Image
                                                                    </label>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={handleLogoChange}
                                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                                        disabled={logoUploading}
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        PNG, JPG, GIF up to 5MB
                                                                    </p>
                                                                </div>

                                                                <div className="flex gap-3">
                                                                    {logoFile && (
                                                                        <button
                                                                            onClick={handleLogoUpload}
                                                                            disabled={logoUploading}
                                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                                        >
                                                                            {logoUploading ? (
                                                                                <>
                                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                                                    Uploading...
                                                                                </>
                                                                            ) : (
                                                                                'Upload Logo'
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {(storeData.logoUrl || logoPreview) && (
                                                                        <button
                                                                            onClick={handleLogoRemove}
                                                                            disabled={logoUploading}
                                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                                        >
                                                                            Remove Logo
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p className="text-gray-700">
                                                                    {storeData.logoUrl ? 'Logo is set and visible on your store page' : 'No logo uploaded yet'}
                                                                </p>
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    A professional logo helps customers recognize your brand
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Store Information (Main Branch) */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-gray-900">Store Information</h3>
                                                        <p className="text-sm text-gray-600 mt-1">This information serves as your main branch details</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingStore(!editingStore)}
                                                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        disabled={loading}
                                                    >
                                                        {editingStore ? 'Cancel' : 'Edit Store'}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                                                            {editingStore ? (
                                                                <input
                                                                    type="text"
                                                                    value={storeData.name}
                                                                    onChange={(e) => setStoreData({...storeData, name: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.store?.name}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Store Phone</label>
                                                            {editingStore ? (
                                                                <input
                                                                    type="tel"
                                                                    value={storeData.phoneNumber}
                                                                    onChange={(e) => setStoreData({...storeData, phoneNumber: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.store?.phone_number || 'Not set'}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Store Email</label>
                                                            {editingStore ? (
                                                                <input
                                                                    type="email"
                                                                    value={storeData.email}
                                                                    onChange={(e) => setStoreData({...storeData, email: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.store?.primary_email || 'Not set'}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                                                            {editingStore ? (
                                                                <input
                                                                    type="time"
                                                                    value={storeData.openingTime}
                                                                    onChange={(e) => setStoreData({...storeData, openingTime: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.store?.opening_time || 'Not set'}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                                                            {editingStore ? (
                                                                <input
                                                                    type="time"
                                                                    value={storeData.closingTime}
                                                                    onChange={(e) => setStoreData({...storeData, closingTime: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.store?.closing_time || 'Not set'}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                                                            {editingStore ? (
                                                                <input
                                                                    type="url"
                                                                    value={storeData.websiteUrl}
                                                                    onChange={(e) => setStoreData({...storeData, websiteUrl: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={loading}
                                                                    placeholder="https://your-website.com"
                                                                />
                                                            ) : (
                                                                <p className="text-gray-900 py-2">{merchantInfo.store?.website_url || 'Not set'}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Store Address */}
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                                                    {editingStore ? (
                                                        <textarea
                                                            value={storeData.location}
                                                            onChange={(e) => setStoreData({...storeData, location: e.target.value})}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            disabled={loading}
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900 py-2">{merchantInfo.store?.location}</p>
                                                    )}
                                                </div>

                                                {/* Working Days */}
                                                {editingStore && (
                                                    <div className="mt-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {weekDays.map((day) => (
                                                                <label key={day} className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={storeData.workingDays.includes(day)}
                                                                        onChange={() => handleStoreWorkingDaysChange(day)}
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-sm">{day}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Store Description */}
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Description</label>
                                                    {editingStore ? (
                                                        <textarea
                                                            value={storeData.description}
                                                            onChange={(e) => setStoreData({...storeData, description: e.target.value})}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            disabled={loading}
                                                            placeholder="Brief description of your store"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900 py-2">{merchantInfo.store?.description || 'No description set'}</p>
                                                    )}
                                                </div>

                                                {editingStore && (
                                                    <div className="flex gap-3 mt-6">
                                                        <button 
                                                            onClick={handleStoreUpdate}
                                                            disabled={loading}
                                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                                    Updating...
                                                                </>
                                                            ) : (
                                                                'Update Store Info'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingStore(false);
                                                                // Reset store data
                                                                if (merchantInfo.store) {
                                                                    setStoreData({
                                                                        name: merchantInfo.store.name || '',
                                                                        location: merchantInfo.store.location || '',
                                                                        phoneNumber: merchantInfo.store.phone_number || '',
                                                                        email: merchantInfo.store.primary_email || '',
                                                                        description: merchantInfo.store.description || '',
                                                                        openingTime: merchantInfo.store.opening_time || '',
                                                                        closingTime: merchantInfo.store.closing_time || '',
                                                                        workingDays: merchantInfo.store.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                                                                        websiteUrl: merchantInfo.store.website_url || '',
                                                                        logoUrl: merchantInfo.store.logo_url || merchantInfo.store.logo || ''
                                                                    });
                                                                }
                                                            }}
                                                            disabled={loading}
                                                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Info Banner */}
                                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <div className="flex items-start">
                                                        <div className="text-blue-500 mr-3 mt-0.5">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-blue-900">Main Branch Information</h4>
                                                            <p className="text-sm text-blue-700 mt-1">
                                                                Your store information automatically serves as your main branch. 
                                                                Any changes here will update your main branch details across the system.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Branch Management Component */}
                                            {merchantInfo.store && (
                                                <BranchManagement 
                                                    storeId={merchantInfo.store.id}
                                                    onBranchesUpdate={handleBranchesUpdate}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 2 && (
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
                            {activeTab === 3 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Subscription & Billing</h3>
                                    <div className="space-y-6">
                                        <div className="p-6 border border-gray-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="text-lg font-medium text-gray-900">Current Plan</h4>
                                                    <p className="text-sm text-gray-600">Professional Plan</p>
                                                </div>
                                                <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                                                    Active
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-700">Monthly Fee:</span>
                                                    <p className="text-gray-900">$49.99</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Next Billing:</span>
                                                    <p className="text-gray-900">Aug 18, 2025</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Payment Method:</span>
                                                    <p className="text-gray-900">•••• •••• •••• 1234</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-4">
                                                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    Upgrade Plan
                                                </button>
                                                <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                                    Update Payment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 4 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Activity</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Login from Chrome</p>
                                                    <p className="text-sm text-gray-600">Today at 2:30 PM • IP: 192.168.1.1</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Store information updated</p>
                                                    <p className="text-sm text-gray-600">Yesterday at 4:15 PM</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium text-gray-900">New branch added</p>
                                                    <p className="text-sm text-gray-600">2 days ago at 10:22 AM</p>
                                                </div>
                                            </div>
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