import React, { useState, useEffect } from 'react';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService'; // Use your existing auth service
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube, FaTiktok, FaPinterest, FaSnapchat, FaWhatsapp, FaDiscord, FaTumblr, FaReddit, FaVimeo, FaGithub, FaFlickr } from 'react-icons/fa';
import { FiEdit, FiTrash, FiExternalLink, FiPlus } from 'react-icons/fi';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../../elements/Modal';

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

    // Social media platforms
    const socialMediaPlatforms = [
        'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 
        'tiktok', 'pinterest', 'snapchat', 'whatsapp', 'discord', 
        'tumblr', 'reddit', 'vimeo', 'github', 'flickr'
    ];

    // Get auth headers using your existing auth service
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

    // Get merchant's store using your auth service
    const getMerchantStore = async () => {
        try {
            console.log('🔍 Fetching merchant stores...');
            
            // Check if authenticated first
            if (!checkAuthStatus()) {
                throw new Error('Authentication required');
            }
            
            const token = merchantAuthService.getToken();
            console.log('🎫 Using token:', token ? 'Found' : 'Not found');
            
            const response = await fetch('${import.meta.env.VITE_API_BASE_URL}/api/v1/stores/merchant/my-stores', {
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

    // Fetch social media links for the store
    const fetchSocialLinks = async (storeId) => {
        try {
            console.log('📱 Fetching social links for store:', storeId);
            
            if (!checkAuthStatus()) {
                return [];
            }
            
            const token = merchantAuthService.getToken();
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/merchant/socials/${storeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Socials response status:', response.status);

            // 404 is OK for socials - means no social links exist yet
            if (response.status === 404) {
                console.log('📭 No social links found yet - this is normal for new stores');
                return [];
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Socials fetch failed:', errorData);
                
                if (response.status === 401) {
                    throw new Error('Authentication failed while fetching social links.');
                }
                
                throw new Error(errorData.message || `Failed to fetch social links (${response.status})`);
            }

            const data = await response.json();
            console.log('✅ Socials data received:', data);
            
            return data.success ? (data.socials || []) : [];
            
        } catch (error) {
            console.error('💥 Error fetching social links:', error);
            // Don't throw - just return empty array for social links
            return [];
        }
    };

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('🚀 Starting socials page data load...');
                console.log('🔐 Auth status:', merchantAuthService.isAuthenticated());
                console.log('👤 Current merchant:', merchantAuthService.getCurrentMerchant());
                
                // Check authentication first
                if (!merchantAuthService.isAuthenticated()) {
                    throw new Error('Your session has expired. Please log in again.');
                }
                
                // Get the merchant's store
                const merchantStoreId = await getMerchantStore();
                setStoreId(merchantStoreId);
                
                // Fetch social media links
                const socials = await fetchSocialLinks(merchantStoreId);
                setSocialLinks(socials);
                
                console.log(`📋 Loaded ${socials.length} social links`);
                
            } catch (error) {
                console.error('💥 Error loading socials data:', error);
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

        loadData();
    }, []);

    // Show success message temporarily
    const showSuccess = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 3000);
    };

    // Show error message temporarily  
    const showError = (message) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    // Open modal to add a new social link
    const handleAddSocial = () => {
        if (!checkAuthStatus()) return;
        
        setEditing(null);
        setNewSocial({ platform: '', link: '' });
        setIsModalOpen(true);
    };

    // Handle creating a new social media link
    const handleCreateSocial = async (e) => {
        e.preventDefault();
        
        if (!newSocial.platform || !newSocial.link) {
            showError('Please fill in all fields');
            return;
        }

        // Validate URL format
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(newSocial.link)) {
            showError('Please enter a valid URL starting with http:// or https://');
            return;
        }

        if (!storeId) {
            showError('Store ID not available. Please refresh the page.');
            return;
        }

        if (!checkAuthStatus()) return;

        try {
            setSubmitting(true);
            
            console.log('➕ Creating social link:', { platform: newSocial.platform, link: newSocial.link });
            
            const response = await fetch('${import.meta.env.VITE_API_BASE_URL}/api/v1/socials', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    store_id: storeId,
                    platform: newSocial.platform,
                    link: newSocial.link
                })
            });

            const data = await response.json();
            console.log('📡 Create response:', data);

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => merchantAuthService.logout(), 2000);
                    return;
                }
                throw new Error(data.message || 'Failed to create social link');
            }

            setSocialLinks([...socialLinks, data.social]);
            setIsModalOpen(false);
            setNewSocial({ platform: '', link: '' });
            showSuccess('Social media link added successfully!');
            
            console.log('✅ Social link created successfully');
        } catch (error) {
            console.error('💥 Create social error:', error);
            showError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle editing a social media link
    const handleEditSocial = (social) => {
        if (!checkAuthStatus()) return;
        
        setEditing(social);
        setNewSocial({ platform: social.platform, link: social.link });
        setIsModalOpen(true);
    };

    // Handle updating the social media link
    const handleUpdateSocial = async (e) => {
        e.preventDefault();
        
        if (!editing || !newSocial.platform || !newSocial.link) {
            showError('Please fill in all fields');
            return;
        }

        // Validate URL format
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(newSocial.link)) {
            showError('Please enter a valid URL starting with http:// or https://');
            return;
        }

        if (!checkAuthStatus()) return;

        try {
            setSubmitting(true);
            
            console.log('✏️ Updating social link:', editing.id);
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/socials/${editing.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    platform: newSocial.platform,
                    link: newSocial.link
                })
            });

            const data = await response.json();
            console.log('📡 Update response:', data);

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => merchantAuthService.logout(), 2000);
                    return;
                }
                throw new Error(data.message || 'Failed to update social link');
            }

            setSocialLinks(socialLinks.map(social => 
                social.id === editing.id ? data.social : social
            ));
            setIsModalOpen(false);
            setEditing(null);
            setNewSocial({ platform: '', link: '' });
            showSuccess('Social media link updated successfully!');
            
            console.log('✅ Social link updated successfully');
        } catch (error) {
            console.error('💥 Update social error:', error);
            showError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle deleting a social media link
    const handleDeleteSocial = async (id) => {
        if (!window.confirm('Are you sure you want to delete this social media link?')) {
            return;
        }

        if (!checkAuthStatus()) return;

        try {
            console.log('🗑️ Deleting social link:', id);
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/socials/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log('📡 Delete response:', data);

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => merchantAuthService.logout(), 2000);
                    return;
                }
                throw new Error(data.message || 'Failed to delete social link');
            }

            setSocialLinks(socialLinks.filter((social) => social.id !== id));
            showSuccess('Social media link deleted successfully!');
            
            console.log('✅ Social link deleted successfully');
        } catch (error) {
            console.error('💥 Delete social error:', error);
            showError(error.message);
        }
    };

    // Get platform icon
    const getPlatformIcon = (platform) => {
        const iconProps = { className: "w-5 h-5" };
        
        switch (platform.toLowerCase()) {
            case 'facebook':
                return <FaFacebook {...iconProps} className="w-5 h-5 text-blue-600" />;
            case 'instagram':
                return <FaInstagram {...iconProps} className="w-5 h-5 text-pink-600" />;
            case 'twitter':
                return <FaTwitter {...iconProps} className="w-5 h-5 text-blue-400" />;
            case 'linkedin':
                return <FaLinkedin {...iconProps} className="w-5 h-5 text-blue-700" />;
            case 'youtube':
                return <FaYoutube {...iconProps} className="w-5 h-5 text-red-600" />;
            case 'tiktok':
                return <FaTiktok {...iconProps} className="w-5 h-5 text-black" />;
            case 'pinterest':
                return <FaPinterest {...iconProps} className="w-5 h-5 text-red-500" />;
            case 'snapchat':
                return <FaSnapchat {...iconProps} className="w-5 h-5 text-yellow-400" />;
            case 'whatsapp':
                return <FaWhatsapp {...iconProps} className="w-5 h-5 text-green-600" />;
            case 'discord':
                return <FaDiscord {...iconProps} className="w-5 h-5 text-blue-500" />;
            case 'tumblr':
                return <FaTumblr {...iconProps} className="w-5 h-5 text-indigo-600" />;
            case 'reddit':
                return <FaReddit {...iconProps} className="w-5 h-5 text-orange-600" />;
            case 'vimeo':
                return <FaVimeo {...iconProps} className="w-5 h-5 text-blue-600" />;
            case 'github':
                return <FaGithub {...iconProps} className="w-5 h-5 text-black" />;
            case 'flickr':
                return <FaFlickr {...iconProps} className="w-5 h-5 text-blue-500" />;
            default:
                return <span className="w-5 h-5 text-gray-600">🌐</span>;
        }
    };

    // Get platform display name
    const getPlatformDisplayName = (platform) => {
        return platform.charAt(0).toUpperCase() + platform.slice(1);
    };

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('🚀 Starting socials page data load...');
                console.log('🔐 Auth status:', merchantAuthService.isAuthenticated());
                
                const currentMerchant = merchantAuthService.getCurrentMerchant();
                console.log('👤 Current merchant:', currentMerchant);
                
                // Check authentication first
                if (!merchantAuthService.isAuthenticated()) {
                    throw new Error('Your session has expired. Please log in again.');
                }
                
                // Get the merchant's store
                const merchantStoreId = await getMerchantStore();
                setStoreId(merchantStoreId);
                
                // Fetch social media links
                const socials = await fetchSocialLinks(merchantStoreId);
                setSocialLinks(socials);
                
                console.log(`📋 Loaded ${socials.length} social links`);
                
            } catch (error) {
                console.error('💥 Error loading socials data:', error);
                setError(error.message);
                
                // If authentication error, redirect after showing message
                if (error.message.includes('session has expired') || 
                    error.message.includes('Authentication failed') ||
                    error.message.includes('Authentication required')) {
                    setTimeout(() => {
                        merchantAuthService.logout();
                    }, 3000);
                }
            } finally {
                setLoading(false);
            }
        };

        // Only load if we have the auth service initialized
        if (merchantAuthService.isInitialized) {
            loadData();
        } else {
            // Wait a bit for auth service to initialize
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

    if (loading) {
        return (
            <Layout title="Social Media Links">
                <div className="max-w-4xl mx-auto py-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
                        <span className="text-gray-600">Loading social media links...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Social Media Links">
            <div className="max-w-4xl mx-auto py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
                        <p className="text-gray-600 mt-1">
                            {storeData ? `Manage social links for ${storeData.name}` : 'Manage your store\'s social media presence'}
                        </p>
                    </div>
                    {!error && storeId && (
                        <button
                            onClick={handleAddSocial}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Social Link
                        </button>
                    )}
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Social Links</h3>
                            <p className="text-gray-600 mb-6">{error}</p>
                            
                            {error.includes('No store found') ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500">
                                        You need to create a store before managing social media links.
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
                    /* Social Links List - Only show if no error */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {socialLinks.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {socialLinks.map((social) => (
                                    <div key={social.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Platform Icon */}
                                                <div className="p-3 bg-gray-100 rounded-lg">
                                                    {getPlatformIcon(social.platform)}
                                                </div>
                                                
                                                {/* Platform Details */}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        {getPlatformDisplayName(social.platform)}
                                                    </h3>
                                                    <a
                                                        href={social.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                                                    >
                                                        {social.link.length > 50 ? social.link.substring(0, 50) + '...' : social.link}
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditSocial(social)}
                                                    className="flex items-center gap-1 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                                                >
                                                    <FiEdit className="w-4 h-4" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSocial(social.id)}
                                                    className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <FiTrash className="w-4 h-4" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiPlus className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No social links yet</h3>
                                <p className="text-gray-600 mb-6">
                                    Connect your social media accounts to help customers find and follow your store.
                                </p>
                                <button
                                    onClick={handleAddSocial}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Your First Social Link
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tips Section - Only show if no error */}
                {!error && (
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="font-semibold text-blue-900 mb-3">💡 Tips for Social Media Links</h3>
                        <ul className="text-blue-800 text-sm space-y-2">
                            <li>• Use your main business page URLs, not personal profiles</li>
                            <li>• Make sure your social media profiles are public and active</li>
                            <li>• Keep your social media content aligned with your store's brand</li>
                            <li>• Regular posting helps maintain customer engagement</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Add/Edit Social Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setEditing(null);
                    setNewSocial({ platform: '', link: '' });
                }} 
                title={editing ? 'Edit Social Media Link' : 'Add Social Media Link'}
            >
                <form onSubmit={editing ? handleUpdateSocial : handleCreateSocial} className="space-y-6">
                    {/* Platform Selection */}
                    <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
                            Platform <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="platform"
                            value={newSocial.platform}
                            onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                            disabled={submitting}
                        >
                            <option value="">Select a Platform</option>
                            {socialMediaPlatforms.map((platform) => (
                                <option key={platform} value={platform}>
                                    {getPlatformDisplayName(platform)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* URL Input */}
                    <div>
                        <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                            URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            id="link"
                            value={newSocial.link}
                            onChange={(e) => setNewSocial({ ...newSocial, link: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="https://facebook.com/yourstore"
                            required
                            disabled={submitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the full URL including https://
                        </p>
                    </div>

                    {/* URL Preview */}
                    {newSocial.platform && newSocial.link && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 mb-2">Preview:</p>
                            <div className="flex items-center gap-3">
                                {getPlatformIcon(newSocial.platform)}
                                <span className="font-medium">{getPlatformDisplayName(newSocial.platform)}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-blue-600 text-sm">{newSocial.link}</span>
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
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {editing ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                editing ? 'Update Social Link' : 'Add Social Link'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default Socials;