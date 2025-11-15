import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bell, X, Check, CheckCheck, Settings, RefreshCw, MessageCircle,
  Calendar, Star, User, CheckCircle, Info, Trash2, Circle, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import notificationService from '../services/notificationService';
import merchantAuthService from '../services/merchantAuthService';
import merchantNotificationSocket from '../services/merchantNotificationSocket';
import { getTokenFromCookie } from '../config/api'; // Import token helper

// ============================================
// WEB PUSH HOOK FOR MERCHANTS
// ============================================
const useWebPush = (isAuthenticated) => {
  const [pushPermission, setPushPermission] = useState('default');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const VAPID_PUBLIC_KEY = 'BKejhBqZqa4GnoAc7nFnQXtCTTbQBpMXjABBS_cMyk4RRpRkgOB6_52y2VQxObMi9XBvRyim7seUpvUm1HaoFms';
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://api.discoun3ree.com/api/v1';

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
      checkPushSubscription();
    }
  }, [isAuthenticated]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && isAuthenticated) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker registered:', reg);
        })
        .catch(err => {
          console.error('❌ Service Worker registration failed:', err);
        });
    }
  }, [isAuthenticated]);

  const checkPushSubscription = async () => {
    try {
      if (!isAuthenticated) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsPushSubscribed(!!subscription);

      console.log('📊 Push subscription status:', !!subscription);

      // Show prompt if not subscribed and permission not denied
      if (!subscription && Notification.permission !== 'denied') {
        setTimeout(() => {
          setShowPushPrompt(true);
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const enablePushNotifications = async () => {
    try {
      console.log('🔔 Starting merchant push notification subscription...');

      // Request permission
      const result = await Notification.requestPermission();
      setPushPermission(result);
      console.log('📋 Notification permission:', result);

      if (result !== 'granted') {
        alert('Please allow notifications to stay updated');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('✅ Push subscription created:', subscription);

      // Get auth token
      const token = getTokenFromCookie();

      if (!token) {
        console.error('❌ No auth token found');
        alert('Authentication error. Please log in again.');
        return false;
      }

      console.log('✅ Auth token found');

      // Send subscription to backend
      const response = await fetch(`${API_BASE}/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': process.env.REACT_APP_API_KEY || ''
        },
        credentials: 'include',
        body: JSON.stringify(subscription)
      });

      console.log('📡 Backend response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Backend response:', result);

        setIsPushSubscribed(true);
        setShowPushPrompt(false);
        console.log('🎉 Merchant push notifications enabled successfully!');

        toast.success('Push notifications enabled! You\'ll receive instant customer updates.', {
          duration: 4000,
          icon: '🔔'
        });

        return true;
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }

        console.error('❌ Failed to save subscription:', response.status, errorData);

        if (response.status === 401) {
          alert('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          alert('You do not have permission to enable notifications.');
        } else {
          alert(`Failed to enable push notifications: ${errorData.message || 'Unknown error'}`);
        }

        return false;
      }
    } catch (error) {
      console.error('❌ Error enabling push notifications:', error);

      let userMessage = 'Error enabling push notifications: ';

      if (error.name === 'NotAllowedError') {
        userMessage += 'Permission denied. Please allow notifications in your browser settings.';
      } else if (error.name === 'NotSupportedError') {
        userMessage += 'Your browser does not support push notifications.';
      } else {
        userMessage += error.message;
      }

      alert(userMessage);
      return false;
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return {
    pushPermission,
    isPushSubscribed,
    showPushPrompt,
    setShowPushPrompt,
    enablePushNotifications
  };
};

// ============================================
// PUSH NOTIFICATION PROMPT COMPONENT
// ============================================
const PushNotificationPrompt = ({ onEnable, onDismiss }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          Stay Updated with Push Notifications
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          Get instant alerts for customer messages, bookings, and reviews even when the dashboard is closed
        </p>
        <div className="flex space-x-2">
          <button
            onClick={onEnable}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Enable Notifications
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// Enhanced Debug Component
const DebugPanel = ({ show, debugInfo, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 text-white p-4 rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">Notification Debug</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};

// Settings Modal Component
const NotificationSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    messages: true,
    bookings: true,
    reviews: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotificationSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await notificationService.updateNotificationSettings(settings);
      if (response.success) {
        toast.success('Settings saved successfully');
        onClose();
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading settings...</p>
              </div>
            ) : (
              Object.entries({
                email: 'Email notifications',
                push: 'Push notifications',
                messages: 'Chat messages',
                bookings: 'Booking updates',
                reviews: 'New reviews'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-700">{label}</span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    disabled={saving}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={loading || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Enhanced Main Dropdown Component - NOW CENTERED!
const NotificationDropdown = ({ onClose, debugInfo, setDebugInfo, showPushPrompt, isPushSubscribed, onEnablePush, onDismissPushPrompt }) => {
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!merchantAuthService.isAuthenticated()) {
      console.log('User not authenticated, skipping notification load');
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading notifications with filter:', activeFilter);

      setDebugInfo(prev => ({
        ...prev,
        loadingStarted: new Date().toISOString(),
        filter: activeFilter
      }));

      const [notifResponse, countResponse] = await Promise.all([
        notificationService.getNotifications({
          type: activeFilter === 'all' ? undefined : activeFilter,
          limit: 20,
          page: 1
        }),
        notificationService.getNotificationCounts()
      ]);

      setDebugInfo(prev => ({
        ...prev,
        notificationResponse: notifResponse,
        countResponse: countResponse,
        loadingCompleted: new Date().toISOString()
      }));

      console.log('Notification response:', notifResponse);
      console.log('Count response:', countResponse);

      if (notifResponse.success) {
        setNotifications(notifResponse.data?.notifications || []);
      } else {
        setError(notifResponse.error || 'Failed to load notifications');
      }

      if (countResponse.success) {
        setCounts(countResponse.data);
      } else {
        console.warn('Failed to load counts:', countResponse.error);
      }

    } catch (error) {
      console.error('Error loading notifications:', error);
      setError(error.message);

      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        errorStack: error.stack
      }));

      setNotifications([]);
      setCounts({
        total: 0,
        unread: 0,
        byType: {
          new_message: 0,
          booking_created: 0,
          new_review: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, [activeFilter, setDebugInfo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNotificationClick = async (notification) => {
    console.log('Notification clicked:', notification);

    if (!notification.read && !notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev => prev.map(n =>
          n.id === notification.id ? { ...n, read: true, isRead: true } : n
        ));
        setCounts(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          byType: {
            ...prev.byType,
            [notification.type]: Math.max(0, (prev.byType?.[notification.type] || 0) - 1)
          }
        }));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.actionUrl) {
      if (notification.actionType === 'navigate' || !notification.actionType) {
        if (notification.type === 'new_message') {
          window.location.href = '/dashboard/chat';
        } else {
          window.location.href = notification.actionUrl;
        }
      }
      onClose();
    }
  };

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, read: true, isRead: true } : n
      ));
      setCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const filters = activeFilter !== 'all' ? { type: activeFilter } : {};
      await notificationService.markAllAsRead(filters);

      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      setCounts(prev => ({
        ...prev,
        unread: activeFilter === 'all' ? 0 : Math.max(0, prev.unread - (prev.byType?.[activeFilter] || 0)),
        byType: {
          ...prev.byType,
          ...(activeFilter !== 'all' ? { [activeFilter]: 0 } : Object.keys(prev.byType || {}).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}))
        }
      }));

      toast.success(`${activeFilter === 'all' ? 'All' : activeFilter.replace('_', ' ')} notifications marked as read`);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    const iconMap = {
      new_message: <MessageCircle className="w-4 h-4 text-blue-500" />,
      booking_created: <Calendar className="w-4 h-4 text-green-500" />,
      booking_confirmed: <CheckCircle className="w-4 h-4 text-green-500" />,
      booking_cancelled: <X className="w-4 h-4 text-red-500" />,
      new_review: <Star className="w-4 h-4 text-yellow-500" />,
      store_follow: <User className="w-4 h-4 text-purple-500" />,
      offer_accepted: <CheckCircle className="w-4 h-4 text-green-500" />,
      payment_received: <CheckCircle className="w-4 h-4 text-green-600" />
    };

    return iconMap[type] || <Bell className="w-4 h-4 text-gray-500" />;
  };

  const getUserAvatar = (sender) => {
    if (sender?.avatar) {
      return <img src={sender.avatar} alt={sender.name} className="w-8 h-8 rounded-full object-cover" />;
    }

    const name = sender?.name || 'Unknown User';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    const colorIndex = Math.abs(name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;

    return (
      <div className={`w-8 h-8 ${colors[colorIndex]} rounded-full flex items-center justify-center`}>
        <span className="text-xs font-medium text-white">{initials}</span>
      </div>
    );
  };

  const formatTimeAgo = (createdAt) => {
    if (!createdAt) return 'Unknown';

    try {
      const now = new Date();
      const time = new Date(createdAt);
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return time.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All', count: counts.total || 0 },
    { key: 'new_message', label: 'Messages', count: counts.byType?.new_message || 0 },
    { key: 'booking_created', label: 'Bookings', count: (counts.byType?.booking_created || 0) + (counts.byType?.booking_confirmed || 0) },
    { key: 'new_review', label: 'Reviews', count: counts.byType?.new_review || 0 }
  ];

  const hasUnreadInFilter = () => {
    if (activeFilter === 'all') return counts.unread > 0;
    return (counts.byType?.[activeFilter] || 0) > 0;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] animate-fadeIn" onClick={onClose} />

      {/* Centered Modal Container */}
      <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-28 md:pt-32 pointer-events-none">
        <div
          ref={dropdownRef}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[600px] flex flex-col pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* WEB PUSH PROMPT */}
          {showPushPrompt && !isPushSubscribed && (
            <PushNotificationPrompt
              onEnable={onEnablePush}
              onDismiss={onDismissPushPrompt}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {counts.unread > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {counts.unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={loadData}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Error loading notifications</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="text-sm text-red-700 underline mt-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-2 overflow-x-auto">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setActiveFilter(option.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeFilter === option.key
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {option.label}
                  {option.count > 0 && (
                    <span className="ml-1 opacity-75">({option.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mark all as read */}
          {hasUnreadInFilter() && (
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}

          {/* Notifications */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeFilter === 'all' ? "You're all caught up!" : `No ${activeFilter.replace('_', ' ')} notifications`}
                </p>
                {error && (
                  <button
                    onClick={loadData}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Retry Loading
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const isUnread = !notification.read && !notification.isRead;
                  const isChatMessage = notification.type === 'new_message';

                  return (
                    <div
                      key={notification.id}
                      className={`relative p-4 hover:bg-gray-50 cursor-pointer transition-colors group ${isUnread ? 'bg-blue-50' : ''
                        } ${isChatMessage ? 'border-l-2 border-l-blue-500' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getUserAvatar(notification.sender)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getIcon(notification.type)}
                                <p className={`font-medium text-sm ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                  {isChatMessage && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Chat
                                    </span>
                                  )}
                                </p>
                              </div>
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isUnread && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3 text-gray-500" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {notification.sender && (
                                <span className="text-xs text-gray-500">
                                  from {notification.sender.name}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {notification.timeAgo || formatTimeAgo(notification.createdAt)}
                              </span>
                            </div>

                            {notification.priority === 'high' && (
                              <span className="text-xs text-orange-600 font-medium">High</span>
                            )}
                            {notification.priority === 'urgent' && (
                              <span className="text-xs text-red-600 font-medium">Urgent</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isUnread && (
                        <div className="absolute right-4 top-6">
                          <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
            >
              View all notifications
            </button>
          </div>
        </div>
      </div>

      <NotificationSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

// Main Button Component
const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState({ unread: 0, total: 0, byType: {} });
  const [lastUpdate, setLastUpdate] = useState(0);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  // WEB PUSH HOOK
  const {
    pushPermission,
    isPushSubscribed,
    showPushPrompt,
    setShowPushPrompt,
    enablePushNotifications
  } = useWebPush(merchantAuthService.isAuthenticated());

  const loadCounts = useCallback(async () => {
    if (!merchantAuthService.isAuthenticated()) {
      console.log('Not authenticated for notification counts');
      setDebugInfo(prev => ({ ...prev, authError: 'Not authenticated' }));
      return;
    }

    try {
      setDebugInfo(prev => ({ ...prev, countsLoadStart: new Date().toISOString() }));

      const response = await notificationService.getNotificationCounts();

      setDebugInfo(prev => ({
        ...prev,
        countsResponse: response,
        countsLoadEnd: new Date().toISOString()
      }));

      if (response.success) {
        setCounts(response.data);
        setLastUpdate(Date.now());
        console.log('Notification counts updated:', response.data);
      } else {
        console.error('Failed to load counts:', response.error);
      }
    } catch (error) {
      console.error('Error loading notification counts:', error);
      setDebugInfo(prev => ({ ...prev, countsError: error.message }));
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Handle push enable
  const handleEnablePush = async () => {
    const success = await enablePushNotifications();
    if (success) {
      console.log('🎉 Merchant push notifications enabled successfully!');
    }
  };

  // Real-time updates with socket integration
  useEffect(() => {
    if (!merchantAuthService.isAuthenticated()) {
      return;
    }

    const handleNewMessage = (messageData) => {
      console.log('New message for notifications:', messageData);

      setDebugInfo(prev => ({
        ...prev,
        lastSocketMessage: {
          data: messageData,
          timestamp: new Date().toISOString()
        }
      }));

      if (messageData.sender === 'user' ||
        messageData.sender === 'customer' ||
        messageData.sender_type === 'user') {

        setCounts(prev => ({
          ...prev,
          unread: prev.unread + 1,
          total: prev.total + 1,
          byType: {
            ...prev.byType,
            new_message: (prev.byType?.new_message || 0) + 1
          }
        }));

        if (!isOpen) {
          toast.success('New customer message received', {
            icon: '💬',
            duration: 4000,
            onClick: () => {
              window.location.href = '/dashboard/chat';
            }
          });
        }
      }
    };

    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);

      setDebugInfo(prev => ({
        ...prev,
        lastNotification: {
          data: notification,
          timestamp: new Date().toISOString()
        }
      }));

      setCounts(prev => ({
        ...prev,
        unread: prev.unread + 1,
        total: prev.total + 1,
        byType: {
          ...prev.byType,
          [notification.type]: (prev.byType?.[notification.type] || 0) + 1
        }
      }));

      if (!isOpen) {
        toast.success(`New ${notification.type.replace('_', ' ')}`, {
          icon: notification.type === 'new_message' ? '💬' : '🔔',
          duration: 3000
        });
      }
    };

    const handleNotificationRead = () => {
      setTimeout(loadCounts, 1000);
    };

    // Socket listeners
    const unsubscribeSocket = merchantNotificationSocket.onNotification((notification, eventType) => {
      setDebugInfo(prev => ({
        ...prev,
        lastSocketEvent: {
          eventType,
          notification,
          timestamp: new Date().toISOString()
        }
      }));

      if (eventType === 'new_notification' || eventType === 'new_customer_message') {
        handleNewNotification(notification);
      } else if (eventType === 'notification_read' || eventType === 'notifications_bulk_read') {
        handleNotificationRead();
      }
    });

    // Fallback WebSocket listeners
    if (typeof window !== 'undefined' && window.io) {
      console.log('Setting up fallback notification WebSocket listeners');

      window.io.on('new_customer_to_store_message', handleNewMessage);
      window.io.on('new_message', handleNewMessage);
      window.io.on('new_notification', handleNewNotification);
      window.io.on('notification_read', handleNotificationRead);
      window.io.on('notifications_bulk_read', handleNotificationRead);
    }

    // Periodic refresh
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastUpdate > 30000) {
        console.log('Periodic notification count refresh');
        loadCounts();
      }
    }, 30000);

    return () => {
      clearInterval(interval);

      if (typeof unsubscribeSocket === 'function') {
        unsubscribeSocket();
      }

      if (typeof window !== 'undefined' && window.io) {
        window.io.off('new_customer_to_store_message', handleNewMessage);
        window.io.off('new_message', handleNewMessage);
        window.io.off('new_notification', handleNewNotification);
        window.io.off('notification_read', handleNotificationRead);
        window.io.off('notifications_bulk_read', handleNotificationRead);
      }
    };
  }, [loadCounts, isOpen, lastUpdate]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          console.log('Notification button clicked');
          setIsOpen(!isOpen);
        }}
        onDoubleClick={() => setShowDebug(!showDebug)}
        className="relative p-2 hover:bg-white/50 rounded-lg transition-colors"
        title={`Notifications${counts.unread > 0 ? ` (${counts.unread} unread)` : ''}`}
      >
        <Bell className="w-5 h-5 text-gray-600" />

        {counts.unread > 0 && (
          <>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1">
              {counts.unread > 99 ? '99+' : counts.unread}
            </span>
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full h-2 w-2 animate-pulse"></span>
          </>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          debugInfo={debugInfo}
          setDebugInfo={setDebugInfo}
          showPushPrompt={showPushPrompt}
          isPushSubscribed={isPushSubscribed}
          onEnablePush={handleEnablePush}
          onDismissPushPrompt={() => setShowPushPrompt(false)}
        />
      )}

      <DebugPanel
        show={showDebug}
        debugInfo={debugInfo}
        onClose={() => setShowDebug(false)}
      />
    </div>
  );
};

export default NotificationButton; 