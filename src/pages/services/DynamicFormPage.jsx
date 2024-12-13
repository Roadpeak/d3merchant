import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // For fetching params from the URL
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import axiosInstance from '../../services/axiosInstance';
import { fetchServiceById } from '../../services/api_service';

const DynamicFormPage = () => {
    const { id } = useParams();
    const serviceId = id;
    const [activeTab, setActiveTab] = useState('create');
    const [forms, setForms] = useState([]);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [fields, setFields] = useState([
        { field_name: '', field_type: 'text', required: false },
    ]);
    const [service, setService] = useState(null); // To store service details

    useEffect(() => {
        if (serviceId) {
            fetchService();
        }
        if (activeTab === 'list') {
            fetchForms();
        }
    }, [activeTab, serviceId]);

    const fetchService = async () => {
        try {
            const serviceData = await fetchServiceById(serviceId);
            setService(serviceData.service);
        } catch (error) {
            console.error('Error fetching service:', error);
            toast.error('Error fetching service details.');
        }
    };

    const fetchForms = async () => {
        try {
            const response = await axiosInstance.get(`/forms/service/${serviceId}`);
            setForms(response.data.forms || []);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching forms.');
        }
    };

    const handleAddField = () => {
        setFields([...fields, { field_name: '', field_type: 'text', required: false }]);
    };

    const handleFieldChange = (index, key, value) => {
        const updatedFields = fields.map((field, i) =>
            i === index ? { ...field, [key]: value } : field
        );
        setFields(updatedFields);
    };

    const handleRemoveField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            const formResponse = await axiosInstance.post('/forms/create', {
                name: formName,
                description: formDescription,
                service_id: serviceId, // Add the service_id
            });

            const formId = formResponse.data.form.id;

            await Promise.all(
                fields.map((field) =>
                    axiosInstance.post('/form-fields/create', {
                        form_id: formId,
                        ...field,
                    })
                )
            );

            toast.success('Form created successfully!');
            setFormName('');
            setFormDescription('');
            setFields([{ field_name: '', field_type: 'text', required: false }]);
        } catch (error) {
            console.error(error);
            toast.error('Error creating form. Please try again.');
        }
    };

    return (
        <Layout title="Dynamic Forms">
            <div className="max-w-6xl mx-auto mt-4">
                {service && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6 mb-4">
                        <div className="flex items-center mb-4">
                            <img
                                src={service.image_url}
                                alt={service.name}
                                className="w-16 h-16 rounded-full object-cover mr-4"
                            />
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800">{service.name}</h2>
                                <p className="text-sm text-gray-500">{service.category}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-base text-gray-700">{service.description}</p>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700">Type: </span>
                                <span>{service.type}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-700">Store: </span>
                                <span>{service.store_id}</span>
                            </div>
                        </div>

                        {service.price && (
                            <div className="mt-4 flex justify-between items-center text-gray-800">
                                <span className="text-xl font-bold">{`$${service.price}`}</span>
                                <span className="text-sm text-gray-500">Duration: {service.duration || 'N/A'}</span>
                            </div>
                        )}

                        <div className="mt-4 text-center">
                            <button className="bg-primary text-white py-1 text-[14px] px-6 rounded-lg hover:bg-primary-dark transition duration-300">
                                Learn More
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex border-b border-gray-200">
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'create' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'
                            }`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Form
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'list' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'
                            }`}
                        onClick={() => setActiveTab('list')}
                    >
                        List Forms
                    </button>
                </div>

                {activeTab === 'create' && (
                    <div className="p-6 bg-white rounded-md border border-gray-200 mt-4">
                        <h2 className="text-xl font-bold mb-4">Create a New Form</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Form Name</label>
                            <input
                                type="text"
                                className="mt-1  py-2 px-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                className="mt-1 py-2 block px-3 w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                            ></textarea>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">Form Fields</h3>
                        {fields.map((field, index) => (
                            <div key={index} className="mb-4 p-4 border rounded-md bg-gray-50">
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Field Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block py-2 px-3 w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                        value={field.field_name}
                                        onChange={(e) => handleFieldChange(index, 'field_name', e.target.value)}
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Field Type</label>
                                    <select
                                        className="mt-1 py-2 px-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                                        value={field.field_type}
                                        onChange={(e) => handleFieldChange(index, 'field_type', e.target.value)}
                                    >
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="email">Email</option>
                                        <option value="date">Date</option>
                                    </select>
                                </div>
                                <div className="mb-2">
                                    <label className="flex items-center text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                            checked={field.required}
                                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                        />
                                        Required
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    className="text-red-500 hover:underline"
                                    onClick={() => handleRemoveField(index)}
                                >
                                    Remove Field
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="mt-4 px-6 py-1 text-[14px] bg-primary text-white rounded-md shadow hover:bg-primary"
                            onClick={handleAddField}
                        >
                            Add Field
                        </button>

                        <button
                            type="button"
                            className="mt-4 ml-4 px-6 py-1 text-[14px] bg-green-500 text-white rounded-md shadow hover:bg-green-600"
                            onClick={handleSubmit}
                        >
                            Create Form
                        </button>
                    </div>
                )}

                {/* List Forms Tab */}
                {activeTab === 'list' && (
                    <div className="p-6 bg-white rounded-md shadow-md mt-4">
                        <h2 className="text-xl font-bold mb-4">List of Forms</h2>
                        {forms.length === 0 ? (
                            <p className="text-gray-500">No forms available.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {forms.map((form) => (
                                    <li key={form.id} className="py-4">
                                        <h3 className="text-lg font-semibold">{form.name}</h3>
                                        <p className="text-sm text-gray-500">{form.description}</p>
                                        {form.fields && form.fields.length > 0 ? (
                                            <ul className="mt-2 pl-4 list-disc text-sm">
                                                {form.fields.map((field) => (
                                                    <li key={field.id} className="mb-1">
                                                        <span className="font-medium">{field.field_name}</span> ({field.field_type})
                                                        {field.required && <span className="text-red-500 ml-1">*required</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500 mt-2">No fields available.</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DynamicFormPage;
