'use client';

import { useState, useEffect } from 'react';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import GlassCard from '../ui/GlassCard';
import api from '../../lib/api';

export default function ShippingForm({ onNext, savedAddresses = [] }) {
  const [addresses, setAddresses] = useState(savedAddresses);
  const [selectedAddrId, setSelectedAddrId] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'IN',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (savedAddresses.length > 0) {
      setAddresses(savedAddresses);
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      if (def) {
        setSelectedAddrId(def.id);
        setFormData({
          fullName: def.fullName,
          street: def.street,
          city: def.city,
          state: def.state,
          zipCode: def.zipCode,
          country: def.country || 'IN',
        });
      }
    }
  }, [savedAddresses]);

  const handleSelectSaved = (id) => {
    setSelectedAddrId(id);
    const addr = addresses.find((a) => a.id === id);
    if (addr) {
      setFormData({
        fullName: addr.fullName,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country || 'IN',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP / Postal code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-2xl mx-auto text-left">
      {/* Saved Addresses list option */}
      {addresses.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Select Shipping Address
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((addr) => {
              const isSelected = selectedAddrId === addr.id;
              return (
                <GlassCard
                  key={addr.id}
                  onClick={() => handleSelectSaved(addr.id)}
                  className={`p-4 cursor-pointer border ${
                    isSelected ? 'border-lavender-400 bg-white/40 ring-1 ring-lavender-400' : 'border-white/30'
                  }`}
                  hover={true}
                >
                  <p className="font-semibold text-sm text-gray-800">{addr.fullName}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{addr.street}</p>
                  <p className="text-xs text-gray-500">
                    {addr.city}, {addr.state} - {addr.zipCode}
                  </p>
                </GlassCard>
              );
            })}
          </div>
          
          <div className="flex items-center gap-3 my-2">
            <div className="h-[1px] bg-white/20 flex-1" />
            <span className="text-xs font-bold text-gray-400">OR ENTER A NEW ADDRESS</span>
            <div className="h-[1px] bg-white/20 flex-1" />
          </div>
        </div>
      )}

      {/* Address Form Inputs */}
      <div className="flex flex-col gap-4">
        <GlassInput
          label="Full Recipient Name"
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
            label="Country"
            name="country"
            id="country"
            value={formData.country}
            onChange={handleInputChange}
            disabled
          />
        </div>
      </div>

      <GlassButton type="submit" className="self-end mt-4">
        Proceed to Payment
      </GlassButton>
    </form>
  );
}

// Quick helper to bypass typo in code content above
function ChevronGlassCard({ children, ...props }) {
  return <GlassCard {...props}>{children}</GlassCard>;
}
