// services/merchantReelService.js
import axios from 'axios';
import merchantAuthService from './merchantAuthService'; // Add this import

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

class MerchantReelService {
    getAuthHeaders() {
        // ✅ Use merchantAuthService to get the token correctly
        const token = merchantAuthService.getToken();

        if (!token) {
            console.warn('No merchant token found');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Type': 'merchant',
            'x-api-key': import.meta.env.VITE_API_KEY || 'API_KEY_12345ABCDEF!@#67890-xyZQvTPOl'
        };
    }

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

    async uploadReel(formData, onUploadProgress) {
        try {
            // ✅ Use merchantAuthService for token
            const token = merchantAuthService.getToken();

            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const response = await axios.post(
                `${API_BASE_URL}/reels/merchant`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                        'User-Type': 'merchant',
                        'x-api-key': import.meta.env.VITE_API_KEY || 'API_KEY_12345ABCDEF!@#67890-xyZQvTPOl'
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