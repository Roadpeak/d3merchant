// services/merchantReelService.js - Merchant Reel API Service
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

class MerchantReelService {
    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('merchantToken') || localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Type': 'merchant',
        };
    }

    /**
     * Get all reels for merchant
     */
    async getReels(params = {}) {
        try {
            const { status, limit = 50, offset = 0 } = params;

            const queryParams = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                ...(status && { status }),
            });

            const response = await axios.get(
                `${API_BASE_URL}/reels/merchant?${queryParams}`,
                { headers: this.getAuthHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching reels:', error);
            throw error.response?.data || error;
        }
    }

    /**
     * Get single reel by ID
     */
    async getReel(reelId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/reels/merchant/${reelId}`,
                { headers: this.getAuthHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching reel:', error);
            throw error.response?.data || error;
        }
    }

    /**
     * Upload new reel
     */
    async uploadReel(formData, onUploadProgress) {
        try {
            const token = localStorage.getItem('merchantToken') || localStorage.getItem('token');

            const response = await axios.post(
                `${API_BASE_URL}/reels/merchant`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                        'User-Type': 'merchant',
                    },
                    onUploadProgress: (progressEvent) => {
                        if (onUploadProgress) {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            onUploadProgress(percentCompleted);
                        }
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error uploading reel:', error);
            throw error.response?.data || error;
        }
    }

    /**
     * Update reel
     */
    async updateReel(reelId, updates) {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/reels/merchant/${reelId}`,
                updates,
                { headers: this.getAuthHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error updating reel:', error);
            throw error.response?.data || error;
        }
    }

    /**
     * Delete reel
     */
    async deleteReel(reelId) {
        try {
            const response = await axios.delete(
                `${API_BASE_URL}/reels/merchant/${reelId}`,
                { headers: this.getAuthHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error deleting reel:', error);
            throw error.response?.data || error;
        }
    }

    /**
     * Get reel analytics
     */
    async getAnalytics(reelId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/reels/merchant/${reelId}/analytics`,
                { headers: this.getAuthHeaders() }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error.response?.data || error;
        }
    }
}

export default new MerchantReelService();