import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import EnhancedOfferForm from './OfferForm';
import { createOffer, fetchOffers, updateOffer, deleteOffer, getMerchantStores } from '../../services/api_service';
import { 
    Edit, Trash2, Eye, Calendar, Percent, Tag, Users, AlertCircle, Loader, Store, Plus,
    Calculator, DollarSign, Clock, Zap, Star, HelpCircle, CheckCircle, TrendingUp, Filter
} from 'lucide-react';

const EnhancedOfferPage = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [hasStore, setHasStore] = useState(true);
    const [storeError, setStoreError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, fixed, dynamic, active, expired

    useEffect(() => {
        checkStoreAndLoadOffers();
    }, []);

    const checkStoreAndLoadOffers = async () => {
        try {
            setLoading(true);
            setStoreError(null);
            
            console.log('🔍 Checking merchant stores...');
            
            try {
                const storesResponse = await getMerchantStores();
                const stores = storesResponse?.stores || storesResponse || [];
                
                if (stores.length === 0) {
                    console.log('⚠️ No stores found for merchant');
                    setHasStore(false);
                    setOffers([]);
                    return;
                }
                
                console.log('✅ Found stores:', stores.length);
                setHasStore(true);
                
                await loadOffers();
                
            } catch (storeCheckError) {
                console.error('❌ Store check failed:', storeCheckError);
                setStoreError(storeCheckError.message);
                setHasStore(false);
            }
            
        } catch (error) {
            console.error('❌ Failed to check stores and load offers:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const loadOffers = async () => {
        try {
            console.log('🔍 Loading offers...');
            
            const response = await fetchOffers();
            
            if (response.error) {
                console.log('⚠️ Offers API returned error:', response.error);
                setStoreError(response.error);
                setOffers([]);
            } else {
                const offersList = response?.offers || [];
                console.log('📋 Offers loaded:', offersList.length);
                setOffers(offersList);
            }
        } catch (error) {
            console.error('❌ Failed to fetch offers:', error);
            setOffers([]);
        }
    };

    const handleCreateOffer = async (offerData) => {
        try {
            console.log('➕ Creating offer:', offerData);
            await createOffer(offerData);
            toast.success('Offer created successfully');
            setModalOpen(false);
            loadOffers();
        } catch (error) {
            console.error('❌ Failed to create offer:', error);
            throw error;
        }
    };

    const handleUpdateOffer = async (offerData) => {
        try {
            console.log('🔄 Updating offer:', editingOffer.id, offerData);
            await updateOffer(editingOffer.id, offerData);
            toast.success('Offer updated successfully');
            setModalOpen(false);
            setEditingOffer(null);
            loadOffers();
        } catch (error) {
            console.error('❌ Failed to update offer:', error);
            throw error;
        }
    };

    const handleDeleteOffer = async (offerId) => {
        try {
            console.log('🗑️ Deleting offer:', offerId);
            await deleteOffer(offerId);
            toast.success('Offer deleted successfully');
            setDeleteConfirm(null);
            loadOffers();
        } catch (error) {
            console.error('❌ Failed to delete offer:', error);
            toast.error('Failed to delete offer');
        }
    };

    const handleEditClick = (offer) => {
        console.log('✏️ Editing offer:', offer);
        setEditingOffer(offer);
        setModalOpen(true);
    };

    const handleDeleteClick = (offer) => {
        setDeleteConfirm(offer);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingOffer(null);
    };

    // Filter offers based on current filter
    const filteredOffers = offers.filter(offer => {
        if (filter === 'all') return true;
        if (filter === 'fixed') return offer.offer_type === 'fixed' || !offer.offer_type;
        if (filter === 'dynamic') return offer.offer_type === 'dynamic';
        if (filter === 'active') return offer.status === 'active' && !isOfferExpired(offer.expiration_date);
        if (filter === 'expired') return isOfferExpired(offer.expiration_date);
        if (filter === 'featured') return offer.featured;
        return true;
    });

    const getStatusBadge = (status, expiration_date) => {
        const expired = isOfferExpired(expiration_date);
        const effectiveStatus = expired ? 'expired' : status;
        
        const statusClasses = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            expired: 'bg-red-100 text-red-800',
            paused: 'bg-yellow-100 text-yellow-800'
        };
        
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[effectiveStatus] || statusClasses.inactive}`}>
                {effectiveStatus}
            </span>
        );
    };

    const getOfferTypeBadge = (offer) => {
        const isDynamic = offer.offer_type === 'dynamic';
        
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center ${
                isDynamic 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
            }`}>
                {isDynamic ? (
                    <>
                        <Calculator className="w-3 h-3 mr-1" />
                        Dynamic
                    </>
                ) : (
                    <>
                        <DollarSign className="w-3 h-3 mr-1" />
                        Fixed
                    </>
                )}
            </span>
        );
    };

    const isOfferExpired = (expirationDate) => {
        return new Date(expirationDate) < new Date();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateStats = () => {
        const total = offers.length;
        const active = offers.filter(offer => offer.status === 'active' && !isOfferExpired(offer.expiration_date)).length;
        const expired = offers.filter(offer => isOfferExpired(offer.expiration_date)).length;
        const dynamic = offers.filter(offer => offer.offer_type === 'dynamic').length;
        const fixed = offers.filter(offer => offer.offer_type === 'fixed' || !offer.offer_type).length;
        const avgDiscount = offers.length > 0 ? Math.round(offers.reduce((sum, offer) => sum + (parseFloat(offer.discount) || 0), 0) / offers.length) : 0;

        return { total, active, expired, dynamic, fixed, avgDiscount };
    };

    const stats = calculateStats();

    // Loading state
    if (loading) {
        return (
            <Layout title="Offers">
                <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-primary mr-2" />
                    <span>Loading offers...</span>
                </div>
            </Layout>
        );
    }

    // No store state
    if (!hasStore) {
        return (
            <Layout title="Offers">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center max-w-md">
                        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Store Found</h3>
                        <p className="text-gray-600 mb-6">
                            You need to create a store and services before you can manage offers. 
                            Offers are created from existing services.
                        </p>
                        {storeError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{storeError}</p>
                            </div>
                        )}
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.href = '/dashboard/stores'}
                                className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark transition-colors flex items-center mx-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Store
                            </button>
                            <button
                                onClick={checkStoreAndLoadOffers}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title="Offers"
            rightContent={
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary text-white py-2 px-6 text-sm font-semibold rounded-md shadow-md hover:bg-primary-dark transition duration-300 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Offer
                </button>
            }
        >
            <div className="space-y-6">
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Offers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-xs text-gray-500">Fixed: {stats.fixed} • Dynamic: {stats.dynamic}</p>
                            </div>
                            <Tag className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Offers</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                <p className="text-xs text-gray-500">Available for booking</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Expired</p>
                                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                                <p className="text-xs text-gray-500">Past expiration date</p>
                            </div>
                            <Calendar className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg. Discount</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.avgDiscount}%</p>
                                <p className="text-xs text-gray-500">Across all offers</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Filter Offers
                        </h3>
                        <span className="text-sm text-gray-500">
                            Showing {filteredOffers.length} of {offers.length} offers
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'All Offers', count: stats.total },
                            { key: 'active', label: 'Active', count: stats.active },
                            { key: 'fixed', label: 'Fixed Price', count: stats.fixed },
                            { key: 'dynamic', label: 'Dynamic Price', count: stats.dynamic },
                            { key: 'expired', label: 'Expired', count: stats.expired },
                            { key: 'featured', label: 'Featured', count: offers.filter(o => o.featured).length }
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === key
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label} ({count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {storeError && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <span className="text-yellow-800">{storeError}</span>
                        </div>
                    </div>
                )}

                {/* Offers Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Offer Details
                                    </th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service & Type
                                    </th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expiration
                                    </th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOffers?.length > 0 ? (
                                    filteredOffers.map((offer) => {
                                        const expired = isOfferExpired(offer.expiration_date);
                                        const effectiveStatus = expired ? 'expired' : offer.status;
                                        const isDynamic = offer.offer_type === 'dynamic';
                                        
                                        return (
                                            <tr key={offer.id} className="hover:bg-gray-50">
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <div className="flex items-center">
                                                            <h3 className="text-sm font-medium text-gray-900">
                                                                {offer.title || offer.service?.name || 'Special Offer'}
                                                            </h3>
                                                            {offer.featured && (
                                                                <Star className="ml-2 w-4 h-4 text-yellow-500 fill-current" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {offer.description?.substring(0, 60)}
                                                            {offer.description?.length > 60 && '...'}
                                                        </p>
                                                        {isDynamic && offer.discount_explanation && (
                                                            <p className="text-xs text-orange-600 mt-1 italic">
                                                                {offer.discount_explanation.substring(0, 80)}...
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {offer.service?.name || 'Unknown Service'}
                                                            </p>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                {getOfferTypeBadge(offer)}
                                                                {offer.requires_consultation && (
                                                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center">
                                                                        <Users className="w-3 h-3 mr-1" />
                                                                        Consultation
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {offer.service && (
                                                            <div className="text-xs text-gray-500">
                                                                {isDynamic ? (
                                                                    <span>{offer.service.price_range || 'Price varies'}</span>
                                                                ) : (
                                                                    <>
                                                                        <span>KES {offer.service.price || 'N/A'}</span>
                                                                        {offer.service.duration && (
                                                                            <span> • {offer.service.duration}min</span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <p className="text-sm font-bold text-green-600">
                                                            {offer.discount}% OFF
                                                        </p>
                                                        {!isDynamic && offer.service?.price && (
                                                            <p className="text-xs text-gray-500">
                                                                Save KES {((offer.service.price * offer.discount) / 100).toFixed(2)}
                                                            </p>
                                                        )}
                                                        {isDynamic && (
                                                            <p className="text-xs text-orange-600">
                                                                Off final quote
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                                                        <span className={`text-sm ${expired ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                                            {formatDate(offer.expiration_date)}
                                                        </span>
                                                    </div>
                                                    {expired && (
                                                        <p className="text-xs text-red-500 mt-1">Expired</p>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {getStatusBadge(offer.status, offer.expiration_date)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(offer)}
                                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                                            title="Edit offer"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(offer)}
                                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                                            title="Delete offer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 px-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <Tag className="w-12 h-12 text-gray-300 mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                    {filter === 'all' ? 'No offers yet' : `No ${filter} offers found`}
                                                </h3>
                                                <p className="text-gray-500 mb-4">
                                                    {filter === 'all' 
                                                        ? 'Create your first offer to attract more customers'
                                                        : `Try selecting a different filter or create new offers`
                                                    }
                                                </p>
                                                <button
                                                    onClick={() => setModalOpen(true)}
                                                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
                                                >
                                                    Create Your First Offer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Offer Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                title={editingOffer ? 'Edit Offer' : 'Create Offer'}
                size="xl"
            >
                <EnhancedOfferForm 
                    onClose={closeModal} 
                    onOfferCreated={editingOffer ? handleUpdateOffer : handleCreateOffer}
                    editingOffer={editingOffer}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <Modal 
                    isOpen={true} 
                    onClose={() => setDeleteConfirm(null)} 
                    title="Delete Offer"
                >
                    <div className="p-6">
                        <div className="flex items-center text-red-600 mb-4">
                            <AlertCircle className="w-6 h-6 mr-2" />
                            <span className="font-medium">Are you sure?</span>
                        </div>
                        <p className="text-gray-600 mb-6">
                            This will permanently delete the offer "{deleteConfirm.title || deleteConfirm.service?.name}". 
                            This action cannot be undone and will affect any existing bookings.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteOffer(deleteConfirm.id)}
                                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete Offer
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
};

export default EnhancedOfferPage;