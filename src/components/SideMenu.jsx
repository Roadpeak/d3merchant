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
    ChevronRight
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const Sidebar = () => {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('darkMode') === 'true' ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();


    // Apply dark mode to document
    // useEffect(() => {
    //     document.documentElement.classList.toggle('dark', darkMode);
    //     if (typeof window !== 'undefined') {
    //         localStorage.setItem('darkMode', darkMode.toString());
    //     }
    // }, [darkMode]);

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
            path: "/dashboard/MerchantChatInterface",
            badge: "3"
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
            name: "Clients",
            icon: <User size={20} />,
            path: "/clients"
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

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const handleLogout = () => {
        // Add logout logic here
        console.log("Logging out...");
    };

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
                        <h1 className="font-semibold text-gray-900 dark:text-white">
                            Store Admin
                        </h1>
                    </div>
                )}

            </header>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={index}
                            to={item.path}
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
                                        <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}

                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <footer className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
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
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} d3 ltd.
                    </p>
                )}
            </footer>
        </aside>
    );
};

export default Sidebar;