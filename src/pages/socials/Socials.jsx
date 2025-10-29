import React, { useState, useEffect } from 'react';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
import {
    Plus,
    Edit3,
    Trash2,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    Users,
    Share2,
    Globe,
    Smartphone,
    Monitor,
    Camera,
    MessageCircle,
    Play,
    Music,
    Image,
    Video,
    BookOpen,
    Code,
    Eye,
    X,
    Save,
    Lightbulb
} from 'lucide-react';

const Socials = () => {
    const [socialLinks, setSocialLinks] = useState([]);
    const [newSocial, setNewSocial] = useState({ platform: '', link: '' });
    const [editing, setEditing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [storeId, setStoreId] = useState(null);
    const [storeData, setStoreData] = useState(null);

    // Social media platforms with modern icons
    const socialMediaPlatforms = [
        { id: 'facebook', name: 'Facebook', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { id: 'instagram', name: 'Instagram', icon: Camera, color: 'text-pink-600', bgColor: 'bg-pink-50' },
        { id: 'twitter', name: 'Twitter', icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-50' },
        { id: 'linkedin', name: 'LinkedIn', icon: Users, color: 'text-blue-700', bgColor: 'bg-blue-50' },
        { id: 'youtube', name: 'YouTube', icon: Play, color: 'text-red-600', bgColor: 'bg-red-50' },
        { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-gray-800', bgColor: 'bg-gray-50' },
        { id: 'pinterest', name: 'Pinterest', icon: Image, color: 'text-red-500', bgColor: 'bg-red-50' },
        { id: 'snapchat', name: 'Snapchat', icon: Camera, color: 'text-yellow-400', bgColor: 'bg-yellow-50' },
        { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
        { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { id: 'tumblr', name: 'Tumblr', icon: BookOpen, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { id: 'reddit', name: 'Reddit', icon: MessageCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
        { id: 'vimeo', name: 'Vimeo', icon: Video, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { id: 'github', name: 'GitHub', icon: Code, color: 'text-gray-800', bgColor: 'bg-gray-50' },
        { id: 'flickr', name: 'Flickr', icon: Image, color: 'text-blue-500', bgColor: 'bg-blue-50' }
    ];

    // Get auth headers using existing auth service
    const getAuthHeaders = () => {
        const token = merchantAuthService.getToken();

        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        // Check if API key exists
        if (!import.meta.env.VITE_API_KEY) {
            console.error('VITE_API_KEY is not defined in environment variables');
            throw new Error('API configuration error. Please contact support.');
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

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stores/merchant/my-stores`, {
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
            console.error('Error fetching merchant store:', error);
            throw error;
        }
    };

    // Fetch social media links for the store
    const fetchSocialLinks = async (storeId) => {
        try {
            if (!checkAuthStatus()) {
                return [];
            }

            const token = merchantAuthService.getToken();

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/merchant/socials/${storeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': import.meta.env.VITE_API_KEY
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return [];
                }
                throw new Error(`Failed to fetch social links: ${response.status}`);
            }

            const data = await response.json();
            return data.socials || [];
        } catch (error) {
            console.error('Error fetching social links:', error);
            throw error;
        }
    };

    // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!checkAuthStatus()) {
                throw new Error('Authentication required');
            }

            // This will now work with proper authentication
            const fetchedStoreId = await socialsService.getMerchantStore();
            setStoreId(fetchedStoreId);

            // Get social links
            const links = await socialsService.getMerchantSocials(fetchedStoreId);
            setSocialLinks(links);

            // Get store data (optional - you can remove this if not needed)
            const storesResponse = await axiosInstance.get('/stores/merchant/my-stores', {
                headers: {
                    'Authorization': `Bearer ${merchantAuthService.getToken()}`,
                    'x-api-key': import.meta.env.VITE_API_KEY
                }
            });

            if (storesResponse.data?.stores?.length > 0) {
                setStoreData(storesResponse.data.stores[0]);
            }
        } catch (error) {
            console.error('Initialization error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    initializeData();
}, []);

    // Handle add social
    const handleAddSocial = () => {
        setEditing(null);
        setNewSocial({ platform: '', link: '' });
        setIsModalOpen(true);
    };

    // Handle edit social
    const handleEditSocial = (social) => {
        setEditing(social);
        setNewSocial({ platform: social.platform, link: social.link });
        setIsModalOpen(true);
    };

    // Handle create social
    const handleCreateSocial = async (e) => {
        e.preventDefault();

        if (!newSocial.platform || !newSocial.link) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/merchant/socials`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    storeId: storeId,
                    platform: newSocial.platform,
                    link: newSocial.link
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add social media link');
            }

            const data = await response.json();

            setSocialLinks([...socialLinks, data.social]);
            setSuccess('Social media link added successfully!');
            setIsModalOpen(false);
            setNewSocial({ platform: '', link: '' });

            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error creating social link:', error);
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle update social
    const handleUpdateSocial = async (e) => {
        e.preventDefault();

        if (!editing || !newSocial.platform || !newSocial.link) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/merchant/socials/${editing.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    platform: newSocial.platform,
                    link: newSocial.link
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update social media link');
            }

            const data = await response.json();

            setSocialLinks(socialLinks.map(social =>
                social.id === editing.id ? data.social : social
            ));

            setSuccess('Social media link updated successfully!');
            setIsModalOpen(false);
            setEditing(null);
            setNewSocial({ platform: '', link: '' });

            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error updating social link:', error);
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete social
    const handleDeleteSocial = async (socialId) => {
        if (!confirm('Are you sure you want to delete this social media link?')) {
            return;
        }

        try {
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/merchant/socials/${socialId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete social media link');
            }

            setSocialLinks(socialLinks.filter(social => social.id !== socialId));
            setSuccess('Social media link deleted successfully!');

            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error deleting social link:', error);
            setError(error.message);
        }
    };

    // Get platform info by ID
    const getPlatformInfo = (platformId) => {
        const platform = socialMediaPlatforms.find(p => p.id === platformId);
        return platform || {
            id: platformId,
            name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
            icon: Globe,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50'
        };
    };

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center">
                <div className="relative">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">Loading social media links...</p>
            </div>
        </div>
    );

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
                            Social Media Links
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            {storeData ? `Managing links for ${storeData.name}` : 'Connect your social media presence'}
                        </p>
                    </div>
                    {!error && storeId && (
                        <button
                            onClick={handleAddSocial}
                            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                        >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-sm sm:text-base">Add Platform</span>
                        </button>
                    )}
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
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{socialLinks.length}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Connected</div>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">24/7</div>
                        <div className="text-xs sm:text-sm text-gray-600">Accessible</div>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">∞</div>
                        <div className="text-xs sm:text-sm text-gray-600">Reach</div>
                    </div>
                </div>

                {error && (error.includes('No store found') || error.includes('session has expired') || error.includes('Authentication failed')) ? (
                    /* Error State */
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                        <div className="p-8 sm:p-12 text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unable to Load Social Links</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>

                            {error.includes('No store found') ? (
                                <div className="space-y-3">
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        You need to create a store before managing social media links.
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
                    /* Social Links List */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Connected Platforms</h3>
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Your social media presence</p>
                                    </div>
                                </div>
                                {socialLinks.length > 0 && (
                                    <span className="text-xs sm:text-sm text-indigo-600 font-medium">
                                        {socialLinks.length} platform{socialLinks.length !== 1 ? 's' : ''} connected
                                    </span>
                                )}
                            </div>
                        </div>

                        {socialLinks.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {socialLinks.map((social) => {
                                    const platformInfo = getPlatformInfo(social.platform);
                                    const Icon = platformInfo.icon;

                                    return (
                                        <div key={social.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start sm:items-center justify-between gap-3">
                                                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                                    <div className={`p-2 sm:p-3 ${platformInfo.bgColor} rounded-xl flex-shrink-0`}>
                                                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${platformInfo.color}`} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1">
                                                            {platformInfo.name}
                                                        </h3>
                                                        <a
                                                            href={social.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors group"
                                                        >
                                                            <Globe className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                                            <span className="text-xs sm:text-sm truncate">
                                                                {social.link}
                                                            </span>
                                                            <ExternalLink className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleEditSocial(social)}
                                                        className="p-1.5 sm:p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit link"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSocial(social.id)}
                                                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete link"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 sm:p-12 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Share2 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No social platforms connected</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-6">
                                    Connect your social media accounts to help customers find and follow your business online.
                                </p>
                                <button
                                    onClick={handleAddSocial}
                                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Your First Platform
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tips Section */}
                {!error && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-0.5 sm:mt-1" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2 sm:mb-3">Social Media Best Practices</h3>
                                <ul className="text-blue-800 text-xs sm:text-sm space-y-2">
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Use your business page URLs, not personal profiles</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Ensure your profiles are public and actively maintained</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Keep your brand consistent across all platforms</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Regular posting helps maintain customer engagement</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Social Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {editing ? 'Edit Social Media Link' : 'Add Social Media Link'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditing(null);
                                    setNewSocial({ platform: '', link: '' });
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={editing ? handleUpdateSocial : handleCreateSocial} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Platform Selection */}
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-700">
                                    Platform <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newSocial.platform}
                                    onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    required
                                    disabled={submitting}
                                >
                                    <option value="">Select a Platform</option>
                                    {socialMediaPlatforms.map((platform) => (
                                        <option key={platform.id} value={platform.id}>
                                            {platform.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* URL Input */}
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-gray-700">
                                    Profile URL <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    <input
                                        type="url"
                                        value={newSocial.link}
                                        onChange={(e) => setNewSocial({ ...newSocial, link: e.target.value })}
                                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                        placeholder="https://facebook.com/yourstore"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Enter the complete URL including https://
                                </p>
                            </div>

                            {/* URL Preview */}
                            {newSocial.platform && newSocial.link && (
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs sm:text-sm text-gray-700 mb-2">Preview:</p>
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        {(() => {
                                            const platformInfo = getPlatformInfo(newSocial.platform);
                                            const Icon = platformInfo.icon;
                                            return (
                                                <>
                                                    <div className={`p-1.5 sm:p-2 ${platformInfo.bgColor} rounded-lg flex-shrink-0`}>
                                                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${platformInfo.color}`} />
                                                    </div>
                                                    <span className="font-medium text-xs sm:text-sm text-gray-900">{platformInfo.name}</span>
                                                    <span className="text-gray-400 text-xs sm:text-sm">→</span>
                                                    <span className="text-indigo-600 text-xs sm:text-sm truncate">{newSocial.link}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditing(null);
                                        setNewSocial({ platform: '', link: '' });
                                    }}
                                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {editing ? 'Updating...' : 'Adding...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {editing ? 'Update Link' : 'Add Link'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Socials;