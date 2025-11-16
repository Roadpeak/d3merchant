// pages/reels/ReelsManagement.jsx - Merchant Reels Management Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../elements/Layout';
import {
    Video,
    Upload,
    Eye,
    Heart,
    MessageCircle,
    Share2,
    TrendingUp,
    Calendar,
    Play,
    Pause,
    Trash2,
    Edit,
    BarChart3,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import merchantReelService from '../../services/merchantReelService';

const ReelsManagement = () => {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReels: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        engagement: 0
    });
    const [activeTab, setActiveTab] = useState('all'); // all, published, draft, pending
    const navigate = useNavigate();

    useEffect(() => {
        loadReels();
    }, []);

    const loadReels = async () => {
        try {
            setLoading(true);

            const response = await merchantReelService.getReels({
                limit: 100,
                offset: 0
            });

            if (response.success) {
                const reelsData = response.data.reels || [];
                setReels(reelsData);
                calculateStats(reelsData);
            } else {
                toast.error(response.message || 'Failed to load reels');
            }
        } catch (error) {
            console.error('Error loading reels:', error);
            toast.error(error.message || 'Error loading reels');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (reelsData) => {
        const stats = reelsData.reduce((acc, reel) => ({
            totalReels: acc.totalReels + 1,
            totalViews: acc.totalViews + (reel.views_count || reel.views || 0),
            totalLikes: acc.totalLikes + (reel.likes_count || reel.likes || 0),
            totalShares: acc.totalShares + (reel.shares_count || reel.shares || 0)
        }), {
            totalReels: 0,
            totalViews: 0,
            totalLikes: 0,
            totalShares: 0
        });

        const totalInteractions = stats.totalLikes + stats.totalShares;
        const engagement = stats.totalViews > 0
            ? ((totalInteractions / stats.totalViews) * 100).toFixed(1)
            : 0;

        setStats({ ...stats, engagement });
    };

    const handleDeleteReel = async (reelId) => {
        if (!window.confirm('Are you sure you want to delete this reel?')) return;

        try {
            const response = await merchantReelService.deleteReel(reelId);

            if (response.success) {
                toast.success('Reel deleted successfully');
                loadReels();
            } else {
                toast.error(response.message || 'Failed to delete reel');
            }
        } catch (error) {
            console.error('Error deleting reel:', error);
            toast.error(error.message || 'Error deleting reel');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            published: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Published' },
            draft: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: Clock, label: 'Draft' },
            pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle, label: 'Pending Review' },
            rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Rejected' }
        };

        const badge = badges[status] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    const filteredReels = activeTab === 'all'
        ? reels
        : reels.filter(reel => reel.status === activeTab);

    const StatCard = ({ icon: Icon, label, value, color, change }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="text-white" size={24} />
                </div>
                {change && (
                    <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );

    if (loading) {
        return (
            <Layout title="Reels Management" showBackButton={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading reels...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title="Reels Management"
            subtitle="Manage your video content"
            showBackButton={true}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Create Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reels</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage your service reels</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/reels/create')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <Upload size={20} />
                        <span className="font-medium">Upload Reel</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Video}
                        label="Total Reels"
                        value={stats.totalReels}
                        color="bg-gradient-to-br from-blue-500 to-blue-600"
                    />
                    <StatCard
                        icon={Eye}
                        label="Total Views"
                        value={stats.totalViews.toLocaleString()}
                        color="bg-gradient-to-br from-purple-500 to-purple-600"
                    />
                    <StatCard
                        icon={Heart}
                        label="Total Likes"
                        value={stats.totalLikes.toLocaleString()}
                        color="bg-gradient-to-br from-pink-500 to-pink-600"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Engagement Rate"
                        value={`${stats.engagement}%`}
                        color="bg-gradient-to-br from-green-500 to-green-600"
                    />
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                        <nav className="flex gap-6 -mb-px">
                            {[
                                { id: 'all', label: 'All', count: reels.length },
                                { id: 'published', label: 'Published', count: reels.filter(r => r.status === 'published').length },
                                { id: 'draft', label: 'Drafts', count: reels.filter(r => r.status === 'draft').length },
                                { id: 'pending', label: 'Pending', count: reels.filter(r => r.status === 'pending').length }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Reels List */}
                    <div className="p-6">
                        {filteredReels.length === 0 ? (
                            <div className="text-center py-12">
                                <Video className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reels yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {activeTab === 'all'
                                        ? 'Get started by creating your first reel'
                                        : `No ${activeTab} reels found`
                                    }
                                </p>
                                {activeTab === 'all' && (
                                    <button
                                        onClick={() => navigate('/dashboard/reels/create')}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Upload size={18} />
                                        Upload Your First Reel
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredReels.map((reel) => (
                                    <div
                                        key={reel.id}
                                        className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative aspect-[9/16] bg-gray-200 dark:bg-gray-800">
                                            <img
                                                src={reel.thumbnail_url || reel.thumbnail || '/placeholder-video.jpg'}
                                                alt={reel.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Play className="text-white" size={48} />
                                            </div>
                                            <div className="absolute top-2 left-2">
                                                {getStatusBadge(reel.status)}
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white text-xs">
                                                {reel.duration || '0:00'}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                                {reel.title || 'Untitled Reel'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                                {reel.description || reel.caption || 'No description'}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Eye size={16} />
                                                    <span>{reel.views_count || reel.views || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Heart size={16} />
                                                    <span>{reel.likes_count || reel.likes || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MessageCircle size={16} />
                                                    <span>{reel.chats_count || reel.chats || 0}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/dashboard/reels/${reel.id}/analytics`)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                                >
                                                    <BarChart3 size={16} />
                                                    <span className="text-sm font-medium">Analytics</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/dashboard/reels/${reel.id}/edit`)}
                                                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReel(reel.id)}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ReelsManagement;