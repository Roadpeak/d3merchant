// pages/reels/ReelAnalytics.jsx - Analytics page for individual reels
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../elements/Layout';
import {
    Eye,
    Heart,
    MessageCircle,
    Share2,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    Users,
    MapPin,
    Activity,
    BarChart3,
    PieChart,
    ArrowLeft,
    Video,
    Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import merchantReelService from '../../services/merchantReelService';

const ReelAnalytics = () => {
    const { reelId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reel, setReel] = useState(null);
    const [analytics, setAnalytics] = useState({
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        engagement: 0,
        avgWatchTime: 0,
        completionRate: 0,
        viewsByDay: [],
        viewsByHour: [],
        demographics: {
            ageGroups: [],
            locations: []
        }
    });

    useEffect(() => {
        loadReelAnalytics();
    }, [reelId]);

    const loadReelAnalytics = async () => {
        try {
            setLoading(true);

            // Fetch reel details
            const reelResponse = await merchantReelService.getReelById(reelId);
            console.log('Reel data:', reelResponse);

            if (reelResponse && (reelResponse.success || reelResponse.reel || reelResponse.data)) {
                const reelData = reelResponse.reel || reelResponse.data || reelResponse;
                setReel(reelData);

                // Calculate analytics from reel data
                const views = reelData.views_count || reelData.views || 0;
                const likes = reelData.likes_count || reelData.likes || 0;
                const comments = reelData.chats_count || reelData.chats || 0;
                const shares = reelData.shares_count || reelData.shares || 0;

                const totalInteractions = likes + comments + shares;
                const engagement = views > 0 ? ((totalInteractions / views) * 100).toFixed(1) : 0;

                setAnalytics({
                    views,
                    likes,
                    comments,
                    shares,
                    saves: reelData.saves_count || 0,
                    engagement,
                    avgWatchTime: reelData.avg_watch_time || 0,
                    completionRate: reelData.completion_rate || 0,
                    viewsByDay: reelData.views_by_day || generateMockDailyData(),
                    viewsByHour: reelData.views_by_hour || generateMockHourlyData(),
                    demographics: reelData.demographics || {
                        ageGroups: generateMockAgeData(),
                        locations: generateMockLocationData()
                    }
                });

                toast.success('Analytics loaded');
            } else {
                toast.error('Reel not found');
                navigate('/dashboard/reels');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast.error(error.message || 'Error loading analytics');
        } finally {
            setLoading(false);
        }
    };

    // Mock data generators (replace with real data when available)
    const generateMockDailyData = () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map(day => ({ day, views: Math.floor(Math.random() * 100) }));
    };

    const generateMockHourlyData = () => {
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            views: Math.floor(Math.random() * 50)
        }));
    };

    const generateMockAgeData = () => {
        return [
            { range: '18-24', percentage: 35 },
            { range: '25-34', percentage: 30 },
            { range: '35-44', percentage: 20 },
            { range: '45+', percentage: 15 }
        ];
    };

    const generateMockLocationData = () => {
        return [
            { city: 'Nairobi', views: 250 },
            { city: 'Mombasa', views: 120 },
            { city: 'Kisumu', views: 80 },
            { city: 'Nakuru', views: 65 },
            { city: 'Eldoret', views: 45 }
        ];
    };

    const StatCard = ({ icon: Icon, label, value, change, color }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="text-white" size={20} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );

    if (loading) {
        return (
            <Layout title="Reel Analytics" showBackButton={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!reel) {
        return (
            <Layout title="Reel Analytics" showBackButton={true}>
                <div className="text-center py-20">
                    <Video className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Reel not found</h3>
                    <button
                        onClick={() => navigate('/dashboard/reels')}
                        className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Reels
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title="Reel Analytics"
            subtitle={reel.title || 'Untitled Reel'}
            showBackButton={true}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard/reels')}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm sm:text-base">Back to Reels</span>
                </button>

                {/* Reel Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                            <div className="w-full sm:w-40 aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                {reel.thumbnail_url || reel.thumbnail ? (
                                    <img
                                        src={reel.thumbnail_url || reel.thumbnail}
                                        alt={reel.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Video className="text-gray-500 dark:text-gray-400" size={32} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {reel.title || 'Untitled Reel'}
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                                {reel.description || reel.caption || 'No description'}
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    <span>{new Date(reel.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={16} />
                                    <span>{reel.duration || '0:00'}</span>
                                </div>
                                {reel.service && (
                                    <div className="flex items-center gap-1">
                                        <Activity size={16} />
                                        <span>{reel.service.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <StatCard
                        icon={Eye}
                        label="Total Views"
                        value={analytics.views.toLocaleString()}
                        color="bg-gradient-to-br from-blue-500 to-blue-600"
                        change={12}
                    />
                    <StatCard
                        icon={Heart}
                        label="Likes"
                        value={analytics.likes.toLocaleString()}
                        color="bg-gradient-to-br from-pink-500 to-pink-600"
                        change={8}
                    />
                    <StatCard
                        icon={MessageCircle}
                        label="Comments"
                        value={analytics.comments.toLocaleString()}
                        color="bg-gradient-to-br from-purple-500 to-purple-600"
                        change={-3}
                    />
                    <StatCard
                        icon={Share2}
                        label="Shares"
                        value={analytics.shares.toLocaleString()}
                        color="bg-gradient-to-br from-green-500 to-green-600"
                        change={15}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Engagement"
                        value={`${analytics.engagement}%`}
                        color="bg-gradient-to-br from-orange-500 to-orange-600"
                        change={5}
                    />
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Views by Day */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Views by Day</h3>
                            <BarChart3 className="text-gray-400 dark:text-gray-500" size={20} />
                        </div>
                        <div className="space-y-3">
                            {analytics.viewsByDay.map((data, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 w-12">{data.day}</span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${(data.views / 100) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                                        {data.views}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Locations */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Top Locations</h3>
                            <MapPin className="text-gray-400 dark:text-gray-500" size={20} />
                        </div>
                        <div className="space-y-4">
                            {analytics.demographics.locations.map((location, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{location.city}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                        {location.views} views
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Age Demographics */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Audience Demographics</h3>
                        <Users className="text-gray-400 dark:text-gray-500" size={20} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {analytics.demographics.ageGroups.map((group, index) => (
                            <div key={index} className="text-center">
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3">
                                    <svg className="transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            className="text-gray-200 dark:text-gray-700"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            strokeDasharray={`${group.percentage * 2.51} 251`}
                                            className="text-blue-600 dark:text-blue-500 transition-all"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                            {group.percentage}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{group.range}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ReelAnalytics;
