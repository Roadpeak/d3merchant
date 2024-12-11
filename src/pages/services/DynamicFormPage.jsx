import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import { createForm, fetchServiceById } from '../../services/api_service';

const DynamicFormPage = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [formFields, setFormFields] = useState([]);
    const [formName, setFormName] = useState('');

    useEffect(() => {
        const fetchService = async () => {
            try {
                const serviceData = await fetchServiceById(id); // Fetch the service by ID
                setService(serviceData);
            } catch (error) {
                console.error('Error fetching service:', error);
                toast.error('Failed to fetch service data');
            }
        };

        fetchService();
    }, [id]);

    const handleAddField = () => {
        setFormFields([
            ...formFields,
            { name: '', type: 'text', required: false }
        ]);
    };

    const handleFieldChange = (index, e) => {
        const newFields = [...formFields];
        newFields[index][e.target.name] = e.target.value;
        setFormFields(newFields);
    };

    const handleSubmitForm = async () => {
        try {
            const formData = {
                name: formName,
                serviceId: id,
                fields: formFields
            };
            await createForm(formData); // Create form in the backend
            toast.success('Form created successfully!');
        } catch (error) {
            console.error('Error creating form:', error);
            toast.error('Failed to create form');
        }
    };

    return (
        <Layout title={`Create Form for ${service?.name || 'Service'}`}>
            <div>
                {service && (
                    <>
                        <h2>Create a form for: {service.name}</h2>
                        <div>
                            <input
                                type="text"
                                placeholder="Form Name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>
                        <div>
                            {formFields.map((field, index) => (
                                <div key={index} className="mb-4">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Field Name"
                                        value={field.name}
                                        onChange={(e) => handleFieldChange(index, e)}
                                    />
                                    <select
                                        name="type"
                                        value={field.type}
                                        onChange={(e) => handleFieldChange(index, e)}
                                    >
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="select">Select</option>
                                    </select>
                                    <input
                                        type="checkbox"
                                        name="required"
                                        checked={field.required}
                                        onChange={(e) => handleFieldChange(index, e)}
                                    />
                                    <label>Required</label>
                                </div>
                            ))}
                            <button onClick={handleAddField}>Add Field</button>
                        </div>
                        <button onClick={handleSubmitForm}>Submit Form</button>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default DynamicFormPage;
