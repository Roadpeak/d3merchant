import React, { useState, useEffect } from "react";
import {
    LayoutDashboard,
    MessageSquare,
    Layers,
    HandHeart,
    TrendingUp,
    Calendar,
    Users,
    BookOpen,
    MessageCircle,
    Share2,
    CreditCard,
    User,
    LogOut,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
    Store
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import merchantAuthService from '../services/merchantAuthService';
import { toast } from 'react-hot-toast';

const Sidebar = ({ onClose, currentMerchant }) => {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('darkMode') === 'true' ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    
    const location = useLocation();
    const navigate = useNavigate();

    // Get unread message count (you can implement this with real API)
    useEffect(() => {
        // Mock unread messages - replace with actual API call
        setUnreadMessages(3);
    }, []);

    const menuItems = [
        {
            name: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/dashboard",
            badge: null
        },
        {
            name: "Chat",
            icon: <MessageSquare size={20} />,
            path: "/dashboard/chat",
            badge: unreadMessages > 0 ? unreadMessages.toString() : null
        },
        {
            name: "Services",
            icon: <Layers size={20} />,
            path: "/dashboard/services"
        },
        {
            name: "Offers",
            icon: <HandHeart size={20} />,
            path: "/dashboard/offers"
        },
        {
            name: "Analytics",
            icon: <TrendingUp size={20} />,
            path: "/dashboard/analytics"
        },
        {
            name: "Calendar",
            icon: <Calendar size={20} />,
            path: "/dashboard/calendar"
        },
        {
            name: "Staff",
            icon: <Users size={20} />,
            path: "/dashboard/staff"
        },
        {
            name: "Bookings",
            icon: <BookOpen size={20} />,
            path: "/dashboard/bookings"
        },
        {
            name: "Reviews",
            icon: <MessageCircle size={20} />,
            path: "/dashboard/reviews"
        },
        {
            name: "Socials",
            icon: <Share2 size={20} />,
            path: "/dashboard/socials"
        },
        {
            name: "Billing",
            icon: <CreditCard size={20} />,
            path: "/dashboard/billing"
        },
        {
            name: "Account",
            icon: <User size={20} />,
            path: "/dashboard/account"
        },
    ];

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('darkMode', newDarkMode.toString());
            // Apply dark mode to document
            document.documentElement.classList.toggle('dark', newDarkMode);
        }
    };

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

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

    // Get merchant info for display
    const getMerchantDisplayInfo = () => {
        if (!currentMerchant) {
            return {
                name: 'Merchant',
                initials: 'M',
                storeName: 'Store Admin'
            };
        }

        const firstName = currentMerchant.first_name || '';
        const lastName = currentMerchant.last_name || '';
        const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'Merchant';
        const initials = firstName && lastName 
            ? `${firstName.charAt(0)}${lastName.charAt(0)}`
            : firstName 
                ? firstName.charAt(0)
                : 'M';
        const storeName = currentMerchant.store?.name || 'Store Admin';

        return { name, initials, storeName };
    };

    const merchantInfo = getMerchantDisplayInfo();

    return (
        <aside
            className={`
                ${isCollapsed ? 'w-16' : 'w-64'} 
                h-screen flex flex-col
                bg-white dark:bg-gray-900 
                border-r border-gray-200 dark:border-gray-800
                shadow-sm transition-all duration-300 ease-in-out
                relative
            `}
            role="navigation"
            aria-label="Main navigation"
        >
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">D3</span>
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {merchantInfo.storeName}
                            </h1>
                            {currentMerchant?.store?.location && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {currentMerchant.store.location}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Collapse button - only show on desktop */}
                <button
                    onClick={toggleCollapse}
                    className="hidden lg:flex p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {/* Close button - only show on mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Close sidebar"
                >
                    <ChevronLeft size={16} />
                </button>
            </header>

            {/* Merchant Profile Section */}
            {!isCollapsed && currentMerchant && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        {currentMerchant.avatar ? (
                            <img 
                                src={currentMerchant.avatar} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                    {merchantInfo.initials}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {merchantInfo.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {currentMerchant.email_address || currentMerchant.email}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={() => onClose && onClose()} // Close mobile sidebar on navigation
                            className={`
                                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                transition-all duration-200 ease-in-out relative
                                ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                }
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                            title={isCollapsed ? item.name : ''}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}>
                                {item.icon}
                            </span>

                            {!isCollapsed && (
                                <>
                                    <span className="flex-1">{item.name}</span>
                                    {item.badge && (
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                            isActive 
                                                ? 'bg-white/20 text-white' 
                                                : 'bg-red-500 text-white'
                                        }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}

                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                            )}

                            {/* Badge for collapsed state */}
                            {isCollapsed && item.badge && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {item.badge}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <footer className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                {/* Dark mode toggle */}
                <button
                    onClick={toggleDarkMode}
                    className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                        transition-all duration-200 ease-in-out
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? (darkMode ? 'Light mode' : 'Dark mode') : ''}
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    {!isCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                        transition-all duration-200 ease-in-out
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? 'Logout' : ''}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>

                {!isCollapsed && (
                    <div className="text-center pt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            © {new Date().getFullYear()} Discoun3 Ltd.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            v2.1.0
                        </p>
                    </div>
                )}
            </footer>
        </aside>
    );
};

export default Sidebar;