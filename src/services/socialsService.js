// services/socialsService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const socialsService = {
  // Get merchant's store ID using the correct endpoint
  getMerchantStore: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/merchant/my-stores`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch merchant store');
      }

      const data = await response.json();
      if (data.success && data.stores && data.stores.length > 0) {
        return data.stores[0].id;
      }
      
      throw new Error('No store found for merchant');
    } catch (error) {
      console.error('Error fetching merchant store:', error);
      throw error;
    }
  },

  // Create a new social media link
  createSocial: async (storeId, platform, link) => {
    try {
      const response = await fetch(`${API_BASE_URL}/socials`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          store_id: storeId,
          platform: platform.toLowerCase(),
          link
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create social link');
      }

      return data;
    } catch (error) {
      console.error('Create social error:', error);
      throw error;
    }
  },

  // Get social links for a store (public access)
  getSocialsByStore: async (storeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/socials/store/${storeId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch social links');
      }

      return data.socials || [];
    } catch (error) {
      console.error('Get socials error:', error);
      return [];
    }
  },

  // Get social links for merchant's store
  getMerchantSocials: async (storeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/merchant/socials/${storeId}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch social links');
      }

      return data.socials || [];
    } catch (error) {
      console.error('Get merchant socials error:', error);
      throw error;
    }
  },

  // Update a social media link
  updateSocial: async (socialId, platform, link) => {
    try {
      const response = await fetch(`${API_BASE_URL}/socials/${socialId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          platform: platform.toLowerCase(),
          link
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update social link');
      }

      return data;
    } catch (error) {
      console.error('Update social error:', error);
      throw error;
    }
  },

  // Delete a social media link
  deleteSocial: async (socialId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/socials/${socialId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete social link');
      }

      return data;
    } catch (error) {
      console.error('Delete social error:', error);
      throw error;
    }
  },

  // Validate social media URL
  validateSocialUrl: (platform, url) => {
    const platformDomains = {
      facebook: ['facebook.com', 'fb.com'],
      instagram: ['instagram.com'],
      twitter: ['twitter.com', 'x.com'],
      linkedin: ['linkedin.com'],
      youtube: ['youtube.com', 'youtu.be'],
      tiktok: ['tiktok.com'],
      pinterest: ['pinterest.com'],
      snapchat: ['snapchat.com'],
      whatsapp: ['wa.me', 'whatsapp.com'],
      discord: ['discord.gg', 'discord.com'],
      tumblr: ['tumblr.com'],
      reddit: ['reddit.com'],
      vimeo: ['vimeo.com'],
      github: ['github.com'],
      flickr: ['flickr.com']
    };

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      if (platformDomains[platform.toLowerCase()]) {
        return platformDomains[platform.toLowerCase()].some(validDomain => 
          domain.includes(validDomain)
        );
      }
      
      return true; // Allow other URLs
    } catch (error) {
      return false;
    }
  }
};

export default socialsService;