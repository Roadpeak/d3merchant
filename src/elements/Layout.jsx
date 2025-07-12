import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, User, ChevronDown, Menu, HelpCircle, Flag, X } from 'lucide-react';
import Sidebar from '../components/SideMenu';
import merchantAuthService from '../services/merchantAuthService';
import { toast } from 'react-hot-toast';

const Layout = ({
  children,
  rightContent,
  title = "Good Day, Merchant 👋",
  subtitle = "Here's what's updating with your business today",
  showSearch = false,
  showNotifications = true,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Initialize merchant data
  useEffect(() => {
    const initializeMerchant = async () => {
      try {
        setLoading(true);
        
        // Check if merchant is authenticated
        if (!merchantAuthService.isAuthenticated()) {
          navigate('/accounts/sign-in');
          return;
        }

        // Get current merchant data
        const merchant = merchantAuthService.getCurrentMerchant();
        if (merchant) {
          setCurrentMerchant(merchant);
        } else {
          // If no merchant data, redirect to login
          toast.error('Session expired. Please log in again.');
          navigate('/accounts/sign-in');
        }
      } catch (error) {
        console.error('Error initializing merchant:', error);
        toast.error('Authentication error. Please log in again.');
        navigate('/accounts/sign-in');
      } finally {
        setLoading(false);
      }
    };

    initializeMerchant();
  }, [navigate]);

  // Get current date
  const getCurrentDate = () => {
    const options = { 
      weekday: 'long', 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setShowMobileSearch(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setShowMobileSearch(false);
      // Add search logic here - could search services, offers, bookings, etc.
    }
  };

  const handleLogout = async () => {
    try {
      merchantAuthService.logout();
      toast.success('Logged out successfully');
      navigate('/accounts/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const UserMenu = () => {
    if (!currentMerchant) return null;

    const merchantInitials = currentMerchant.first_name && currentMerchant.last_name 
      ? `${currentMerchant.first_name.charAt(0)}${currentMerchant.last_name.charAt(0)}`
      : currentMerchant.first_name 
        ? currentMerchant.first_name.charAt(0)
        : 'M';

    const merchantName = currentMerchant.first_name && currentMerchant.last_name
      ? `${currentMerchant.first_name} ${currentMerchant.last_name}`
      : currentMerchant.first_name || 'Merchant';

    return (
      <div className="user-menu relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-1 sm:gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="User menu"
        >
          {currentMerchant.avatar ? (
            <img 
              src={currentMerchant.avatar} 
              alt="Profile" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-medium">{merchantInitials}</span>
            </div>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-500 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showUserMenu && (
          <>
            {/* Mobile backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden"
              onClick={() => setShowUserMenu(false)}
            />
            
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{merchantName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentMerchant.email_address || currentMerchant.email}
                </p>
                {currentMerchant.store && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1">
                    {currentMerchant.store.name}
                  </p>
                )}
              </div>

              <a
                href="/dashboard/account"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <User size={16} />
                My Profile
              </a>

              <a
                href="/dashboard/account"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings size={16} />
                Account Settings
              </a>

              <hr className="my-2 border-gray-200 dark:border-gray-700" />

              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
              >
                <span>Sign out</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Mobile Search Overlay
  const MobileSearchOverlay = () => (
    showMobileSearch && (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col sm:hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search</h2>
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSearch} className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search services, offers, bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </form>
        </div>
      </div>
    )
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Get personalized title
  const getPersonalizedTitle = () => {
    if (currentMerchant?.first_name) {
      return `Good Day, ${currentMerchant.first_name} 👋`;
    }
    return title;
  };

  // Get personalized subtitle
  const getPersonalizedSubtitle = () => {
    if (currentMerchant?.store?.name) {
      return `Here's what's happening with ${currentMerchant.store.name} today`;
    }
    return subtitle;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with mobile slide-in */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 lg:z-auto
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          currentMerchant={currentMerchant}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={20} className="text-gray-500" />
              </button>

              {/* Desktop Search */}
              {showSearch && (
                <form onSubmit={handleSearch} className="relative hidden sm:block">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search services, offers, bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 lg:w-80 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded hidden lg:block">
                    ⌘ + k
                  </span>
                </form>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              {rightContent}

              {/* Mobile Search Button */}
              {showSearch && (
                <button 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:hidden"
                  onClick={() => setShowMobileSearch(true)}
                >
                  <Search size={18} className="text-gray-500" />
                </button>
              )}

              {/* Help button - hidden on small mobile */}
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hidden xs:block">
                <HelpCircle size={20} className="text-gray-500" />
              </button>

              {/* Settings button - hidden on small mobile */}
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hidden xs:block">
                <Settings size={20} className="text-gray-500" />
              </button>

              {/* Notifications */}
              {showNotifications && (
                <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Bell size={20} className="text-gray-500" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </button>
              )}

              {/* Flag button - hidden on small mobile */}
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hidden xs:block">
                <Flag size={20} className="text-gray-500" />
              </button>

              <UserMenu />
            </div>
          </div>
        </header>

        {/* Header Section - Gradient */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 sm:p-6 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                {getPersonalizedTitle()}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                {getPersonalizedSubtitle()}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-300 text-sm sm:text-base">{getCurrentDate()}</p>
              {currentMerchant?.store && (
                <p className="text-slate-400 text-xs mt-1">
                  {currentMerchant.store.location || 'Store Location'}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className={`p-4 sm:p-6 flex-1 ${className}`}>
          {children}
        </div>
      </main>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay />
    </div>
  );
};

export default Layout;