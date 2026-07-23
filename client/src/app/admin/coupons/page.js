'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassModal from '@/components/ui/GlassModal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/promo-codes');
      if (data.success) {
        setCoupons(data.promoCodes);
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setCode('');
    setDiscountPercent('');
    setMaxUses('100');
    setActive(true);
    setExpiresAt('');
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingId(coupon.id);
    setCode(coupon.code);
    setDiscountPercent(String(coupon.discountPercent));
    setMaxUses(String(coupon.maxUses));
    setActive(coupon.active);
    setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!code.trim() || !discountPercent) {
      toast.error('Code and discount percent are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountPercent: parseFloat(discountPercent),
        maxUses: parseInt(maxUses, 10) || 100,
        active,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (editingId) {
        const { data } = await api.put(`/admin/promo-codes/${editingId}`, payload);
        if (data.success) {
          toast.success('Promo code updated successfully');
          setModalOpen(false);
          fetchCoupons();
        }
      } else {
        const { data } = await api.post('/admin/promo-codes', payload);
        if (data.success) {
          toast.success('Promo code created successfully');
          setModalOpen(false);
          fetchCoupons();
        }
      }
    } catch (err) {
      console.error('Save promo code error:', err);
      toast.error(err.response?.data?.message || 'Failed to save promo code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this promo code permanently?')) {
      return;
    }

    try {
      const { data } = await api.delete(`/admin/promo-codes/${id}`);
      if (data.success) {
        toast.success('Promo code deleted successfully');
        fetchCoupons();
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete promo code');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Manage Promo Codes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Create discount coupons and track usage statistics</p>
        </div>
        <GlassButton onClick={handleOpenAdd} className="flex items-center gap-2 text-xs">
          <FiPlus size={16} /> Add Promo Code
        </GlassButton>
      </div>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/20 select-none">
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4 text-center">Usage Metrics</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15 text-sm text-gray-700">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 font-semibold">
                    No promo codes found. Click &quot;Add Promo Code&quot; to launch your first coupon.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-white/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-lavender-50 border border-lavender-100 flex items-center justify-center text-lavender-500">
                          <FiTag size={15} />
                        </div>
                        <span className="font-mono font-extrabold text-sm text-gray-800">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-700">{coupon.discountPercent}% Off</td>
                    <td className="p-4 text-center text-xs">
                      <span className="font-semibold text-gray-700">{coupon.usedCount}</span>
                      <span className="text-gray-400 font-medium"> / {coupon.maxUses} times used</span>
                      <div className="w-24 bg-white/30 rounded-full h-1.5 mx-auto mt-1 border border-white/10 overflow-hidden">
                        <div
                          className="bg-lavender-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {coupon.expiresAt ? (
                        new Date(coupon.expiresAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        <span className="text-gray-400 italic">No Expiration</span>
                      )}
                    </td>
                    <td className="p-4">
                      {coupon.active && (coupon.expiresAt === null || new Date(coupon.expiresAt) > new Date()) && coupon.usedCount < coupon.maxUses ? (
                        <span className="bg-mint-50 border border-mint-100 text-mint-600 px-2 py-0.5 rounded-full text-xs font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="bg-red-50 border border-red-100 text-red-500 px-2 py-0.5 rounded-full text-xs font-bold col-span-2">
                          Expired/Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(coupon)}
                          className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-white/50 rounded-xl transition-all"
                          title="Edit Coupon"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
                          title="Delete Coupon"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Promo Code' : 'Add Promo Code'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          <GlassInput
            label="Promo Code"
            type="text"
            id="coupon-code"
            placeholder="e.g. SUMMER50"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />

          <GlassInput
            label="Discount Percentage"
            type="number"
            id="coupon-discount"
            placeholder="e.g. 20"
            min="1"
            max="100"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            required
          />

          <GlassInput
            label="Maximum Usages"
            type="number"
            id="coupon-max-uses"
            placeholder="e.g. 100"
            min="1"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="coupon-expiry" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              id="coupon-expiry"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-white/30 border border-white/40 rounded-2xl p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400/40 focus:bg-white/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="coupon-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-lavender-500 border-white/40 focus:ring-lavender-400 focus:ring-offset-0 bg-white/30"
            />
            <label htmlFor="coupon-active" className="text-sm font-semibold text-gray-700 select-none">
              Mark this promo code as active and redeemable
            </label>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <GlassButton
              type="button"
              onClick={() => setModalOpen(false)}
              className="bg-transparent border border-white/40 text-gray-600 hover:bg-white/30"
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" loading={isSaving}>
              {editingId ? 'Save Changes' : 'Create Promo Code'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
