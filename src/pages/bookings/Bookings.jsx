import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Filter, 
  Plus, 
  Search, 
  X,
  ChevronDown,
  Star,
  Phone,
  Mail,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import Layout from "../../elements/Layout";
import { fetchBookings } from "../../services/api_service";
import moment from "moment";

const MerchantBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    store: '',
    staff: '',
    dateRange: '',
    status: '',
    type: 'all' // 'all', 'offers', 'services'
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Mock data for stores and staff (replace with API calls)
  const stores = [
    { id: 1, name: "Downtown Branch", address: "123 Main St, City Center" },
    { id: 2, name: "Mall Location", address: "456 Shopping Mall, Level 2" },
    { id: 3, name: "Airport Terminal", address: "Terminal 1, Gate Area" },
    { id: 4, name: "Beachfront Office", address: "789 Ocean Drive" }
  ];

  const staff = [
    { id: 1, name: "Sarah Johnson", role: "Senior Specialist", rating: 4.9 },
    { id: 2, name: "Mike Rodriguez", role: "Expert Consultant", rating: 4.7 },
    { id: 3, name: "Emily Chen", role: "Premium Advisor", rating: 4.8 },
    { id: 4, name: "David Wilson", role: "Lead Specialist", rating: 4.6 }
  ];

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    type: 'offer', // 'offer' or 'service'
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
    time: '',
    store: null,
    staff: null,
    service: '',
    notes: '',
    paymentStatus: 'not_paid', // 'not_paid', 'deposit', 'complete'
    depositAmount: ''
  });

  const paymentStatusOptions = [
    { value: 'not_paid', label: 'Pay in Store / Not Paid', color: 'bg-red-100 text-red-800' },
    { value: 'deposit', label: 'Deposit Paid', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'complete', label: 'Fully Paid', color: 'bg-green-100 text-green-800' }
  ];

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await fetchBookings();
        setBookings(response);
        setFilteredBookings(response);
      } catch (error) {
        toast.error("Failed to fetch bookings");
      }
    };

    loadBookings();
  }, []);

  // Filter and sort bookings
  useEffect(() => {
    let filtered = [...bookings];

    // Apply filters
    if (filters.type !== 'all') {
      filtered = filtered.filter(booking => 
        filters.type === 'offers' ? booking.isOffer : !booking.isOffer
      );
    }

    if (filters.store) {
      filtered = filtered.filter(booking => 
        booking.store?.id === parseInt(filters.store)
      );
    }

    if (filters.staff) {
      filtered = filtered.filter(booking => 
        booking.staff?.id === parseInt(filters.staff)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(booking => 
        booking.status === filters.status
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.User?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.User?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.startTime);
          bValue = new Date(b.startTime);
          break;
        case 'client':
          aValue = `${a.User?.firstName} ${a.User?.lastName}`.toLowerCase();
          bValue = `${b.User?.firstName} ${b.User?.lastName}`.toLowerCase();
          break;
        case 'store':
          aValue = a.store?.name?.toLowerCase() || '';
          bValue = b.store?.name?.toLowerCase() || '';
          break;
        case 'staff':
          aValue = a.staff?.name?.toLowerCase() || '';
          bValue = b.staff?.name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
  }, [bookings, filters, sortBy, sortOrder, searchTerm]);

  const handleCreateBooking = async () => {
    try {
      // Validate required fields
      if (!newBooking.clientName || !newBooking.clientEmail || !newBooking.date || 
          !newBooking.time || !newBooking.store || !newBooking.staff) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (newBooking.paymentStatus === 'deposit' && !newBooking.depositAmount) {
        toast.error("Please enter deposit amount");
        return;
      }

      // Create booking object
      const bookingData = {
        ...newBooking,
        id: Date.now(), // Temporary ID
        User: {
          firstName: newBooking.clientName.split(' ')[0],
          lastName: newBooking.clientName.split(' ').slice(1).join(' '),
          email: newBooking.clientEmail,
          phone: newBooking.clientPhone
        },
        startTime: `${newBooking.date}T${convertTo24Hour(newBooking.time)}`,
        endTime: `${newBooking.date}T${convertTo24Hour(newBooking.time)}`, // Add 1 hour
        status: 'Confirmed',
        isOffer: newBooking.type === 'offer'
      };

      // Add to bookings list
      const updatedBookings = [bookingData, ...bookings];
      setBookings(updatedBookings);
      
      // Reset form
      setNewBooking({
        type: 'offer',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        date: '',
        time: '',
        store: null,
        staff: null,
        service: '',
        notes: '',
        paymentStatus: 'not_paid',
        depositAmount: ''
      });
      
      setShowCreateModal(false);
      toast.success("Booking created successfully!");
      
    } catch (error) {
      toast.error("Failed to create booking");
    }
  };

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deposit':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const CreateBookingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Booking</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Type *
              </label>
              <div className="flex space-x-4">
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="service"
                    checked={newBooking.type === 'service'}
                    onChange={(e) => setNewBooking({...newBooking, type: e.target.value})}
                    className="mr-2"
                  />
                  Service Booking
                </label>
              </div>
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <input
                type="text"
                value={newBooking.service}
                onChange={(e) => setNewBooking({...newBooking, service: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search service name"
              />
            </div>

            {/* Client Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                value={newBooking.clientName}
                onChange={(e) => setNewBooking({...newBooking, clientName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter client full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                value={newBooking.clientEmail}
                onChange={(e) => setNewBooking({...newBooking, clientEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Phone
              </label>
              <input
                type="tel"
                value={newBooking.clientPhone}
                onChange={(e) => setNewBooking({...newBooking, clientPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0712345678"
              />
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={newBooking.date}
                onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <select
                value={newBooking.time}
                onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* Store Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Location *
              </label>
              <select
                value={newBooking.store?.id || ''}
                onChange={(e) => {
                  const selectedStore = stores.find(s => s.id === parseInt(e.target.value));
                  setNewBooking({...newBooking, store: selectedStore});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Member *
              </label>
              <select
                value={newBooking.staff?.id || ''}
                onChange={(e) => {
                  const selectedStaff = staff.find(s => s.id === parseInt(e.target.value));
                  setNewBooking({...newBooking, staff: selectedStaff});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select staff member</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>{member.name} - {member.role}</option>
                ))}
              </select>
            </div>

            

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status *
              </label>
              <select
                value={newBooking.paymentStatus}
                onChange={(e) => setNewBooking({...newBooking, paymentStatus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Deposit Amount (conditional) */}
            {newBooking.paymentStatus === 'deposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount *
                </label>
                <input
                  type="number"
                  value={newBooking.depositAmount}
                  onChange={(e) => setNewBooking({...newBooking, depositAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={newBooking.notes}
                onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBooking}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Create Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Bookings">
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
              <p className="text-gray-600 mt-1">Manage client bookings and appointments</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>New Booking</span>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Booking Type Filter */}
              <div>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="offers">Offers</option>
                  <option value="services">Services</option>
                </select>
              </div>

              {/* Store Filter */}
              <div>
                <select
                  value={filters.store}
                  onChange={(e) => setFilters({...filters, store: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              {/* Staff Filter */}
              <div>
                <select
                  value={filters.staff}
                  onChange={(e) => setFilters({...filters, staff: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Staff</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date-desc">Latest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="client-asc">Client A-Z</option>
                  <option value="client-desc">Client Z-A</option>
                  <option value="store-asc">Store A-Z</option>
                  <option value="staff-asc">Staff A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings Sections */}
          <div className="space-y-8">
            {/* Offer Bookings Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Offer Bookings ({filteredBookings.filter(b => b.isOffer).length})
                </h2>
              </div>
              <div className="p-6">
                {filteredBookings.filter(booking => booking.isOffer).length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookings.filter(booking => booking.isOffer).map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-gray-50 hover:bg-gray-100 transition rounded-lg p-4 cursor-pointer border border-gray-200"
                        onClick={() => navigate(`/dashboard/bookings/${booking.id}/view`)}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {booking.User?.firstName || "Unknown"} {booking.User?.lastName || "User"}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center">
                                    <Mail className="w-4 h-4 mr-1" />
                                    {booking.User?.email}
                                  </span>
                                  {booking.User?.phone && (
                                    <span className="flex items-center">
                                      <Phone className="w-4 h-4 mr-1" />
                                      {booking.User?.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                {moment(booking.startTime).format("MMM DD, YYYY")}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                {moment(booking.startTime).format("hh:mm A")}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                {booking.store?.name || "N/A"}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <User className="w-4 h-4 mr-2 text-blue-500" />
                                {booking.staff?.name || "N/A"}
                              </div>
                              <div className="flex items-center text-gray-600">
                                {booking.Offer?.Service?.name || booking.service || "N/A"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getPaymentStatusIcon(booking.paymentStatus)}
                              <span className="text-sm">
                                {paymentStatusOptions.find(p => p.value === booking.paymentStatus)?.label || 'Not Paid'}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status || "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-12">No offer bookings found.</p>
                )}
              </div>
            </div>

            {/* Service Bookings Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Service Bookings ({filteredBookings.filter(b => !b.isOffer).length})
                </h2>
              </div>
              <div className="p-6">
                {filteredBookings.filter(booking => !booking.isOffer).length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookings.filter(booking => !booking.isOffer).map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-gray-50 hover:bg-gray-100 transition rounded-lg p-4 cursor-pointer border border-gray-200"
                        onClick={() => navigate(`/dashboard/bookings/${booking.id}/view`)}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {booking.User?.firstName || "Unknown"} {booking.User?.lastName || "User"}
                                </h3>
                                <div className="flex items-center space-x-// Missing code for Service Bookings section - add this after line 4 in the space-x-4 text-sm text-gray-500 mt-1 section

                                  4 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center">
                                    <Mail className="w-4 h-4 mr-1" />
                                    {booking.User?.email}
                                  </span>
                                  {booking.User?.phone && (
                                    <span className="flex items-center">
                                      <Phone className="w-4 h-4 mr-1" />
                                      {booking.User?.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                {moment(booking.startTime).format("MMM DD, YYYY")}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                {moment(booking.startTime).format("hh:mm A")}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                {booking.store?.name || "N/A"}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <User className="w-4 h-4 mr-2 text-blue-500" />
                                {booking.staff?.name || "N/A"}
                              </div>
                              <div className="flex items-center text-gray-600">
                                {booking.Service?.name || booking.service || "N/A"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getPaymentStatusIcon(booking.paymentStatus)}
                              <span className="text-sm">
                                {paymentStatusOptions.find(p => p.value === booking.paymentStatus)?.label || 'Not Paid'}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status || "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-12">No service bookings found.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Booking Modal */}
        {showCreateModal && <CreateBookingModal />}
      </div>
    </Layout>
  );
};

export default MerchantBookings;