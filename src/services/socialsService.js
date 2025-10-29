// services/socialsService.js
import axiosInstance from "./axiosInstance";
import merchantAuthService from "./merchantAuthService";

// Helper function to get auth headers (consistent with api.js)
const getAuthHeaders = () => {
    const token = merchantAuthService.getToken();
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_KEY || 'API_KEY_12345ABCDEF!@#67890-xyZQvTPOl'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Helper function to handle API errors (consistent with api.js)
const handleApiError = (error, context = '') => {
    console.error(`API Error ${context}:`, error);

    // Handle authentication errors
    if (error.response?.status === 401) {
        merchantAuthService.logout();
        throw new Error('Session expired. Please log in again.');
    }

    // Handle other HTTP errors
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    }

    // Handle network errors
    if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your connection.');
    }

    throw error;
};

const socialsService = {
    // Get merchant's store ID using axiosInstance (consistent with api.js)
    getMerchantStore: async () => {
        try {
            console.log('Fetching merchant store...');

            const merchant = merchantAuthService.getCurrentMerchant();
            if (!merchant) {
                throw new Error('Merchant information not found. Please log in again.');
            }

            console.log('Getting stores for merchant:', merchant.id);

            // Use axiosInstance instead of fetch
            const response = await axiosInstance.get('/stores/merchant/my-stores', {
                headers: getAuthHeaders()
            });

            console.log('Store response:', response.data);

            const data = response.data;
            const stores = data?.stores || data || [];

            if (stores.length > 0) {
                console.log('Using store:', stores[0].name, '(' + stores[0].id + ')');
                return stores[0].id;
            }

            throw new Error('No store found for merchant. Please create a store first.');
        } catch (error) {
            console.error('Error fetching merchant store:', error);
            handleApiError(error, 'fetching merchant store');
        }
    },

    // Create a new social media link
    createSocial: async (storeId, platform, link) => {
        try {
            console.log('Creating social link:', { storeId, platform, link });

            const response = await axiosInstance.post('/socials', {
                store_id: storeId,
                platform: platform.toLowerCase(),
                link
            }, {
                headers: getAuthHeaders()
            });

            console.log('Social link created:', response.data);
            return response.data;
        } catch (error) {
            console.error('Create social error:', error);
            handleApiError(error, 'creating social link');
        }
    },

    // Get social links for a store (public access)
    getSocialsByStore: async (storeId) => {
        try {
            console.log('Fetching socials for store:', storeId);

            const response = await axiosInstance.get(`/socials/store/${storeId}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;
            return data.socials || [];
        } catch (error) {
            console.error('Get socials error:', error);
            // Return empty array for public endpoint failures
            return [];
        }
    },

    // Get social links for merchant's store
    getMerchantSocials: async (storeId) => {
        try {
            console.log('Fetching merchant socials for store:', storeId);

            // Try the merchant-specific endpoint first
            try {
                const response = await axiosInstance.get(`/merchant/socials/${storeId}`, {
                    headers: getAuthHeaders()
                });

                const data = response.data;
                return data.socials || [];
            } catch (merchantError) {
                console.log('Merchant socials endpoint failed, trying general endpoint');

                // Fallback to general socials endpoint
                const response = await axiosInstance.get(`/socials/store/${storeId}`, {
                    headers: getAuthHeaders()
                });

                const data = response.data;
                return data.socials || [];
            }
        } catch (error) {
            console.error('Get merchant socials error:', error);
            handleApiError(error, 'fetching merchant social links');
        }
    },

    // Update a social media link
    updateSocial: async (socialId, platform, link) => {
        try {
            console.log('Updating social link:', { socialId, platform, link });

            const response = await axiosInstance.put(`/socials/${socialId}`, {
                platform: platform.toLowerCase(),
                link
            }, {
                headers: getAuthHeaders()
            });

            console.log('Social link updated:', response.data);
            return response.data;
        } catch (error) {
            console.error('Update social error:', error);
            handleApiError(error, 'updating social link');
        }
    },

    // Delete a social media link
    deleteSocial: async (socialId) => {
        try {
            console.log('Deleting social link:', socialId);

            const response = await axiosInstance.delete(`/socials/${socialId}`, {
                headers: getAuthHeaders()
            });

            console.log('Social link deleted:', response.data);
            return response.data;
        } catch (error) {
            console.error('Delete social error:', error);
            handleApiError(error, 'deleting social link');
        }
    },

    // Validate social media URL
    validateSocialUrl: (platform, url) => {
        const platformDomains = {
            facebook: ['facebook.com', 'fb.com', 'fb.me'],
            instagram: ['instagram.com', 'instagr.am'],
            twitter: ['twitter.com', 'x.com', 't.co'],
            linkedin: ['linkedin.com', 'lnkd.in'],
            youtube: ['youtube.com', 'youtu.be'],
            tiktok: ['tiktok.com', 'vm.tiktok.com'],
            pinterest: ['pinterest.com', 'pin.it'],
            snapchat: ['snapchat.com'],
            whatsapp: ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
            discord: ['discord.gg', 'discord.com', 'discordapp.com'],
            tumblr: ['tumblr.com'],
            reddit: ['reddit.com', 'redd.it'],
            vimeo: ['vimeo.com'],
            github: ['github.com'],
            flickr: ['flickr.com', 'flic.kr']
        };

        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');

            if (platformDomains[platform.toLowerCase()]) {
                return platformDomains[platform.toLowerCase()].some(validDomain =>
                    domain.includes(validDomain)
                );
            }

            // Allow other URLs if platform not in our list
            return true;
        } catch (error) {
            console.error('URL validation error:', error);
            return false;
        }
    },

    // Get all socials across all merchant stores (optional utility)
    getAllMerchantSocials: async () => {
        try {
            console.log('Fetching all merchant socials');

            const merchant = merchantAuthService.getCurrentMerchant();
            if (!merchant) {
                throw new Error('Merchant information not found');
            }

            // Get all merchant stores
            const storesResponse = await axiosInstance.get('/stores/merchant/my-stores', {
                headers: getAuthHeaders()
            });

            const stores = storesResponse.data?.stores || [];
            
            if (stores.length === 0) {
                return [];
            }

            // Fetch socials for all stores
            const socialsPromises = stores.map(store => 
                socialsService.getMerchantSocials(store.id)
                    .catch(error => {
                        console.error(`Failed to fetch socials for store ${store.id}:`, error);
                        return [];
                    })
            );

            const socialsArrays = await Promise.all(socialsPromises);
            
            // Flatten and return all socials
            const allSocials = socialsArrays.flat();
            
            console.log('All merchant socials:', allSocials);
            return allSocials;

        } catch (error) {
            console.error('Get all merchant socials error:', error);
            handleApiError(error, 'fetching all merchant socials');
        }
    },

    // Check if merchant is authenticated
    isAuthenticated: () => {
        return merchantAuthService.isAuthenticated();
    },

    // Get current merchant info
    getCurrentMerchant: () => {
        return merchantAuthService.getCurrentMerchant();
    }
};

export default socialsService;