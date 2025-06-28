import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, ChevronDown, Menu, HelpCircle, Flag, X } from 'lucide-react';
import Sidebar from '../components/SideMenu';

const Layout = ({
  children,
  rightContent,
  title = "Good Day, Orion 👋",
  subtitle = "Here's what's updating with your E-shop today",
  showSearch = false,
  showNotifications = true,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

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
      // Add search logic here
    }
  };

  const UserMenu = () => (
    <div className="user-menu relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-1 sm:gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs sm:text-sm font-medium">A</span>
        </div>
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
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Orion</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">orion@eshop.com</p>
            </div>

            <a
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowUserMenu(false)}
            >
              <User size={16} />
              Profile
            </a>

            <a
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowUserMenu(false)}
            >
              <Settings size={16} />
              Settings
            </a>

            <hr className="my-2 border-gray-200 dark:border-gray-700" />

            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => {
                console.log('Logout');
                setShowUserMenu(false);
              }}
            >
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );

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
              placeholder="Search..."
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
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
                    placeholder="Search..."
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

        {/* Header Section - Purple Gradient */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 sm:p-6 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{title}</h1>
              <p className="text-slate-300 text-sm sm:text-base">{subtitle}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-300 text-sm sm:text-base">{getCurrentDate()}</p>
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