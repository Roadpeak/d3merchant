import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Settings, User, ChevronDown, X, LayoutDashboard, MessageSquare, Layers, HandHeart, TrendingUp, Calendar, Users as UsersIcon, BookOpen, MessageCircle, Share2, CreditCard, LogOut } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import merchantAuthService from '../services/merchantAuthService';
import { toast } from 'react-hot-toast';

const Layout = ({
  children,
  rightContent,
  title = "Orders",
  subtitle = "",
  showSearch = true,
  showNotifications = true,
  className = "",
  showCreateButton = false,
  createButtonText = "Create New Order",
  onCreateClick,
  showMobileGrid = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isLoadingChatCount, setIsLoadingChatCount] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Grid Menu Items (matching your existing sidebar menu)
  const menuItems = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={24} />,
      path: '/dashboard',
      color: 'from-blue-500 to-blue-600',
      description: 'Overview & stats'
    },
    {
      name: 'Chat',
      icon: <MessageSquare size={24} />,
      path: '/dashboard/chat',
      color: 'from-purple-500 to-purple-600',
      description: 'Customer messages',
      badge: chatUnreadCount > 0 ? (chatUnreadCount > 99 ? '99+' : chatUnreadCount.toString()) : null,
      showPulse: chatUnreadCount > 0
    },
    {
      name: 'Services',
      icon: <Layers size={24} />,
      path: '/dashboard/services',
      color: 'from-green-500 to-green-600',
      description: 'Manage services'
    },
    {
      name: 'Offers',
      icon: <HandHeart size={24} />,
      path: '/dashboard/offers',
      color: 'from-pink-500 to-pink-600',
      description: 'Special deals'
    },
    {
      name: 'Staff',
      icon: <UsersIcon size={24} />,
      path: '/dashboard/staff',
      color: 'from-teal-500 to-teal-600',
      description: 'Team members'
    },
    {
      name: 'ServiceBookings',
      icon: <BookOpen size={24} />,
      path: '/dashboard/service-bookings',
      color: 'from-indigo-500 to-indigo-600',
      description: 'Service appointments'
    },
    {
      name: 'OfferBookings',
      icon: <BookOpen size={24} />,
      path: '/dashboard/offer-bookings',
      color: 'from-blue-500 to-blue-600',
      description: 'Offer bookings'
    },
    {
      name: 'ServiceRequests',
      icon: <User size={24} />,
      path: '/dashboard/serviceRequests',
      color: 'from-orange-500 to-orange-600',
      description: 'Customer requests'
    },
    {
      name: 'Reviews',
      icon: <MessageCircle size={24} />,
      path: '/dashboard/reviews',
      color: 'from-yellow-500 to-yellow-600',
      description: 'Customer feedback'
    },
    {
      name: 'Clients',
      icon: <User size={24} />,
      path: '/Clients',
      color: 'from-cyan-500 to-cyan-600',
      description: 'Client list'
    },
    {
      name: 'Socials',
      icon: <Share2 size={24} />,
      path: '/dashboard/socials',
      color: 'from-violet-500 to-violet-600',
      description: 'Social media'
    },
    {
      name: 'Account',
      icon: <User size={24} />,
      path: '/dashboard/account',
      color: 'from-gray-500 to-gray-600',
      description: 'Profile settings'
    }
  ];

  // Initialize merchant data
  useEffect(() => {
    const initializeMerchant = async () => {
      try {
        setLoading(true);
        
        if (!merchantAuthService.isAuthenticated()) {
          navigate('/accounts/sign-in');
          return;
        }

        const merchant = merchantAuthService.getCurrentMerchant();
        if (merchant) {
          setCurrentMerchant(merchant);
        } else {
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

  // Load chat unread count
  useEffect(() => {
    const loadChatCount = async () => {
      if (!merchantAuthService.isAuthenticated()) {
        return;
      }

      try {
        setIsLoadingChatCount(true);
        const token = merchantAuthService.getToken();
        if (!token) return;

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Type': 'merchant',
          'x-api-key': import.meta.env.VITE_API_KEY || ''
        };

        const endpoints = [
          `${import.meta.env.VITE_API_BASE_URL}/chat/merchant/unread-count`,
          `${import.meta.env.VITE_API_BASE_URL}/chat/unread-count`,
          `${import.meta.env.VITE_API_BASE_URL}/merchant/chat/unread`,
          `${import.meta.env.VITE_API_BASE_URL}/chat/merchant/conversations`
        ];

        let unreadCount = 0;
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'GET',
              headers: headers,
              credentials: 'include',
              mode: 'cors'
            });

            if (response.ok) {
              const data = await response.json();
              if (endpoint.includes('conversations')) {
                if (data.success && Array.isArray(data.data)) {
                  unreadCount = data.data.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
                }
              } else if (data.success !== undefined) {
                unreadCount = data.data?.count || data.data?.unread || data.data?.total || 0;
              } else if (typeof data.count === 'number') {
                unreadCount = data.count;
              } else if (typeof data === 'number') {
                unreadCount = data;
              }
              break;
            }
          } catch (error) {
            console.log('Endpoint failed:', endpoint);
          }
        }

        setChatUnreadCount(Math.max(0, unreadCount));
      } catch (error) {
        console.error('Error loading chat count:', error);
      } finally {
        setIsLoadingChatCount(false);
      }
    };

    loadChatCount();
    // Refresh count every 30 seconds
    const interval = setInterval(loadChatCount, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Close menus on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowMobileSearch(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setShowMobileSearch(false);
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
        : 'D';

    const merchantName = currentMerchant.first_name && currentMerchant.last_name
      ? `${currentMerchant.first_name} ${currentMerchant.last_name}`
      : currentMerchant.first_name || 'Doron';

    const merchantEmail = currentMerchant.email_address || currentMerchant.email || 'doron@example.com';

    return (
      <div className="user-menu relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="User menu"
        >
          <span className="text-sm text-gray-700 hidden sm:block">{merchantName}</span>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{merchantInitials}</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-500 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showUserMenu && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden"
              onClick={() => setShowUserMenu(false)}
            />
            
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{merchantInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{merchantName}</p>
                    <p className="text-xs text-gray-500 truncate">{merchantEmail}</p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/dashboard/account');
                  }}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/dashboard/settings');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Mobile Search Overlay
  const MobileSearchOverlay = () => (
    showMobileSearch && (
      <div className="fixed inset-0 bg-white z-50 flex flex-col sm:hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Search</h2>
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search services, offers, bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>
        </div>
      </div>
    )
  );

  // Grid Navigation Component (both mobile and desktop)
  const GridNavigation = () => (
    <div className="relative min-h-screen">
      {/* Subtle Professional Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20px 20px, rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            radial-gradient(circle at 60px 60px, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Greeting Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentMerchant?.first_name || 'Merchant'}! 👋
          </h2>
          <p className="text-base text-gray-600">
            Here's what's happening with your business today
          </p>
        </div>

        {/* Tiled Grid Menu - Balanced layout similar to Discoun3ree */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`
                  relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200
                  transition-all duration-200 hover:shadow-lg active:scale-98
                  aspect-square flex flex-col items-center justify-center
                  ${isActive ? 'ring-2 ring-blue-500 border-blue-500 bg-white' : 'hover:border-gray-300 hover:bg-white'}
                `}
              >
                {/* Badge for notifications (like chat count) */}
                {item.badge && (
                  <div className={`absolute top-2 right-2 min-w-[24px] h-6 px-2 bg-red-500 rounded-full flex items-center justify-center shadow-md ${item.showPulse ? 'animate-pulse' : ''}`}>
                    <span className="text-xs font-bold text-white">{item.badge}</span>
                  </div>
                )}

                {/* Icon with gradient background */}
                <div className={`
                  w-16 h-16 lg:w-20 lg:h-20 rounded-2xl mb-4 flex items-center justify-center
                  bg-gradient-to-br ${item.color} shadow-md
                `}>
                  <div className="text-white">
                    {React.cloneElement(item.icon, { size: 28 })}
                  </div>
                </div>

                {/* Label */}
                <div className="text-center w-full">
                  <h3 className="text-sm lg:text-base font-bold text-gray-900 mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Active Indicator */}
                {isActive && !item.badge && (
                  <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                )}
              </button>
            );
          })}
          </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full max-w-md mx-auto mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-3 hover:bg-white hover:shadow-lg hover:border-red-200 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <LogOut size={24} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Logout</h3>
            <p className="text-xs text-gray-500">Sign out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 z-50">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">D3</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Merchants</span>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center gap-3">
            {rightContent}

            {showNotifications && <NotificationButton />}

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Scrolling Text Banner */}
      <div className="fixed top-[72px] left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 overflow-hidden z-40">
        <div className="animate-scroll whitespace-nowrap">
          <span className="inline-block px-4 text-sm font-medium">
            Get discovered when you list with us, get more bookings, get service requests and chat directly with your clients as you manage your business with D3. Give more offers to get more visibility and bookings
          </span>
          <span className="inline-block px-4 text-sm font-medium">
            Get discovered when you list with us, get more bookings, get service requests and chat directly with your clients as you manage your business with D3. Give more offers to get more visibility and bookings
          </span>
        </div>
      </div>

      {/* Add padding to account for fixed header and banner */}
      <div className="pt-[112px]"></div>

      {/* Title Bar */}
      {!showMobileGrid && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
            
            <div className="flex items-center gap-3">
              {showCreateButton && (
                <button 
                  onClick={onCreateClick}
                  className="bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  {createButtonText}
                </button>
              )}
              
              <select className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Newest</option>
                <option>Oldest</option>
                <option>Most Recent</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto ${className}`}>
        {/* Grid Navigation */}
        {showMobileGrid && <GridNavigation />}
        
        {/* Regular Content */}
        {!showMobileGrid && (
          <div className="p-6 max-w-full">
            {children}
          </div>
        )}
      </div>

      <MobileSearchOverlay />

      {/* Add scrolling animation styles */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Layout;