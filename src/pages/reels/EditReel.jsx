// pages/reels/EditReel.jsx - Edit existing reel
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../elements/Layout';
import {
    ArrowLeft,
    Save,
    Video,
    Image as ImageIcon,
    Loader,
    CheckCircle,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import merchantReelService from '../../services/merchantReelService';
import { fetchServices } from '../../services/api_service';

const EditReel = () => {
    const { reelId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        serviceId: '',
        status: 'draft',
        thumbnailUrl: ''
    });

    useEffect(() => {
        loadData();
    }, [reelId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load reel data and services in parallel
            const [reelResponse, servicesResponse] = await Promise.all([
                merchantReelService.getReelById(reelId),
                fetchServices()
            ]);

            // Handle reel data
            if (reelResponse && (reelResponse.success || reelResponse.reel || reelResponse.data)) {
                const reelData = reelResponse.reel || reelResponse.data || reelResponse;
                setFormData({
                    title: reelData.title || '',
                    description: reelData.description || reelData.caption || '',
                    serviceId: reelData.service_id || reelData.service?.id || '',
                    status: reelData.status || 'draft',
                    thumbnailUrl: reelData.thumbnail_url || reelData.thumbnail || ''
                });
            } else {
                toast.error('Reel not found');
                navigate('/dashboard/reels');
                return;
            }

            // Handle services data
            if (servicesResponse && servicesResponse.data) {
                setServices(servicesResponse.data);
            } else if (Array.isArray(servicesResponse)) {
                setServices(servicesResponse);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error(error.message || 'Error loading reel');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        try {
            setSaving(true);

            const updateData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                service_id: formData.serviceId || null,
                status: formData.status
            };

            console.log('Updating reel:', reelId, updateData);

            const response = await merchantReelService.updateReel(reelId, updateData);

            if (response && (response.success || response.message?.includes('success'))) {
                toast.success('Reel updated successfully');
                navigate('/dashboard/reels');
            } else {
                toast.error(response?.message || 'Failed to update reel');
            }
        } catch (error) {
            console.error('Error updating reel:', error);
            toast.error(error.message || 'Error updating reel');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Edit Reel" showBackButton={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading reel...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title="Edit Reel"
            subtitle="Update reel information"
            showBackButton={true}
        >
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard/reels')}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm sm:text-base">Back to Reels</span>
                </button>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Content Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                        {/* Thumbnail Preview */}
                        {formData.thumbnailUrl && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Current Thumbnail
                                </label>
                                <div className="w-full max-w-xs aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    <img
                                        src={formData.thumbnailUrl}
                                        alt="Reel thumbnail"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/placeholder-video.jpg';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Title */}
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter reel title"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Describe your reel..."
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                            />
                        </div>

                        {/* Service Selection */}
                        <div className="mb-6">
                            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Related Service (Optional)
                            </label>
                            <select
                                id="serviceId"
                                name="serviceId"
                                value={formData.serviceId}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                            >
                                <option value="">No service</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="mb-6">
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="pending">Pending Review</option>
                            </select>
                            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {formData.status === 'draft' && 'Reel will be saved but not visible to users'}
                                {formData.status === 'published' && 'Reel will be visible to all users'}
                                {formData.status === 'pending' && 'Reel will be submitted for review'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/reels')}
                            className="w-full sm:w-auto px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {saving ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default EditReel;
