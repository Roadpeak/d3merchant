import React from 'react';

const StatsSection = () => {
    const stats = [
        { title: 'Sales this month', value: 'Kes. 1,000', bg: 'bg-blue-50', text: 'text-blue-600' },
        { title: 'Sales last month', value: 'Kes. 1,000', bg: 'bg-green-50', text: 'text-green-600' },
        { title: 'Total appointments', value: '54', bg: 'bg-yellow-50', text: 'text-yellow-600' },
        { title: 'Bookings this month', value: '38', bg: 'bg-purple-50', text: 'text-purple-600' },
    ];

    return (
        <div className="w-full flex flex-col md:flex-row gap-4 mt-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`flex w-full flex-col p-6 rounded-md transition-transform transform hover:scale-105 ${stat.bg}`}
                >
                    <p className="text-lg font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-4xl font-bold ${stat.text}`}>{stat.value}</p>
                </div>
            ))}
        </div>
    );
};

export default StatsSection;
