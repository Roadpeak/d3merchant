import React from 'react';
import Modal from '../../elements/Modal';

const ServiceAssignModal = ({ isOpen, onClose, availableServices, onAssign }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign a Service">
            <ul className="space-y-2">
                {availableServices.map((service) => (
                    <li key={service.id} className="flex justify-between items-center">
                        <span className="text-gray-700">{service.name}</span>
                        <button
                            onClick={() => onAssign(service.id)}
                            className="bg-green-500 text-white px-6 text-[13px] py-1 rounded-md hover:bg-green-600"
                        >
                            Assign
                        </button>
                    </li>
                ))}
            </ul>
        </Modal>
    );
};

export default ServiceAssignModal;
