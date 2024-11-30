import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { fetchServices } from '../../services/api_service';

const OfferForm = ({ onClose, onOfferCreated }) => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        const getServices = async () => {
            try {
                const response = await fetchServices();
                setServices(response.services);
            } catch (error) {
                console.error('Failed to fetch services', error);
            }
        };

        getServices();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();

    const onSubmit = (data) => {
        // Submit the offer data
        onOfferCreated(data);
        reset(); // Reset the form after submission
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label htmlFor="service_id" className="block text-sm font-medium text-gray-700">
                    Service
                </label>
                <select
                    id="service_id"
                    {...register('service_id', { required: 'Service is required' })}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.service_id ? 'border-red-500' : ''}`}
                >
                    <option value="">Select a Service</option>
                    {services.map((service) => (
                        <option key={service.id} value={service.id}>
                            {service.name}
                        </option>
                    ))}
                </select>
                {errors.service_id && <p className="text-red-500 text-sm">{errors.service_id.message}</p>}
            </div>

            <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                    Discount (%)
                </label>
                <input
                    type="number"
                    id="discount"
                    {...register('discount', {
                        required: 'Discount is required',
                        min: { value: 0, message: 'Discount must be at least 0%' },
                        max: { value: 100, message: 'Discount cannot exceed 100%' },
                    })}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.discount ? 'border-red-500' : ''}`}
                />
                {errors.discount && <p className="text-red-500 text-sm">{errors.discount.message}</p>}
            </div>

            <div>
                <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700">
                    Expiration Date
                </label>
                <input
                    type="date"
                    id="expiration_date"
                    {...register('expiration_date', { required: 'Expiration date is required' })}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.expiration_date ? 'border-red-500' : ''}`}
                />
                {errors.expiration_date && <p className="text-red-500 text-sm">{errors.expiration_date.message}</p>}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    {...register('description', { required: 'Description is required' })}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                </label>
                <select
                    id="status"
                    {...register('status')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-300 text-black py-2 px-4 rounded-md"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-primary text-white py-2 px-4 rounded-md"
                >
                    Create Offer
                </button>
            </div>
        </form>
    );
};

export default OfferForm;
