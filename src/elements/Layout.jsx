import React, { useState, useEffect } from 'react';
import { Bell, Search, Settings, User, ChevronDown } from 'lucide-react';
import Sidebar from '../components/SideMenu';

const Layout = ({ 
  children, 
  rightContent, 
  title, 
  subtitle,
  showSearch = false,
  showNotifications = true,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Add search logic here
    }
  };

  const UserMenu = () => (
    <div className="user-menu relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
        />
      </button>

      {showUserMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">john@example.com</p>
          </div>
          
          <a 
            href="/profile" 
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <User size={16} />
            Profile
          </a>
          
          <a 
            href="/settings" 
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Settings size={16} />
            Settings
          </a>
          
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          
          <button 
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => console.log('Logout')}
          >
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                
                {showSearch && (
                  <form onSubmit={handleSearch} className="flex-1 max-w-md">
                    <div className="relative">
                      <Search 
                        size={20} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                      />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {rightContent}
              
              {showNotifications && (
                <button 
                  className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={20} className="text-gray-600 dark:text-gray-400" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </button>
              )}
              
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={`flex-1 overflow-auto p-6 ${className}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;