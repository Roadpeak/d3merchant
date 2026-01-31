import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Settings, User, ChevronDown, X, LayoutDashboard, MessageSquare, Layers, HandHeart, TrendingUp, Calendar, Users as UsersIcon, BookOpen, MessageCircle, Share2, CreditCard, LogOut, Moon, Sun, ArrowLeft, Video } from 'lucide-react';
import NotificationButton from '../components/NotificationButton';
import merchantAuthService from '../services/merchantAuthService';
import { toast } from 'react-hot-toast';
import StaffOnboardingModal from '../components/StaffOnboardingModal';
import { fetchStaff } from '../services/api_service';

const Layout = ({
  children,
  rightContent,
  title = "Exploring",
  subtitle = "",
  showSearch = true,
  showNotifications = true,
  className = "",
  showCreateButton = false,
  createButtonText = "Create New Order",
  onCreateClick,
  showMobileGrid = false,
  showBackButton = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isLoadingChatCount, setIsLoadingChatCount] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showStaffOnboarding, setShowStaffOnboarding] = useState(false);
  const [staffCount, setStaffCount] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Grid Menu Items - UPDATED WITH REELS
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
      name: 'Reels',
      icon: <Video size={24} />,
      path: '/dashboard/reels',
      color: 'from-red-500 to-pink-600',
      description: 'Video content'
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
  // With HttpOnly cookies, authentication is verified server-side via API calls
  useEffect(() => {
    const initializeMerchant = async () => {
      try {
        setLoading(true);

        // Fetch merchant profile - this will fail if not authenticated (HttpOnly cookie check)
        const merchant = await merchantAuthService.getCurrentMerchantProfile();

        if (merchant) {
          console.log('📋 Merchant profile loaded:', merchant);
          setCurrentMerchant(merchant);
        } else {
          toast.error('Session expired. Please log in again.');
          navigate('/accounts/sign-in');
        }
      } catch (error) {
        console.error('Error initializing merchant:', error);
        // Only redirect if it's actually an auth error (401)
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/accounts/sign-in');
        } else {
          toast.error('Error loading merchant data.');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeMerchant();
  }, [navigate]);

  // Check for staff - show onboarding if no staff exists
  useEffect(() => {
    const checkStaffStatus = async () => {
      // Skip check if no merchant is loaded yet
      if (!currentMerchant) {
        return;
      }

      try {
        const response = await fetchStaff();
        const staffList = response.staff || [];

        setStaffCount(staffList.length);

        // Show onboarding modal if no staff
        if (staffList.length === 0) {
          setShowStaffOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking staff status:', error);
        // If error, assume no staff and show onboarding
        setShowStaffOnboarding(true);
      }
    };

    checkStaffStatus();
  }, []);

  // Handle staff added callback
  const handleStaffAdded = async () => {
    try {
      // Refresh staff list
      const response = await fetchStaff();
      const staffList = response.staff || [];
      setStaffCount(staffList.length);

      // Close onboarding modal
      setShowStaffOnboarding(false);

      toast.success('Great! You can now create services and manage bookings.');
    } catch (error) {
      console.error('Error refreshing staff:', error);
      setShowStaffOnboarding(false);
    }
  };

  // Load chat unread count
  useEffect(() => {
    const loadChatCount = async () => {
      // Skip check if no merchant is loaded yet
      if (!currentMerchant) {
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

  // Handle navbar visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY) {
        setShowNavbar(false);
      } else if (currentScrollY < lastScrollY) {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

  const handleBack = () => {
    navigate(-1);
  };

  const UserMenu = () => {
    if (!currentMerchant) return null;

    // Debug: log currentMerchant to see what fields are available
    console.log('🔍 UserMenu currentMerchant:', currentMerchant);

    const merchantInitials = currentMerchant.first_name && currentMerchant.last_name
      ? `${currentMerchant.first_name.charAt(0)}${currentMerchant.last_name.charAt(0)}`
      : currentMerchant.first_name
        ? currentMerchant.first_name.charAt(0)
        : currentMerchant.email_address
          ? currentMerchant.email_address.charAt(0).toUpperCase()
          : 'M';

    const merchantName = currentMerchant.first_name && currentMerchant.last_name
      ? `${currentMerchant.first_name} ${currentMerchant.last_name}`
      : currentMerchant.first_name
        ? currentMerchant.first_name
        : currentMerchant.email_address
          ? currentMerchant.email_address.split('@')[0]
          : 'Merchant';

    const merchantEmail = currentMerchant.email_address || currentMerchant.email || '';

    return (
      <div className="user-menu relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
          aria-label="User menu"
        >
          <span className="text-sm text-gray-700 dark:text-gray-200 hidden sm:block">{merchantName}</span>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-medium">{merchantInitials}</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-500 dark:text-gray-400 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showUserMenu && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden"
              onClick={() => setShowUserMenu(false)}
            />

            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-medium">{merchantInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{merchantName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{merchantEmail}</p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/dashboard/account');
                  }}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/dashboard/settings');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col sm:hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search</h2>
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
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
              className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>
        </div>
      </div>
    )
  );

  // Grid Navigation Component - Stats state lifted to parent to prevent re-renders
  const [gridStats, setGridStats] = useState({
    serviceBookings: 0,
    offerBookings: 0,
    serviceRequests: 0,
    monthlyRevenue: 0
  });
  const [loadingGridStats, setLoadingGridStats] = useState(true);
  const gridStatsFetchedRef = React.useRef(false);

  // Fetch grid stats only once when component mounts
  useEffect(() => {
    // Skip if already fetched or no merchant loaded
    if (gridStatsFetchedRef.current || !currentMerchant) {
      return;
    }

    gridStatsFetchedRef.current = true;

    const fetchGridStats = async () => {
      try {
        const [
          { default: enhancedBookingService },
          { default: merchantServiceRequestService }
        ] = await Promise.all([
          import('../services/enhancedBookingService'),
          import('../services/merchantServiceRequestService')
        ]);

        const [merchantBookings, serviceBookings, offerBookings, serviceRequests] = await Promise.allSettled([
          enhancedBookingService.getMerchantBookings({ limit: 1000 }),
          enhancedBookingService.getMerchantServiceBookings({ limit: 1000 }),
          enhancedBookingService.getMerchantOfferBookings({ limit: 1000 }),
          merchantServiceRequestService.getServiceRequestsForMerchant({ limit: 1000, status: 'open' })
        ]);

        // Calculate monthly revenue
        let monthlyRevenue = 0;
        if (merchantBookings.status === 'fulfilled' && merchantBookings.value?.success) {
          const bookings = merchantBookings.value.bookings || [];
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          bookings.forEach(booking => {
            const bookingDate = new Date(booking.createdAt || booking.created_at);
            if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
              const amount = parseFloat(booking.totalAmount || booking.amount || booking.accessFee || 0);
              monthlyRevenue += amount;
            }
          });
        }

        setGridStats({
          serviceBookings: serviceBookings.status === 'fulfilled' ? (serviceBookings.value?.bookings?.length || 0) : 0,
          offerBookings: offerBookings.status === 'fulfilled' ? (offerBookings.value?.bookings?.length || 0) : 0,
          serviceRequests: serviceRequests.status === 'fulfilled' ? (serviceRequests.value?.data?.requests?.length || 0) : 0,
          monthlyRevenue
        });
      } catch (error) {
        console.error('Error fetching grid stats:', error);
      } finally {
        setLoadingGridStats(false);
      }
    };

    fetchGridStats();
  }, [currentMerchant]);

  // Grid Navigation Component - now uses parent state
  const GridNavigation = () => {

    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 dark:bg-cyan-400/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
          {/* Enhanced Welcome Banner with Quick Stats */}
          <div className="mb-8 bg-gradient-to-r from-cyan-600 via-blue-700 to-blue-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

            <div className="relative">
              {/* Greeting */}
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Welcome back, {currentMerchant?.first_name || 'Merchant'}! 👋
                </h2>
                <p className="text-blue-100">Here's what's happening with your business today</p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <div className="text-blue-100 text-xs md:text-sm mb-1">Monthly Revenue</div>
                  <div className="text-white text-xl md:text-2xl font-bold">
                    {loadingGridStats ? '...' : `$${gridStats.monthlyRevenue.toLocaleString()}`}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <div className="text-blue-100 text-xs md:text-sm mb-1">Service Bookings</div>
                  <div className="text-white text-xl md:text-2xl font-bold">
                    {loadingGridStats ? '...' : gridStats.serviceBookings}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <div className="text-blue-100 text-xs md:text-sm mb-1">Offer Bookings</div>
                  <div className="text-white text-xl md:text-2xl font-bold">
                    {loadingGridStats ? '...' : gridStats.offerBookings}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <div className="text-blue-100 text-xs md:text-sm mb-1">Open Requests</div>
                  <div className="text-white text-xl md:text-2xl font-bold">
                    {loadingGridStats ? '...' : gridStats.serviceRequests}
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Tiled Grid Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`
                  relative bg-white dark:bg-gray-800/90 dark:backdrop-blur-md rounded-2xl p-6 
                  border border-gray-200 dark:border-gray-700/20
                  transition-all duration-200 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 active:scale-98
                  aspect-square flex flex-col items-center justify-center
                  ${isActive ? 'ring-2 ring-blue-500 shadow-blue-500/50 shadow-xl' : 'shadow-lg hover:border-blue-200 dark:hover:border-blue-700'}
                `}
              >
                {/* Badge for notifications */}
                {item.badge && (
                  <div className={`absolute top-2 right-2 min-w-[24px] h-6 px-2 bg-red-500 rounded-full flex items-center justify-center shadow-md ${item.showPulse ? 'animate-pulse' : ''}`}>
                    <span className="text-xs font-bold text-white">{item.badge}</span>
                  </div>
                )}

                {/* Icon with gradient background */}
                <div className={`
                  w-16 h-16 lg:w-20 lg:h-20 rounded-2xl mb-4 flex items-center justify-center
                  bg-gradient-to-br ${item.color} shadow-lg
                  transform transition-transform hover:rotate-6
                `}>
                  <div className="text-white">
                    {React.cloneElement(item.icon, { size: 28 })}
                  </div>
                </div>

                {/* Label */}
                <div className="text-center w-full">
                  <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Active Indicator */}
                {isActive && !item.badge && (
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full max-w-md mx-auto mt-8 bg-white dark:bg-gray-800/90 dark:backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700/20 flex items-center gap-3 hover:shadow-2xl hover:scale-105 hover:border-red-200 dark:hover:border-red-900 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
            <LogOut size={24} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Logout</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sign out of your account</p>
          </div>
        </button>

        {/* Professional Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            {/* Brand Section */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                  <div className="text-center">
                    <span className="text-white font-bold text-sm block leading-none">D3</span>
                    <svg className="w-5 h-1.5 mx-auto" viewBox="0 0 24 8">
                      <path d="M2 2 Q 12 6, 22 2" stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                  Discoun3ree
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your all-in-one merchant dashboard for managing services, bookings, and growing your business.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate('/dashboard')} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/dashboard/services')} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Services
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/dashboard/analytics')} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Analytics
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/dashboard/account')} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Account
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://discoun3ree.com/help" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="https://discoun3ree.com/contact" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="https://discoun3ree.com/docs" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://discoun3ree.com/faq" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://discoun3ree.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://discoun3ree.com/terms" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="https://discoun3ree.com/cookies" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} Discoun3ree. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="https://twitter.com/discoun3ree" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
                <a href="https://facebook.com/discoun3ree" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/discoun3ree" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="white" strokeWidth="2"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Floating Header with Rounded Corners - Auto-hide on scroll */}
      <header className={`fixed top-4 left-4 right-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-gray-800 dark:to-gray-800 backdrop-blur-md border border-blue-200 dark:border-gray-700 rounded-2xl px-6 py-4 z-50 shadow-lg shadow-blue-200/50 dark:shadow-gray-900/50 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-28'
        }`}>
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg relative">
              <span className="text-white font-bold text-lg">D3</span>
              <div className="absolute bottom-1.5 w-6 h-1 bg-yellow-400 rounded-full" style={{ clipPath: 'ellipse(50% 100% at 50% 0%)' }}></div>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Merchants</span>
          </div>

          {/* Right side - Dark Mode, Notifications and User Menu */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun size={20} className="text-gray-700 dark:text-gray-200" />
              ) : (
                <Moon size={20} className="text-gray-700" />
              )}
            </button>

            {rightContent}

            {showNotifications && <NotificationButton />}

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed floating header */}
      <div className="pt-24"></div>

      {/* Minimal Back Button */}
      {!showMobileGrid && showBackButton && (
        <div className="px-4 mb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto ${className}`}>
        {/* Grid Navigation */}
        {showMobileGrid && <GridNavigation />}

        {/* Regular Content */}
        {!showMobileGrid && (
          <div className="px-4 pb-6 max-w-full">
            {children}
          </div>
        )}
      </div>

      <MobileSearchOverlay />

      {/* Staff Onboarding Modal */}
      <StaffOnboardingModal
        isOpen={showStaffOnboarding}
        onStaffAdded={handleStaffAdded}
      />
    </div>
  );
};

export default Layout;
