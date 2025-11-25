import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Search, 
  X,
  Star,
  Phone,
  Mail,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  Tag,
  Filter,
  RefreshCw,
  Loader2,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Grid,
  List
} from "lucide-react";
import Layout from "../../elements/Layout";
import { getMerchantOfferBookings } from "../../services/bookingApiService";
import moment from "moment";

const OfferBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    store: '',
    staff: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
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
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
    time: '',
    store: null,
    staff: null,
    offer: '',
    notes: '',
    paymentStatus: 'not_paid',
    depositAmount: ''
  });

  const paymentStatusOptions = [
    { value: 'not_paid', label: 'Pay in Store', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'deposit', label: 'Deposit Paid', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    { value: 'complete', label: 'Fully Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  ];

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting to load offer bookings...');
        const response = await getMerchantOfferBookings({
          limit: 100,
          status: ''
        });

        console.log('Offer bookings response:', response);

        if (response && response.success) {
          const offerBookings = Array.isArray(response.bookings) ? response.bookings : [];
          console.log('Loaded offer bookings:', offerBookings.length);
          setBookings(offerBookings);
          setFilteredBookings(offerBookings);
        } else {
          console.warn('Invalid response format or unsuccessful:', response);
          // Don't throw error, just set empty bookings
          setBookings([]);
          setFilteredBookings([]);
        }
      } catch (error) {
        console.error('Error loading offer bookings:', error);
        setError(error?.message || 'Unknown error occurred');
        setBookings([]);
        setFilteredBookings([]);
        toast.error("Failed to fetch offer bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBookings().catch(err => {
      console.error('Unhandled error in loadBookings:', err);
      setLoading(false);
      setError(err?.message || 'Failed to load');
    });
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      const response = await getMerchantOfferBookings({
        limit: 100,
        status: ''
      });
      
      if (response.success) {
        const offerBookings = response.bookings || [];
        setBookings(offerBookings);
        setFilteredBookings(offerBookings);
        toast.success('Data refreshed successfully');
      } else {
        throw new Error(response.message || 'Failed to refresh offer bookings');
      }
    } catch (error) {
      console.error('Error refreshing offer bookings:', error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter bookings
  useEffect(() => {
    let filtered = [...bookings];

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

    setFilteredBookings(filtered);
  }, [bookings, filters, searchTerm]);

  const handleCreateBooking = async () => {
    try {
      if (!newBooking.clientName || !newBooking.clientEmail || !newBooking.date || 
          !newBooking.time || !newBooking.store || !newBooking.staff) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (newBooking.paymentStatus === 'deposit' && !newBooking.depositAmount) {
        toast.error("Please enter deposit amount");
        return;
      }

      const bookingData = {
        ...newBooking,
        id: Date.now(),
        User: {
          firstName: newBooking.clientName.split(' ')[0],
          lastName: newBooking.clientName.split(' ').slice(1).join(' '),
          email: newBooking.clientEmail,
          phone: newBooking.clientPhone
        },
        startTime: `${newBooking.date}T${convertTo24Hour(newBooking.time)}`,
        endTime: `${newBooking.date}T${convertTo24Hour(newBooking.time)}`,
        status: 'Confirmed',
        isOffer: true
      };

      const updatedBookings = [bookingData, ...bookings];
      setBookings(updatedBookings);
      
      setNewBooking({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        date: '',
        time: '',
        store: null,
        staff: null,
        offer: '',
        notes: '',
        paymentStatus: 'not_paid',
        depositAmount: ''
      });
      
      setShowCreateModal(false);
      toast.success("Offer booking created successfully!");
      
    } catch (error) {
      toast.error("Failed to create offer booking");
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const calculateStats = () => {
    const total = filteredBookings.length;
    const confirmed = filteredBookings.filter(s => s.status === 'Confirmed').length;
    const pending = filteredBookings.filter(s => s.status === 'Pending').length;
    const completed = filteredBookings.filter(s => s.status === 'Completed').length;

    return { total, confirmed, pending, completed };
  };

  const stats = calculateStats();

  // Booking Card Component
  const BookingCard = ({ booking }) => {
    const paymentStatus = paymentStatusOptions.find(p => p.value === booking.paymentStatus) || paymentStatusOptions[0];
    const PaymentIcon = paymentStatus.icon;

    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(booking.User?.firstName, booking.User?.lastName)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {booking.User?.firstName || "Unknown"} {booking.User?.lastName || "User"}
                </h3>
                <p className="text-xs text-gray-500">ID: {String(booking.id).padStart(6, '0')}</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(dropdownOpen === booking.id ? null : booking.id)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
              
              {dropdownOpen === booking.id && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(null)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-20 border border-gray-100 py-2">
                    <button
                      onClick={() => {
                        navigate(`/dashboard/bookings/${booking.id}/view`);
                        setDropdownOpen(null);
                      }}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-3" />
                      View Details
                    </button>
                    
                    {booking.status === 'Confirmed' && (
                      <button
                        onClick={() => {
                          console.log('Check-in for booking:', booking.id);
                          setDropdownOpen(null);
                        }}
                        className="flex items-center px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-3" />
                        Check-in Client
                      </button>
                    )}
                    
                    <div className="border-t border-gray-100 my-1" />
                    
                    <button
                      onClick={() => {
                        console.log('Edit booking:', booking.id);
                        setDropdownOpen(null);
                      }}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-3" />
                      Edit Booking
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Offer Info */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <Tag className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-900">
                    {booking.Offer?.Service?.name || booking.offer || "Special Offer"}
                  </span>
                </div>
                <p className="text-xs text-green-700 font-medium">Special Promotion</p>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {moment(booking.startTime).format("MMM DD, YYYY")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {moment(booking.startTime).format("hh:mm A")}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {booking.User?.email && (
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-gray-600 truncate">{booking.User.email}</span>
              </div>
            )}
            {booking.User?.phone && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-gray-600">{booking.User.phone}</span>
              </div>
            )}
          </div>

          {/* Location & Staff */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-blue-600 mr-1.5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {booking.store?.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">Location</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
              <div className="flex items-start">
                <User className="w-4 h-4 text-purple-600 mr-1.5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {booking.staff?.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">Staff</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
              {booking.status || "Pending"}
            </span>
          </div>
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${paymentStatus.color}`}>
            <PaymentIcon className="w-3.5 h-3.5" />
            <span>{paymentStatus.label}</span>
          </div>
        </div>
      </div>
    );
  };

  const CreateOfferBookingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-green-600" />
              Create New Offer Booking
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offer/Promotion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer/Promotion
              </label>
              <input
                type="text"
                value={newBooking.offer}
                onChange={(e) => setNewBooking({...newBooking, offer: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Select or search offer"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <select
                value={newBooking.time}
                onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Additional notes about the offer booking..."
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
            >
              <DollarSign className="w-4 h-4" />
              <span>Create Offer Booking</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading offer bookings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !bookings.length) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Error Loading Bookings</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Offer Bookings"
      subtitle={`Manage client bookings for special offers and promotions`}
      showSearch={false}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-600">Total Bookings</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          <p className="text-xs text-gray-600">Confirmed</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-600">Pending</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-600">Completed</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col space-y-4">
          {/* Top Row: Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Booking</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.store}
              onChange={(e) => setFilters(prev => ({ ...prev, store: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">All Stores</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>

            <select
              value={filters.staff}
              onChange={(e) => setFilters(prev => ({ ...prev, staff: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">All Staff</option>
              {staff.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center px-3 py-2 text-sm text-gray-600 ml-auto">
              <span className="font-medium">{filteredBookings.length}</span>
              <span className="mx-1">of</span>
              <span className="font-medium">{bookings.length}</span>
              <span className="ml-1">bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Offer Bookings Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'No offer bookings match your current search or filters. Try adjusting your criteria.'
                : 'Get started by creating your first offer booking to manage promotional appointments.'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Your First Offer Booking
            </button>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && <CreateOfferBookingModal />}
    </Layout>
  );
};

export default OfferBookings;