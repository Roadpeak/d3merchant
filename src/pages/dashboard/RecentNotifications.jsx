import React from 'react';

const RecentNotifications = () => {
    const notifications = [
        { id: 1, message: 'New Booking!', type: 'success', action: 'View' },
        { id: 2, message: 'Payment Received!', type: 'info', action: 'Details' },
        { id: 3, message: 'Booking Cancelled!', type: 'warning', action: 'Check' },
        { id: 4, message: 'New Review Added!', type: 'success', action: 'Read' },
        { id: 5, message: 'Customer Inquiry!', type: 'info', action: 'Reply' },
    ];

    const getTypeStyle = (type) => {
        switch (type) {
            case 'success':
                return 'text-green-600 bg-green-50';
            case 'info':
                return 'text-blue-600 bg-blue-50';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="w-full md:w-[30%] border p-4 rounded-lg border-gray-200 bg-white">
            <p className="mb-4 text-primary text-[18px] font-medium border-b pb-2">Recent Notifications</p>
            <div className="flex flex-col gap-3 w-full">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`flex items-center justify-between p-2 rounded-md ${getTypeStyle(notification.type)}`}
                    >
                        <p className="text-[15px] font-medium">{notification.message}</p>
                        <button
                            className="text-sm font-semibold px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-primary"
                            onClick={() => alert(`Action: ${notification.action}`)}
                        >
                            {notification.action}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentNotifications;
