import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../services/api_service';

const CreateStore = () => {
    const [step, setStep] = useState(1); // Step tracker
    const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        primary_email: '',
        phone_number: '',
        description: '',
        website_url: '',
        logo_url: '',
        opening_time: '',
        closing_time: '',
        working_days: [],
        status: 'open',
        merchant_id: '',
    });
    const [logoFile, setLogoFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleDayToggle = (day) => {
        setFormData((prevData) => {
            const days = new Set(prevData.working_days);
            if (days.has(day)) {
                days.delete(day);
            } else {
                days.add(day);
            }
            return { ...prevData, working_days: Array.from(days) }; 
        });
    };

    const handleLogoUpload = async () => {
        if (!logoFile) {
            toast.error('Please select a logo to upload');
            return;
        }
        try {
            setIsUploading(true);
            const { fileUrl } = await uploadImage(logoFile); // Assuming `fileUrl` is returned
            setFormData((prevData) => ({
                ...prevData,
                logo_url: fileUrl,
            }));
            toast.success('Logo uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload logo');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        // Perform validation or API call here
        console.log('Form Data:', formData);
        toast.success('Store created successfully!');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
                <h1 className="text-2xl font-medium text-center text-gray-800 dark:text-white mb-6">
                    {step === 1 ? 'Step 1: Basic Information' : 'Step 2: Additional Information'}
                </h1>
                <p className="text-center mb-4 -mt-4 text-gray-600">Let us now set up your store. Please take time to fill in this Information</p>
                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. "John Doe Store"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="location"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. "123 Main St, City"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="primary_email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Primary Email
                                </label>
                                <input
                                    type="email"
                                    id="primary_email"
                                    name="primary_email"
                                    value={formData.primary_email}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. johndoe@example.com'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="phone_number"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. +1234567890'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. "We sell the best products in town"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="website_url"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Website URL
                                </label>
                                <input
                                    type="url"
                                    id="website_url"
                                    name="website_url"
                                    value={formData.website_url}
                                    onChange={handleChange}
                                    placeholder='e.g. "https://example.com"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="logo"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Store Logo
                                </label>
                                <input
                                    type="file"
                                    id="logo"
                                    onChange={(e) => setLogoFile(e.target.files[0])}
                                    className="mt-1 block w-full text-gray-500 dark:text-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleLogoUpload}
                                    disabled={isUploading}
                                    className="mt-2 bg-primary text-white py-1 px-6 rounded-md"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                                </button>
                            </div>
                            <div>
                                <label
                                    htmlFor="opening_time"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Opening Time
                                </label>
                                <input
                                    type="time"
                                    id="opening_time"
                                    name="opening_time"
                                    value={formData.opening_time}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="closing_time"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Closing Time
                                </label>
                                <input
                                    type="time"
                                    id="closing_time"
                                    name="closing_time"
                                    value={formData.closing_time}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Working Days
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <label
                                            key={day}
                                            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                                        >
                                            <input
                                                type="checkbox"
                                                value={day}
                                                checked={formData.working_days.includes(day)}
                                                onChange={() => handleDayToggle(day)}
                                                className="form-checkbox text-primary border-gray-300 dark:border-gray-700"
                                            />
                                            <span className="capitalize">{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end gap-4">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep((prevStep) => prevStep - 1)}
                                className="bg-gray-300 text-black py-1 px-6 rounded-md"
                            >
                                Back
                            </button>
                        )}
                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={() => setStep((prevStep) => prevStep + 1)}
                                className="bg-primary text-white py-1 px-6 rounded-md"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                    className="bg-primary text-white py-1 px-6 rounded-md"
                            >
                                Submit
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStore;
