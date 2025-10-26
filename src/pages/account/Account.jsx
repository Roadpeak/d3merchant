import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
import BranchManagement from '../../components/BranchManagement';
import { uploadStoreLogo, updateStoreProfile } from '../../services/api_service';
import {
    User,
    Store,
    // Shield,
    // CreditCard,
    // Activity,
    Camera,
    MapPin,
    Phone,
    Mail,
    Globe,
    Clock,
    Calendar,
    Settings,
    CheckCircle,
    AlertCircle,
    Upload,
    X,
    Edit3,
    Save,
    Building2,
    Briefcase,
    LogOut
} from 'lucide-react';

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
            toast.error(error.message || 'Failed to load profile information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMerchantInfo();
    }, []);

    // Handle profile input changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle store input changes
    const handleStoreChange = (e) => {
        const { name, value } = e.target;
        setStoreData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle working days toggle
    const toggleWorkingDay = (day) => {
        setStoreData(prev => {
            const currentDays = prev.workingDays || [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            return {
                ...prev,
                workingDays: newDays
            };
        });
    };

    // Handle working days change (alias for consistency with original)
    const handleStoreWorkingDaysChange = (day) => {
        toggleWorkingDay(day);
    };

    // Handle branches update callback
    const handleBranchesUpdate = (updatedBranches) => {
        setBranches(updatedBranches);
    };

    // Handle logo file selection
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            
            setLogoFile(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload store logo
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
            
            const uploadResult = await uploadStoreLogo(logoFile);
            
            if (!uploadResult.success || !uploadResult.logoUrl) {
                throw new Error('Failed to upload logo');
            }
            
            const updateResult = await updateStoreProfile(merchantInfo.store.id, {
                logo_url: uploadResult.logoUrl
            });
            
            if (updateResult && updateResult.success !== false) {
                setStoreData(prev => ({
                    ...prev,
                    logoUrl: uploadResult.logoUrl
                }));
                
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
            
            const updateResult = await updateStoreProfile(merchantInfo.store.id, {
                logo_url: null
            });
            
            if (updateResult && updateResult.success !== false) {
                setStoreData(prev => ({
                    ...prev,
                    logoUrl: ''
                }));
                
                setLogoPreview(null);
                setLogoFile(null);
                setEditingLogo(false);
                
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

    // Cancel logo editing
    const cancelLogoEdit = () => {
        setEditingLogo(false);
        setLogoFile(null);
        if (storeData.logoUrl) {
            setLogoPreview(storeData.logoUrl);
        } else {
            setLogoPreview(null);
        }
    };

    // Save profile changes
    const handleProfileUpdate = async () => {
        try {
            setLoading(true);
            
            const updateResponse = await merchantAuthService.updateMerchantProfile(null, {
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email_address: profileData.email,
                phone_number: profileData.phoneNumber
            });

            if (updateResponse && (updateResponse.success !== false)) {
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

    // Save store changes
    const handleStoreUpdate = async () => {
        try {
            setLoading(true);
            
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
                await getMerchantInfo();
                setEditingStore(false);
                toast.success('Store information updated successfully!');
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

    // Handle logout
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            merchantAuthService.logout();
            window.location.href = '/merchant/login';
        }
    };

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Define tabs (commented out unused ones)
    const tabs = [
        { id: 0, name: 'Profile', icon: User },
        { id: 1, name: 'Store Info', icon: Store },
        { id: 2, name: 'Branches', icon: Building2 },
        // { id: 3, name: 'Security', icon: Shield },
        // { id: 4, name: 'Billing', icon: CreditCard },
        // { id: 5, name: 'Activity', icon: Activity }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Header Section */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                    Account Settings
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600">
                                    Manage your profile, store, and business information
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
                            >
                                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="text-sm sm:text-base">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* Tabs Navigation */}
                        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex overflow-x-auto scrollbar-hide">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                                                activeTab === tab.id
                                                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-sm sm:text-base">{tab.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 sm:p-6 lg:p-8">
                            {loading && !merchantInfo ? (
                                <div className="flex items-center justify-center py-12 sm:py-16">
                                    <div className="text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm sm:text-base text-gray-600">Loading your information...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center py-12 sm:py-16">
                                    <div className="text-center max-w-md">
                                        <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
                                        <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
                                        <button
                                            onClick={getMerchantInfo}
                                            className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Profile Tab */}
                                    {activeTab === 0 && (
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                                                <User className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h3>
                                                                <p className="text-xs sm:text-sm text-gray-600">Update your personal details</p>
                                                            </div>
                                                        </div>
                                                        {!editingProfile ? (
                                                            <button
                                                                onClick={() => setEditingProfile(true)}
                                                                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                                                            >
                                                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                Edit
                                                            </button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={handleProfileUpdate}
                                                                    disabled={loading}
                                                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    Save
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
                                                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4 sm:p-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                First Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="firstName"
                                                                value={profileData.firstName}
                                                                onChange={handleProfileChange}
                                                                disabled={!editingProfile}
                                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Last Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="lastName"
                                                                value={profileData.lastName}
                                                                onChange={handleProfileChange}
                                                                disabled={!editingProfile}
                                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Email Address
                                                            </label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="email"
                                                                    name="email"
                                                                    value={profileData.email}
                                                                    onChange={handleProfileChange}
                                                                    disabled={!editingProfile}
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Phone Number
                                                            </label>
                                                            <div className="relative">
                                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="tel"
                                                                    name="phoneNumber"
                                                                    value={profileData.phoneNumber}
                                                                    onChange={handleProfileChange}
                                                                    disabled={!editingProfile}
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Store Info Tab */}
                                    {activeTab === 1 && (
                                        <div className="space-y-6">
                                            {/* Store Logo Section */}
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                                                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Store Logo</h3>
                                                                <p className="text-xs sm:text-sm text-gray-600">Upload your business logo</p>
                                                            </div>
                                                        </div>
                                                        {!editingLogo ? (
                                                            <button
                                                                onClick={() => setEditingLogo(true)}
                                                                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                                                            >
                                                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                Change Logo
                                                            </button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={handleLogoUpload}
                                                                    disabled={!logoFile || logoUploading}
                                                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {logoUploading ? (
                                                                        <>
                                                                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                            Uploading...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                            Upload
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={cancelLogoEdit}
                                                                    disabled={logoUploading}
                                                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4 sm:p-6">
                                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                                        <div className="flex-shrink-0">
                                                            {logoPreview ? (
                                                                <div className="relative group">
                                                                    <img
                                                                        src={logoPreview}
                                                                        alt="Store Logo"
                                                                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-gray-200 shadow-lg"
                                                                    />
                                                                    {editingLogo && (
                                                                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-4 border-gray-200 shadow-lg">
                                                                    <Store className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {editingLogo && (
                                                            <div className="flex-1 w-full">
                                                                <label className="block w-full">
                                                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer">
                                                                        <div className="text-center">
                                                                            <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mb-3" />
                                                                            <p className="text-xs sm:text-sm text-gray-600 mb-1">
                                                                                Click to upload or drag and drop
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                PNG, JPG, GIF up to 5MB
                                                                            </p>
                                                                        </div>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={handleLogoChange}
                                                                            className="hidden"
                                                                        />
                                                                    </div>
                                                                </label>
                                                                {logoFile && (
                                                                    <p className="mt-3 text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                                        {logoFile.name} selected
                                                                    </p>
                                                                )}
                                                                
                                                                <div className="flex gap-3 mt-4">
                                                                    {logoFile && (
                                                                        <button
                                                                            onClick={handleLogoUpload}
                                                                            disabled={logoUploading}
                                                                            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            {logoUploading ? (
                                                                                <>
                                                                                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                                    Uploading...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                                    Upload Logo
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {(storeData.logoUrl || logoPreview) && (
                                                                        <button
                                                                            onClick={handleLogoRemove}
                                                                            disabled={logoUploading}
                                                                            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border border-red-300 text-red-600 text-xs sm:text-sm font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                        >
                                                                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                            Remove
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Store Information Section */}
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                                                <Store className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Store Details</h3>
                                                                <p className="text-xs sm:text-sm text-gray-600">Manage your store information</p>
                                                            </div>
                                                        </div>
                                                        {!editingStore ? (
                                                            <button
                                                                onClick={() => setEditingStore(true)}
                                                                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                                            >
                                                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                Edit
                                                            </button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={handleStoreUpdate}
                                                                    disabled={loading}
                                                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingStore(false);
                                                                        getMerchantInfo();
                                                                    }}
                                                                    disabled={loading}
                                                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4 sm:p-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Store Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={storeData.name}
                                                                onChange={handleStoreChange}
                                                                disabled={!editingStore}
                                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Location/Address
                                                            </label>
                                                            <div className="relative">
                                                                <MapPin className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="text"
                                                                    name="location"
                                                                    value={storeData.location}
                                                                    onChange={handleStoreChange}
                                                                    disabled={!editingStore}
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Phone Number
                                                            </label>
                                                            <div className="relative">
                                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="tel"
                                                                    name="phoneNumber"
                                                                    value={storeData.phoneNumber}
                                                                    onChange={handleStoreChange}
                                                                    disabled={!editingStore}
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Email Address
                                                            </label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="email"
                                                                    name="email"
                                                                    value={storeData.email}
                                                                    onChange={handleStoreChange}
                                                                    disabled={!editingStore}
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Opening Time
                                                            </label>
                                                            <div className="relative">
                                                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="time"
                                                                    name="openingTime"
                                                                    value={storeData.openingTime}
                                                                    onChange={handleStoreChange}
                                                                    disabled={!editingStore}
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Closing Time
                                                            </label>
                                                            <div className="relative">
                                                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="time"
                                                                    name="closingTime"
                                                                    value={storeData.closingTime}
                                                                    onChange={handleStoreChange}
                                                                    disabled={!editingStore}
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Website URL
                                                            </label>
                                                            <div className="relative">
                                                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                                <input
                                                                    type="url"
                                                                    name="websiteUrl"
                                                                    value={storeData.websiteUrl}
                                                                    onChange={handleStoreChange}
                                                                    disabled={!editingStore}
                                                                    placeholder="https://www.yourstore.com"
                                                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 transition-all text-sm sm:text-base"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Description
                                                            </label>
                                                            <textarea
                                                                name="description"
                                                                value={storeData.description}
                                                                onChange={handleStoreChange}
                                                                disabled={!editingStore}
                                                                rows="3"
                                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none transition-all text-sm sm:text-base"
                                                                placeholder="Tell customers about your store..."
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                                Working Days
                                                            </label>
                                                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                                                {weekDays.map(day => (
                                                                    <button
                                                                        key={day}
                                                                        type="button"
                                                                        onClick={() => editingStore && toggleWorkingDay(day)}
                                                                        disabled={!editingStore}
                                                                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                                                                            storeData.workingDays?.includes(day)
                                                                                ? 'bg-blue-600 text-white shadow-sm'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                        } ${!editingStore ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                                                    >
                                                                        {day.slice(0, 3)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Branches Tab */}
                                    {activeTab === 2 && (
                                        <div className="space-y-6">
                                            <BranchManagement 
                                                storeId={merchantInfo?.store?.id} 
                                                onBranchesUpdate={handleBranchesUpdate}
                                            />
                                        </div>
                                    )}

                                    {/* Security Tab - Commented Out */}
                                    {/* 
                                    {activeTab === 3 && (
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                                                            <Shield className="h-6 w-6 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                                                            <p className="text-sm text-gray-600">Manage your account security</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900 mb-4">Change Password</h4>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Current Password
                                                                    </label>
                                                                    <input
                                                                        type="password"
                                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        New Password
                                                                    </label>
                                                                    <input
                                                                        type="password"
                                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Confirm New Password
                                                                    </label>
                                                                    <input
                                                                        type="password"
                                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                                <button className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors">
                                                                    Update Password
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="pt-6 border-t border-gray-200">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">Enable 2FA</p>
                                                                    <p className="text-xs text-gray-600">Add an extra layer of security</p>
                                                                </div>
                                                                <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                                                                    Enable
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    */}

                                    {/* Billing Tab - Commented Out */}
                                    {/* 
                                    {activeTab === 4 && (
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                                            <CreditCard className="h-6 w-6 text-yellow-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
                                                            <p className="text-sm text-gray-600">Manage your subscription and payments</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-lg font-semibold text-gray-900">Premium Plan</h4>
                                                                <p className="text-sm text-gray-600">Your current subscription</p>
                                                            </div>
                                                            <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                                                Active
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                            <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                                                                <div className="text-2xl font-bold text-gray-900">$49.99</div>
                                                                <div className="text-sm text-gray-600">Monthly Fee</div>
                                                            </div>
                                                            <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                                                                <div className="text-2xl font-bold text-gray-900">Aug 18</div>
                                                                <div className="text-sm text-gray-600">Next Billing</div>
                                                            </div>
                                                            <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                                                                <div className="text-2xl font-bold text-gray-900">••••1234</div>
                                                                <div className="text-sm text-gray-600">Payment Method</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex gap-4">
                                                            <button className="flex-1 px-6 py-3 bg-yellow-600 text-white font-medium rounded-xl hover:bg-yellow-700 transition-colors">
                                                                Upgrade Plan
                                                            </button>
                                                            <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                                                Update Payment
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    */}

                                    {/* Activity Tab - Commented Out */}
                                    {/* 
                                    {activeTab === 5 && (
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                                                            <Activity className="h-6 w-6 text-red-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">Account Activity</h3>
                                                            <p className="text-sm text-gray-600">Recent actions and security events</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-medium text-gray-900">Successful Login</p>
                                                                    <p className="text-xs text-gray-500">2 minutes ago</p>
                                                                </div>
                                                                <p className="text-sm text-gray-600">Chrome on Windows • IP: 192.168.1.1</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    */}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AccountPage;