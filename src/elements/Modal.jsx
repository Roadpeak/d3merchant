import React, { useEffect, useState } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowModal(true); 
        } else {
            const timer = setTimeout(() => setShowModal(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // If the modal is not open, return null
    if (!showModal) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose} 
        >
            <div
                className={`bg-white max-h-[90vh] overflow-y-auto dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6 transform transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
