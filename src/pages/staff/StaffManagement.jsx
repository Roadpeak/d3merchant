import React, { useState, useEffect } from 'react';
import { deleteStaff, fetchStaff } from '../../services/api_service';
import StaffFilter from './StaffFilter';
import StaffTable from './StaffTable';
import AddStaffModal from './AddStaffModal';
import Layout from '../../elements/Layout';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        const loadStaff = async () => {
            try {
                const data = await fetchStaff();
                setStaff(data);
                setFilteredStaff(data);
            } catch (error) {
                setError('Failed to fetch staff data.');
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        loadStaff();
    }, []);

    const handleDelete = async (staffId) => {
        try {
            await deleteStaff(staffId);
            setStaff(staff.filter(staffMember => staffMember.id !== staffId));
            setFilteredStaff(filteredStaff.filter(staffMember => staffMember.id !== staffId));
        } catch (error) {
            setError('Failed to delete staff member.');
            console.log(error);
        }
    };

    const handleFilterChange = (filters) => {
        const filtered = staff.filter(staffMember => {
            return (
                staffMember.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                staffMember.status === filters.status
            );
        });
        setFilteredStaff(filtered);
    };

    return (
        <Layout>
            <div className="container mx-auto px-6">
                <div className="flex justify-between mb-4">
                    <StaffFilter onFilterChange={handleFilterChange} />
                    <div className="h-fit">
                        <button
                            onClick={handleOpenModal}
                            className="bg-primary text-white px-6 py-1 rounded-md"
                        >
                            Add Staff
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p>Loading staff...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <StaffTable staff={filteredStaff} onDelete={handleDelete} />
                )}

                <AddStaffModal isOpen={isModalOpen} onClose={handleCloseModal} />
            </div>
        </Layout>
    );
};

export default StaffManagement;
