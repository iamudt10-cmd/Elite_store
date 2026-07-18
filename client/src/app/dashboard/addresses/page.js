'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiMapPin, FiTrash2, FiEdit2 } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassButton from '../../../components/ui/GlassButton';
import GlassInput from '../../../components/ui/GlassInput';
import GlassModal from '../../../components/ui/GlassModal';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function UserAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/users/addresses');
      if (data.success) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error('Fetch addresses error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId('');
    setFormData({
      fullName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      isDefault: false,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setIsEditing(true);
    setEditingId(addr.id);
    setFormData({
      fullName: addr.fullName,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      phone: addr.phone || '',
      isDefault: addr.isDefault,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!formData.street.trim()) newErrors.street = 'Street is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditing) {
        const { data } = await api.put(`/users/addresses/${editingId}`, formData);
        if (data.success) {
          toast.success('Address updated successfully');
          setModalOpen(false);
          fetchAddresses();
        }
      } else {
        const { data } = await api.post('/users/addresses', formData);
        if (data.success) {
          toast.success('Address added successfully');
          setModalOpen(false);
          fetchAddresses();
        }
      }
    } catch (err) {
      toast.error('Failed to save address details');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { data } = await api.delete(`/users/addresses/${id}`);
      if (data.success) {
        toast.success('Address deleted');
        fetchAddresses();
      }
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      <div className="border-b border-white/20 pb-3 mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Your Shipping Addresses</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage multiple shipping destinations</p>
        </div>

        <GlassButton onClick={openAddModal} size="sm" className="flex items-center gap-1.5 py-2">
          <FiPlus size={16} /> Add Address
        </GlassButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-32 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
          <div className="h-32 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
        </div>
      ) : addresses.length === 0 ? (
        <GlassCard className="text-center py-16" hover={false}>
          <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center mx-auto text-gray-400 mb-4">
            <FiMapPin size={20} />
          </div>
          <h3 className="text-base font-bold text-gray-700">No Saved Addresses</h3>
          <p className="text-sm text-gray-400 mt-1">Add shipping addresses for a faster checkout flow.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <GlassCard
              key={addr.id}
              className={`p-5 flex flex-col justify-between border ${
                addr.isDefault ? 'border-lavender-300 ring-1 ring-lavender-300 bg-white/30' : 'border-white/30'
              }`}
              hover={false}
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-gray-800 text-sm">{addr.fullName}</p>
                  {addr.isDefault && (
                    <span className="bg-lavender-100 text-lavender-600 font-bold text-[9px] uppercase px-2 py-0.5 rounded-md border border-lavender-200">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{addr.street}</p>
                <p className="text-xs text-gray-500">
                  {addr.city}, {addr.state} - {addr.zipCode}
                </p>
                {addr.phone && <p className="text-xs text-gray-400 mt-1">Phone: {addr.phone}</p>}
              </div>

              {/* Actions row */}
              <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={() => openEditModal(addr)}
                  className="text-gray-400 hover:text-lavender-500 p-1.5 rounded-full hover:bg-white/40 transition-colors"
                  title="Edit address"
                >
                  <FiEdit2 size={13} />
                </button>
                <button
                  onClick={(e) => handleDelete(addr.id, e)}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-white/40 transition-colors"
                  title="Delete address"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Address Form modal */}
      <GlassModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Address' : 'Add New Address'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <GlassInput
            label="FullName"
            name="fullName"
            id="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            error={errors.fullName}
            required
          />
          <GlassInput
            label="Street Address"
            name="street"
            id="street"
            value={formData.street}
            onChange={handleInputChange}
            error={errors.street}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="City"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleInputChange}
              error={errors.city}
              required
            />
            <GlassInput
              label="State"
              name="state"
              id="state"
              value={formData.state}
              onChange={handleInputChange}
              error={errors.state}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="ZIP / Pin Code"
              name="zipCode"
              id="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              error={errors.zipCode}
              required
            />
            <GlassInput
              label="Phone Number"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
          
          <label className="flex items-center gap-3 text-sm text-gray-600 font-semibold cursor-pointer py-2 pl-1 select-none">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-lavender-500 focus:ring-lavender-400 w-4 h-4"
            />
            Set as default shipping address
          </label>

          <GlassButton type="submit" className="mt-2 self-end">
            Save Address
          </GlassButton>
        </form>
      </GlassModal>
    </div>
  );
}
