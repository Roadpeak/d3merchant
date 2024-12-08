import React, { useState, useEffect } from 'react';
import Layout from '../../elements/Layout';
import { createSocial, fetchSocials, updateSocial, deleteSocial } from '../../services/api_service';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube, FaTiktok, FaPinterest, FaSnapchat, FaWhatsapp, FaDiscord, FaTumblr, FaReddit, FaVimeo, FaGithub, FaFlickr } from 'react-icons/fa';
import { FiEdit, FiTrash } from 'react-icons/fi';
import Modal from '../../elements/Modal';
import { socialMediaPlatforms } from '../../utils/data';

const Socials = () => {
    const [socialLinks, setSocialLinks] = useState([]);
    const [newSocial, setNewSocial] = useState({ platform: '', link: '' });
    const [editing, setEditing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal open state
    const storeId = 'eff53f50-b48a-11ef-915d-a3ac7236b7f5';

    // Fetch social media links for the store
    useEffect(() => {
        const getSocials = async () => {
            try {
                const data = await fetchSocials(storeId);
                setSocialLinks(data);
            } catch (error) {
                console.error('Error fetching social links:', error);
            }
        };
        getSocials();
    }, [storeId]);

    // Open modal to add a new social link
    const handleAddSocial = () => {
        setEditing(null);
        setNewSocial({ platform: '', link: '' });
        setIsModalOpen(true);
    };

    // Handle creating a new social media link
    const handleCreateSocial = async (e) => {
        e.preventDefault();
        try {
            const createdSocial = await createSocial({ store_id: storeId, ...newSocial });
            setSocialLinks([...socialLinks, createdSocial]);
            setIsModalOpen(false);
            setNewSocial({ platform: '', link: '' });
        } catch (error) {
            console.error('Error creating social link:', error);
        }
    };

    // Handle editing a social media link
    const handleEditSocial = (social) => {
        setEditing(social);
        setNewSocial({ platform: social.platform, link: social.link });
        setIsModalOpen(true);
    };

    // Handle updating the social media link
    const handleUpdateSocial = async (e) => {
        e.preventDefault();
        if (editing) {
            try {
                const updatedSocial = await updateSocial(editing.id, { platform: newSocial.platform, link: newSocial.link });
                setSocialLinks(socialLinks.map(social => (social.id === editing.id ? updatedSocial : social)));
                setIsModalOpen(false);
                setEditing(null);
                setNewSocial({ platform: '', link: '' });
            } catch (error) {
                console.error('Error updating social link:', error);
            }
        }
    };

    const handleDeleteSocial = async (id) => {
        try {
            await deleteSocial(id);
            setSocialLinks(socialLinks.filter((social) => social.id !== id));
        } catch (error) {
            console.error('Error deleting social link:', error);
        }
    };

    const getPlatformIcon = (platform) => {
        switch (platform.toLowerCase()) {
            case 'facebook':
                return <FaFacebook className="text-blue-600" />;
            case 'instagram':
                return <FaInstagram className="text-pink-600" />;
            case 'twitter':
                return <FaTwitter className="text-blue-400" />;
            case 'linkedin':
                return <FaLinkedin className="text-blue-700" />;
            case 'youtube':
                return <FaYoutube className="text-red-600" />;
            case 'tiktok':
                return <FaTiktok className="text-black" />;
            case 'pinterest':
                return <FaPinterest className="text-red-500" />;
            case 'snapchat':
                return <FaSnapchat className="text-yellow-400" />;
            case 'whatsapp':
                return <FaWhatsapp className="text-green-600" />;
            case 'discord':
                return <FaDiscord className="text-blue-500" />;
            case 'tumblr':
                return <FaTumblr className="text-indigo-600" />;
            case 'reddit':
                return <FaReddit className="text-orange-600" />;
            case 'vimeo':
                return <FaVimeo className="text-blue-600" />;
            case 'github':
                return <FaGithub className="text-black" />;
            case 'flickr':
                return <FaFlickr className="text-blue-500" />;
            default:
                return <span className="text-gray-600">🌐</span>;
        }
    };


    return (
        <Layout title="Socials">
            <div className="max-w-4xl mx-auto py-6">
                <div className="flex items-center w-full mb-4 justify-between">
                    <div className="">
                        <h2 className="text-[20px] font-semibold">Social Media Links</h2>
                        <p className="text-sm text-gray-500">Manage your store's social media links</p>
                    </div>
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleAddSocial}
                            className="px-6 py-1 bg-primary text-white rounded-md text-[14px] hover:bg-blue-700 transition-all duration-200"
                        >
                            Add Social Link
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {socialLinks.length > 0 ? (
                        <ul>
                            {socialLinks.map((social) => (
                                <li
                                    key={social.id}
                                    className="flex items-center justify-between p-4 mb-2 bg-white shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="flex items-center space-x-4">
                                        {/* Platform Icon */}
                                        <div className="text-xl">
                                            {getPlatformIcon(social.platform)}
                                        </div>
                                        <div>
                                            <a
                                                href={social.link}
                                                className="text-sm font-semibold text-gray-800 hover:text-blue-500"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {social.platform}
                                            </a>
                                            <p className="text-sm text-gray-500">{social.link}</p>
                                        </div>
                                    </div>

                                    <div className="space-x-3">
                                        <button
                                            onClick={() => handleEditSocial(social)}
                                            className="text-yellow-500 hover:text-yellow-600 flex items-center space-x-1"
                                        >
                                            <FiEdit /> <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSocial(social.id)}
                                            className="text-red-500 hover:text-red-600 flex items-center space-x-1"
                                        >
                                            <FiTrash /> <span>Delete</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">No social links added yet</p>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Social Media Link' : 'Add Social Media Link'}>
                <form onSubmit={editing ? handleUpdateSocial : handleCreateSocial} className="space-y-4">
                    <div>
                        <label htmlFor="platform" className="block text-sm font-medium">Platform</label>
                        <select
                            id="platform"
                            value={newSocial.platform}
                            onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
                            className="mt-1 p-2 w-full border rounded"
                            required
                        >
                            <option value="">Select a Platform</option>
                            {socialMediaPlatforms.map((platform) => (
                                <option key={platform} value={platform}>
                                    {platform.charAt(0).toUpperCase() + platform.slice(1)} {/* Capitalize first letter */}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="link" className="block text-sm font-medium">Link</label>
                        <input
                            type="url"
                            id="link"
                            value={newSocial.link}
                            onChange={(e) => setNewSocial({ ...newSocial, link: e.target.value })}
                            className="mt-1 p-2 w-full border rounded"
                            placeholder="e.g. https://facebook.com/yourstore"
                            required
                        />
                    </div>
                    <div>
                        <button type="submit" className="mt-4 px-6 py-1 text-[14px] bg-primary text-white rounded-md hover:bg-blue-700">
                            {editing ? 'Update Social' : 'Add Social'}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default Socials;
