import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createService, uploadImage } from '../../services/api_service';

const ServiceForm = ({ onClose, onServiceAdded }) => {
    const [serviceData, setServiceData] = useState({
        name: '',
        price: '',
        duration: '',
        image_url: '',
        category: '',
        description: '',
        type: 'fixed',
        store_id: '10fd0c91-46a0-4480-8a2c-de163d00e871'
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setServiceData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const response = await uploadImage(file);
            setServiceData((prev) => ({ ...prev, image_url: response.url }));
            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = async () => {
        if (!serviceData.name || !serviceData.price || !serviceData.image_url) {
            toast.error('Please fill out all required fields');
            return;
        }

        setLoading(true);
        try {
            await createService(serviceData);
            toast.success('Service created successfully');
            onClose();
            onServiceAdded();
        } catch (error) {
            toast.error('Failed to create service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <input
                type="text"
                name="name"
                value={serviceData.name}
                onChange={handleInputChange}
                placeholder="Service Name"
                className="w-full px-4 py-2 border rounded-md"
            />
            <input
                type="number"
                name="price"
                value={serviceData.price}
                onChange={handleInputChange}
                placeholder="Service Price"
                className="w-full px-4 py-2 border rounded-md"
            />
            <input
                type="text"
                name="duration"
                value={serviceData.duration}
                onChange={handleInputChange}
                placeholder="Duration (e.g., 30 min)"
                className="w-full px-4 py-2 border rounded-md"
            />
            <textarea
                name="description"
                value={serviceData.description}
                onChange={handleInputChange}
                placeholder="Description"
                rows="3"
                className="w-full px-4 py-2 border rounded-md"
            ></textarea>
            <select
                name="category"
                value={serviceData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
            >
                <option value="">Select Category</option>
                <option value="Category1">Category 1</option>
                <option value="Category2">Category 2</option>
            </select>
            <select
                name="type"
                value={serviceData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
            >
                <option value="fixed">Fixed</option>
                <option value="dynamic">Dynamic</option>
            </select>
            <input
                type="file"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border rounded-md"
            />
            {serviceData.image_url && (
                <img
                    src={serviceData.image_url}
                    alt="Uploaded"
                    className="w-full h-32 object-cover rounded-md mt-2"
                />
            )}
            <button
                onClick={handleCreateService}
                className={`w-full py-2 text-white rounded-md ${loading ? 'bg-gray-400' : 'bg-primary'}`}
                disabled={loading}
            >
                {loading ? 'Saving...' : 'Save Service'}
            </button>
        </div>
    );
};

export default ServiceForm;
