// pages/reels/CreateReel.jsx - Upload New Reel
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../elements/Layout';
import {
    Upload,
    Video,
    Image,
    X,
    PlayCircle,
    CheckCircle,
    AlertCircle,
    Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import merchantAuthService from '../../services/merchantAuthService';
import merchantReelService from '../../services/merchantReelService';

const CreateReel = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        serviceId: '',
        status: 'draft' // draft, published, pending
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [services, setServices] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);

    const videoInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);
    const videoPreviewRef = useRef(null);

    const navigate = useNavigate();

    // Load merchant's services
    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const token = merchantAuthService.getToken();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/merchant/services`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setServices(data.data || []);
            }
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('Failed to load services');
        }
    };

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            toast.error('Please select a valid video file');
            return;
        }

        // Validate file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            toast.error('Video file too large. Maximum size is 100MB');
            return;
        }

        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoPreview(url);

        // Get video duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            const duration = Math.floor(video.duration);
            setVideoDuration(duration);

            // Validate duration (max 60 seconds for reels)
            if (duration > 60) {
                toast.error('Reels must be 60 seconds or less');
                setVideoFile(null);
                setVideoPreview(null);
            }
        };
        video.src = url;
    };

    const handleThumbnailSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        setThumbnailFile(file);
        const url = URL.createObjectURL(file);
        setThumbnailPreview(url);
    };

    const generateThumbnail = () => {
        if (!videoPreviewRef.current) return;

        const video = videoPreviewRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
            toast.success('Thumbnail generated from video');
        }, 'image/jpeg', 0.9);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!videoFile) {
            toast.error('Please select a video file');
            return;
        }

        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        if (!formData.serviceId) {
            toast.error('Please select a service');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            const uploadFormData = new FormData();
            uploadFormData.append('video', videoFile);

            if (thumbnailFile) {
                uploadFormData.append('thumbnail', thumbnailFile);
            }

            uploadFormData.append('title', formData.title);
            uploadFormData.append('description', formData.description);
            uploadFormData.append('serviceId', formData.serviceId);
            uploadFormData.append('status', formData.status);
            uploadFormData.append('duration', videoDuration);

            // Upload using merchantReelService
            const response = await merchantReelService.uploadReel(
                uploadFormData,
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            if (response.success) {
                toast.success('Reel uploaded successfully!');
                navigate('/dashboard/reels');
            } else {
                toast.error(response.message || 'Failed to upload reel');
                setUploading(false);
            }
        } catch (error) {
            console.error('Error uploading reel:', error);
            toast.error(error.message || 'Error uploading reel');
            setUploading(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Layout
            title="Upload Reel"
            subtitle="Create a new video reel"
            showBackButton={true}
        >
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Video Upload Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Video</h2>

                        {!videoPreview ? (
                            <div
                                onClick={() => videoInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                            >
                                <Video className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Click to upload video
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    MP4, MOV, or WebM (max 100MB, 60 seconds)
                                </p>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Upload size={20} />
                                    Select Video
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative aspect-[9/16] max-w-xs mx-auto bg-black rounded-xl overflow-hidden">
                                    <video
                                        ref={videoPreviewRef}
                                        src={videoPreview}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVideoFile(null);
                                            setVideoPreview(null);
                                            setVideoDuration(0);
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Duration: {formatDuration(videoDuration)}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        )}

                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Thumbnail Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thumbnail</h2>
                            {videoPreview && (
                                <button
                                    type="button"
                                    onClick={generateThumbnail}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Generate from video
                                </button>
                            )}
                        </div>

                        {!thumbnailPreview ? (
                            <div
                                onClick={() => thumbnailInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                            >
                                <Image className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    Upload thumbnail
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    JPG, PNG (recommended: 1080x1920)
                                </p>
                            </div>
                        ) : (
                            <div className="relative aspect-[9/16] max-w-xs mx-auto">
                                <img
                                    src={thumbnailPreview}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setThumbnailFile(null);
                                        setThumbnailPreview(null);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Details Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h2>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Give your reel a catchy title"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={100}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {formData.title.length}/100 characters
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Tell viewers what your reel is about..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={500}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {formData.description.length}/500 characters
                            </p>
                        </div>

                        {/* Service Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Related Service *
                            </label>
                            <select
                                value={formData.serviceId}
                                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a service</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} - KSh {service.price}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="draft"
                                        checked={formData.status === 'draft'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Save as Draft</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="published"
                                        checked={formData.status === 'published'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish Now</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Loader className="animate-spin text-blue-600" size={20} />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Uploading reel... {uploadProgress}%
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/reels')}
                            disabled={uploading}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !videoFile}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : 'Upload Reel'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateReel;