import React, { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const BookingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week
  
  // Enhanced dummy data with booking information
  const bookingsData = {
    '2025-06-01': [
      { id: 1, clientName: 'John Smith', service: 'Hair Cut', time: '09:00', status: 'confirmed', duration: 30, price: 25 },
      { id: 2, clientName: 'Sarah Johnson', service: 'Hair Styling', time: '14:30', status: 'pending', duration: 60, price: 45 },
      { id: 3, clientName: 'Mike Davis', service: 'Beard Trim', time: '16:00', status: 'completed', duration: 20, price: 15 }
    ],
    '2025-06-02': [
      { id: 4, clientName: 'Emma Wilson', service: 'Hair Color', time: '10:00', status: 'confirmed', duration: 120, price: 80 },
      { id: 5, clientName: 'David Brown', service: 'Hair Cut', time: '15:00', status: 'confirmed', duration: 30, price: 25 }
    ],
    '2025-06-03': [
      { id: 6, clientName: 'Lisa Garcia', service: 'Full Package', time: '09:30', status: 'pending', duration: 180, price: 120 }
    ],
    '2025-06-15': [
      { id: 7, clientName: 'Robert Taylor', service: 'Hair Styling', time: '13:00', status: 'confirmed', duration: 45, price: 35 },
      { id: 8, clientName: 'Jennifer Lee', service: 'Hair Treatment', time: '15:30', status: 'confirmed', duration: 90, price: 60 }
    ],
    '2025-06-20': [
      { id: 9, clientName: 'Alex Thompson', service: 'Consultation', time: '11:00', status: 'pending', duration: 30, price: 0 }
    ],
    '2025-06-25': [
      { id: 10, clientName: 'Maria Rodriguez', service: 'Hair Cut', time: '09:00', status: 'confirmed', duration: 30, price: 25 },
      { id: 11, clientName: 'Chris Anderson', service: 'Hair Color', time: '14:00', status: 'confirmed', duration: 120, price: 75 },
      { id: 12, clientName: 'Anna White', service: 'Hair Styling', time: '17:00', status: 'pending', duration: 60, price: 40 }
    ]
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      days.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        bookings: []
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: true,
        bookings: bookingsData[dateKey] || []
      });
    }
    
    // Next month's days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        bookings: []
      });
    }
    
    return days;
  }, [currentDate]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getBookingIndicator = (bookings) => {
    if (bookings.length === 0) return null;
    
    const confirmedCount = bookings.filter(booking => booking.status === 'confirmed').length;
    const pendingCount = bookings.filter(booking => booking.status === 'pending').length;
    const totalCount = bookings.length;
    
    let indicatorColor = 'bg-emerald-400';
    let textColor = 'text-emerald-600';
    
    if (pendingCount > 0) {
      indicatorColor = 'bg-amber-400';
      textColor = 'text-amber-600';
    }
    
    if (totalCount >= 5) {
      indicatorColor = 'bg-red-400';
      textColor = 'text-red-600';
    }
    
    return (
      <div className="flex items-center justify-center">
        <div className={`w-2 h-2 ${indicatorColor} rounded-full`}></div>
        <span className={`ml-1 text-xs font-medium ${textColor}`}>{totalCount}</span>
      </div>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getSelectedDateBookings = () => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return bookingsData[dateKey] || [];
  };

  const getTotalRevenue = (bookings) => {
    return bookings.reduce((total, booking) => total + booking.price, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Booking Calendar</h1>
                  <p className="text-blue-100">Manage your service appointments</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors duration-200 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>New Booking</span>
                </button>
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors duration-200">
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="p-6 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-xl font-semibold text-slate-800">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                >
                  Today
                </button>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                      viewMode === 'month' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                      viewMode === 'week' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                    }`}
                  >
                    Week
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {daysOfWeek.map((day) => (
                  <div key={day} className="p-4 text-center font-semibold text-slate-600 text-sm">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      min-h-[120px] p-3 border-b border-r border-slate-100 cursor-pointer transition-all duration-200
                      ${!day.isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white hover:bg-slate-50'}
                      ${isToday(day.date) ? 'bg-blue-50 border-blue-200' : ''}
                      ${isSelected(day.date) ? 'bg-blue-100 border-blue-300' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`
                        text-sm font-medium
                        ${isToday(day.date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
                        ${!day.isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}
                      `}>
                        {day.date.getDate()}
                      </span>
                      {getBookingIndicator(day.bookings)}
                    </div>
                    
                    <div className="space-y-1">
                      {day.bookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking.id}
                          className={`
                            text-xs p-1 rounded truncate flex items-center space-x-1
                            ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                            ${booking.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                            ${booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                          `}
                        >
                          <span>{booking.time}</span>
                          <span className="truncate">{booking.service}</span>
                        </div>
                      ))}
                      {day.bookings.length > 2 && (
                        <div className="text-xs text-slate-500 pl-1">
                          +{day.bookings.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Bookings */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                {selectedDate ? `${selectedDate.toLocaleDateString()}` : "Today's"} Bookings
              </h3>
              <div className="space-y-3">
                {getSelectedDateBookings().map((booking) => (
                  <div key={booking.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <span className="font-medium text-slate-800 text-sm">{booking.clientName}</span>
                      </div>
                      <span className="text-xs text-slate-500 uppercase">{booking.status}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="font-medium">{booking.service}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span>{booking.time} ({booking.duration}min)</span>
                        <span className="font-semibold">${booking.price}</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm">No bookings for this day</p>
                )}
                
                {getSelectedDateBookings().length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800">Total Revenue:</span>
                      <span className="text-lg font-bold text-blue-900">
                        ${getTotalRevenue(getSelectedDateBookings())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Status Legend */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Status Legend</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-slate-600">Confirmed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-slate-600">Pending</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-slate-600">Completed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-slate-600">Cancelled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;