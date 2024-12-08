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
        store_id: 'eff53f50-b48a-11ef-915d-a3ac7236b7f5'
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
        <div className="space-y-6">
            <div>
                <label htmlFor="name" className="text-sm font-semibold text-gray-600">
                    Service Name
                </label>
                <input
                    id="name"
                    type="text"
                    name="name"
                    value={serviceData.name}
                    onChange={handleInputChange}
                    placeholder="Enter Service Name"
                    className="w-full px-4 py-1 mt-1 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            <div>
                <label htmlFor="price" className="text-sm font-semibold text-gray-600">
                    Service Price
                </label>
                <input
                    id="price"
                    type="number"
                    name="price"
                    value={serviceData.price}
                    onChange={handleInputChange}
                    placeholder="Enter Service Price"
                    className="w-full px-4 py-1 mt-1 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            <div>
                <label htmlFor="duration" className="text-sm font-semibold text-gray-600">
                    Duration (e.g., 30 min)
                </label>
                <input
                    id="duration"
                    type="text"
                    name="duration"
                    value={serviceData.duration}
                    onChange={handleInputChange}
                    placeholder="Service Duration"
                    className="w-full px-4 py-1 mt-1 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            <div>
                <label htmlFor="description" className="text-sm font-semibold text-gray-600">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={serviceData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your service"
                    rows="4"
                    className="w-full px-4 py-1 mt-1 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
            </div>

            <div>
                <label htmlFor="category" className="text-sm font-semibold text-gray-600">
                    Category
                </label>
                <select
                    id="category"
                    name="category"
                    value={serviceData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-1 mt-1 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="">Select Category</option>
                    <option value="Category1">Category 1</option>
                    <option value="Category2">Category 2</option>
                </select>
            </div>

            <div>
                <label htmlFor="type" className="text-sm font-semibold text-gray-600">
                    Type
                </label>
                <select
                    id="type"
                    name="type"
                    value={serviceData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-1 mt-1 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="fixed">Fixed</option>
                    <option value="dynamic">Dynamic</option>
                </select>
            </div>

            <div className="space-y-2">
                <label htmlFor="image" className="text-sm font-semibold text-gray-600">
                    Upload Image
                </label>
                <div className="flex items-center justify-center p-4 border-2 border-dotted border-gray-300 rounded-md cursor-pointer hover:border-primary transition-all ease-in-out">
                    <input
                        id="image"
                        type="file"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="flex items-center space-x-2 text-gray-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span>Drag & Drop or Click to Upload</span>
                    </span>
                </div>
            </div>

            {serviceData.image_url && (
                <div>
                    <img
                        src={serviceData.image_url}
                        alt="Uploaded"
                        className="w-full h-32 object-cover rounded-md mt-2"
                    />
                </div>
            )}

            <div>
                <button
                    onClick={handleCreateService}
                    className={`w-full py-1 text-white text-[13px] rounded-md ${loading ? 'bg-gray-400' : 'bg-primary'} transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none`}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Service'}
                </button>
            </div>
        </div>
    );
};

export default ServiceForm;
