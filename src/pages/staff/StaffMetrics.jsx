import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingsByStaffId, getStaffById, getStaffAssignedServices, fetchServices } from '../../services/api_service';
import ServiceAssignModal from './ServiceAssignModal';
import Layout from '../../elements/Layout';
import moment from 'moment';
import Modal from '../../elements/Modal';

const StaffMetricsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [services, setServices] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedBooking(null);
        setOpen(false);
    };

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                const staffResponse = await getStaffById(id);
                const servicesResponse = await getStaffAssignedServices(id);
                const allServicesResponse = await fetchServices();
                const bookingsResponse = await getBookingsByStaffId(id);

                setStaff(staffResponse.staff);
                setServices(servicesResponse);
                setAvailableServices(allServicesResponse.services);
                setBookings(bookingsResponse); // Set bookings
                setIsLoading(false);
            } catch (err) {
                setError('Failed to fetch staff data, services, or bookings');
                setIsLoading(false);
            }
        };

        fetchStaffData();
    }, [id]);

    const InfoRow = ({ label, value, icon }) => (
        <div className="flex items-center space-x-2">
            {icon && <span className="text-gray-400">{icon}</span>}
            <p className="text-sm text-gray-500"><strong>{label}:</strong> {value || 'N/A'}</p>
        </div>
    );

    if (isLoading) {
        return <div className="text-center py-10 text-gray-600">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <Layout>
            <div className="w-full flex flex-col overflow-y-auto h-[95vh]">
                <div className="w-full space-y-6">
                    <div className="flex justify-between items-center bg-white shadow rounded-lg p-6">
                        <div>
                            <h1 className="text-2[16px] border-b border-gray-200 font-bold text-gray-700">{staff.name}</h1>
                            <p className="text-sm text-gray-500">{staff.email}</p>
                            <p className="text-sm text-gray-500">{staff.phoneNumber || 'No Phone Number'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${staff.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {staff.status}
                        </span>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700">Assigned Services</h2>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-primary text-white px-6 py-1 rounded-lg text-sm hover:bg-blue-600 transition"
                            >
                                Assign Service
                            </button>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {services.map((service) => (
                                <li key={service.id} className="flex justify-between items-center py-3">
                                    <div className="flex items-center gap-3">
                                        <img src={service?.image_url} className="w-[65px] h-[65px] object-cover rounded-full border-2 border-primary" alt="" />
                                        <div>
                                            <h3 className="font-medium text-gray-800 uppercase text-[15px]">{service.name}</h3>
                                            <p className="text-sm text-gray-500">{service.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="text-red-500 hover:underline text-sm"
                                    >
                                        Unassign
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white w-full mx-auto">
                        <h2 className="text-[16px] border-b border-gray-200 font-medium text-gray-700 mb-3">Bookings</h2>
                        <ul className="divide-y divide-gray-200">
                            {bookings && bookings.length > 0 ? (
                                bookings.map((booking) => (
                                    <li
                                        key={booking.id}
                                        className="py-4 cursor-pointer hover:bg-gray-50 transition-all duration-300"
                                        onClick={() => handleViewDetails(booking)}
                                    >
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-[15px] text-black font-medium">
                                                    {booking.User?.firstname || ''} {booking.User?.lastName || ''}
                                                </p>
                                                <p className="text-[12px] text-gray-600">
                                                    {moment(booking.startTime).format('MMM DD, YYYY, hh:mm A')} - {moment(booking.endTime).format('MMM DD, YYYY, hh:mm A')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">
                                                    Service: <span className="uppercase text-[14px] font-medium">{booking.Offer?.Service?.name || 'N/A'}</span>
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Status: {booking.status || 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500">No bookings available for this staff member.</p>
                            )}
                        </ul>
                    </div>

                    <Modal isOpen={selectedBooking} onClose={handleCloseModal} title="Booking Details">
                        <div className="space-y-6">
                            <section className="space-y-4">
                                <InfoRow label="Booking ID" value={selectedBooking?.id} />
                                <InfoRow label="Status" value={selectedBooking?.status} />
                                <InfoRow label="Booking Created At" value={moment(selectedBooking?.createdAt)?.format('MMM DD, YYYY, hh:mm A')} />
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[16px] border-b border-gray-200 font-medium text-gray-700">User Details</h3>
                                <InfoRow label="Name" value={`${selectedBooking?.User?.firstname} ${selectedBooking?.User?.lastName}`} />
                                <InfoRow label="Email" value={selectedBooking?.User?.email} icon="📧" />
                                <InfoRow label="Phone Number" value={selectedBooking?.User?.phoneNumber} icon="📱" />
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[16px] border-b border-gray-200 font-medium text-gray-700">Service Details</h3>
                                <InfoRow label="Service Name" value={selectedBooking?.Offer?.Service?.name} />
                                <InfoRow label="Price" value={(selectedBooking?.Offer?.Service?.price)} />
                                <InfoRow label="Discount" value={(selectedBooking?.Offer?.discount)} />
                                <InfoRow label="Expiration Date" value={moment(selectedBooking?.Offer?.expiration_date)?.format('MMM DD, YYYY, hh:mm A')} />
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[16px] border-b border-gray-200 font-medium text-gray-700">Booking Time</h3>
                                <InfoRow label="Start Time" value={moment(selectedBooking?.startTime)?.format('MMM DD, YYYY, hh:mm A')} />
                                <InfoRow label="End Time" value={moment(selectedBooking?.endTime)?.format('MMM DD, YYYY, hh:mm A')} />
                            </section>
                        </div>
                    </Modal>

                    <ServiceAssignModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        availableServices={availableServices}
                    />

                    <div className="text-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition"
                        >
                            Back to Staff List
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default StaffMetricsPage;
