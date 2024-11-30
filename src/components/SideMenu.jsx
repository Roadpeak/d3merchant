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
} from "react-icons/fa";

const Sidebar = () => {
    const [darkMode, setDarkMode] = useState(false);

    const menuItems = [
        { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
        { name: "Services", icon: <FaLayerGroup />, path: "/services" },
        { name: "Offers", icon: <FaHandshake />, path: "/offers" },
        { name: "Analytics", icon: <FaChartLine />, path: "/analytics" },
        { name: "Calendar", icon: <FaCalendarAlt />, path: "/calendar" },
        { name: "Staff", icon: <FaUsers />, path: "/staff" },
        { name: "Bookings", icon: <FaBook />, path: "/bookings" },
        { name: "Reviews", icon: <FaComments />, path: "/reviews" },
        { name: "Socials", icon: <FaEnvelopeOpenText />, path: "/socials" },
        { name: "Settings", icon: <FaCog />, path: "/settings" },
        { name: "Account", icon: <FaUserCircle />, path: "/account" },
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
                        className="flex items-center gap-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-primary hover:text-white dark:hover:bg-gray-700"
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </a>
                ))}
            </nav>

            <footer className="px-4 py-3 border-t dark:border-gray-700">
                <p className="text-xs text-center">
                    © {new Date().getFullYear()} Business Panel
                </p>
            </footer>
        </div>
    );
};

export default Sidebar;
