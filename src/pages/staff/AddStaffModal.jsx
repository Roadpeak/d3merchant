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
            const result = await addStaff(staffData);
            console.log('Staff added successfully:', result);
            onClose();
        } catch (error) {
            console.error('Error adding staff:', error);
            setError(error.response?.data?.error || 'Failed to add staff');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal title="Add New Staff" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={staffData.name}
                        onChange={handleChange}
                        placeholder="Enter staff name"
                        className="border w-full px-4 py-1.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={staffData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        className="border w-full px-4 py-1.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={staffData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className="border w-full px-4 py-1.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={staffData.status}
                        onChange={handleChange}
                        className="border w-full px-4 py-1.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {error && (
                    <div className="text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-300 text-gray-700 px-6 text-[14px] py-1 rounded-md hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-primary text-white px-6 py-1 text-[14px] rounded-md disabled:bg-blue-300"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Adding...' : 'Add Staff'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddStaffModal;
