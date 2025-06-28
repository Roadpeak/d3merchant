import React, { useState } from 'react';
import { Calendar, Briefcase, Gift, User, Clock } from 'lucide-react';

const RecentNotifications = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const bookingTypes = [
    { name: 'All', key: 'all', icon: Calendar, active: activeFilter === 'all' },
    { name: 'Offers', key: 'offer', icon: Gift, active: activeFilter === 'offer' },
    { name: 'Services', key: 'service', icon: Briefcase, active: activeFilter === 'service' }
  ];

  const bookings = [
    {
      id: 1,
      customerName: 'John Smith',
      type: 'service',
      serviceName: 'Website Development',
      date: '2025-06-28',
      time: '2:00 PM',
      status: 'confirmed',
      amount: '$1,200'
    },
    {
      id: 2,
      customerName: 'Sarah Johnson',
      type: 'offer',
      serviceName: 'Logo Design Package',
      date: '2025-06-29',
      time: '10:30 AM',
      status: 'pending',
      amount: '$450'
    },
    {
      id: 3,
      customerName: 'Mike Chen',
      type: 'service',
      serviceName: 'SEO Consultation',
      date: '2025-06-30',
      time: '1:15 PM',
      status: 'confirmed',
      amount: '$300'
    },
    {
      id: 4,
      customerName: 'Emily Davis',
      type: 'offer',
      serviceName: 'Social Media Bundle',
      date: '2025-07-01',
      time: '11:00 AM',
      status: 'confirmed',
      amount: '$800'
    }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          dot: 'bg-green-500'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          dot: 'bg-yellow-500'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          dot: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          dot: 'bg-gray-500'
        };
    }
  };

  const filteredBookings = activeFilter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.type === activeFilter);

  return (
    <div className="w-full md:w-[30%]">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
          <button className="text-purple-600 text-sm font-medium bg-purple-50 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors">
            View all
          </button>
        </div>

        {/* Booking Type Filter */}
        <div className="flex gap-2 mb-6">
          {bookingTypes.map((type, index) => (
            <button
              key={index}
              onClick={() => setActiveFilter(type.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type.active 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <type.icon size={16} />
              {type.name}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusStyles = getStatusStyle(booking.status);
            
            return (
              <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  {booking.type === 'offer' ? (
                    <Gift size={20} className="text-purple-600" />
                  ) : (
                    <Briefcase size={20} className="text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}></div>
                        {booking.status}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{booking.serviceName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{booking.date} at {booking.time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{booking.amount}</p>
                  <button className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentNotifications;