import React, { useState } from "react";
import {
    FaTachometerAlt,
    FaCog,
    FaSignOutAlt,
    FaCalendarAlt,
    FaChartLine,
    FaUsers,
    FaEnvelopeOpenText,
    FaBook,
    FaComments,
    FaHandshake,
    FaLayerGroup,
    FaUserCircle,
    FaFileInvoice,
    FaMoneyBillWave,

} from "react-icons/fa";
import { useLocation } from "react-router-dom";

const Sidebar = () => {
    const [darkMode, setDarkMode] = useState(false);
    const location = useLocation();

    const menuItems = [
        { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
        { name: "Chat", icon: <FaTachometerAlt />, path: "/dashboard/MerchantChatInterface" },
        { name: "Services", icon: <FaLayerGroup />, path: "/dashboard/services" },
        { name: "Offers", icon: <FaHandshake />, path: "/dashboard/offers" },
        { name: "Analytics", icon: <FaChartLine />, path: "/dashboard/analytics" },
        { name: "Calendar", icon: <FaCalendarAlt />, path: "/dashboard/calendar" },
        { name: "Staff", icon: <FaUsers />, path: "/dashboard/staff" },
        { name: "Bookings", icon: <FaBook />, path: "/dashboard/bookings" },
        { name: "Reviews", icon: <FaComments />, path: "/dashboard/reviews" },
        { name: "Socials", icon: <FaEnvelopeOpenText />, path: "/dashboard/socials" },
        { name: "Billing", icon: <FaMoneyBillWave />, path: "/dashboard/billing" },
        { name: "Account", icon: <FaUserCircle />, path: "/dashboard/account" },
        { name: "Logout", icon: <FaSignOutAlt />, path: "/logout" },
    ];

    return (
        <div className={`h-[100vh] overflow-y-auto ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} h-screen flex flex-col w-64 shadow-lg`}>
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                <h1 className="text-xl font-semibold">Business Panel</h1>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="text-sm px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    {darkMode ? "Light" : "Dark"}
                </button>
            </div>

            <nav className="flex-grow px-4 py-6 space-y-4">
                {menuItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.path}
                        className={`flex items-center gap-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                            ${location.pathname === item.path ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white dark:hover:bg-gray-700'}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </a>
                ))}
            </nav>

            <footer className="px-4 py-3 border-t dark:border-gray-700">
                <p className="text-xs text-center">
                    © {new Date().getFullYear()} d3 ltd.
                </p>
            </footer>
        </div>
    );
};

export default Sidebar;
