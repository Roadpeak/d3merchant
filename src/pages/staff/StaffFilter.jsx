import React, { useState } from 'react';

const StaffFilter = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        name: '',
        status: 'active',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => {
            const updatedFilters = { ...prev, [name]: value };
            onFilterChange(updatedFilters);
            return updatedFilters;
        });
    };

    return (
        <div className="flex space-x-4">
            <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleChange}
                placeholder="Search by name"
                className="border px-4 py-2 rounded-md"
            />
            <select
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="border px-4 py-2 rounded-md"
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </div>
    );
};

export default StaffFilter;
