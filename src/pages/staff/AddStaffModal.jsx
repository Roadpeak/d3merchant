import React, { useState } from 'react';
import Modal from '../../elements/Modal';
import { addStaff } from '../../services/api_service';

const AddStaffModal = ({ isOpen, onClose }) => {
    const [staffData, setStaffData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        status: 'active',
        storeId: 'eff53f50-b48a-11ef-915d-a3ac7236b7f5',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStaffData({ ...staffData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await addStaff(staffData);  // Use the addStaff function
            console.log('Staff added successfully:', result);
            onClose();
        } catch (error) {
            console.error('Error adding staff:', error);
            setError(error.response?.data?.error || 'Failed to add staff'); // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal title="Add new staff" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    value={staffData.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="border w-full px-4 py-2 mb-4 rounded-md"
                    required
                />
                <input
                    type="email"
                    name="email"
                    value={staffData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="border w-full px-4 py-2 mb-4 rounded-md"
                    required
                />
                <input
                    type="text"
                    name="phoneNumber"
                    value={staffData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="border w-full px-4 py-2 mb-4 rounded-md"
                />
                <select
                    name="status"
                    value={staffData.status}
                    onChange={handleChange}
                    className="border w-full px-4 py-2 mb-4 rounded-md"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                {error && (
                    <div className="text-red-500 text-sm mb-4">
                        {error}
                    </div>
                )}

                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-400 text-white px-4 py-2 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-md"
                        disabled={isLoading}  // Disable the button while loading
                    >
                        {isLoading ? 'Adding...' : 'Add Staff'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddStaffModal;
