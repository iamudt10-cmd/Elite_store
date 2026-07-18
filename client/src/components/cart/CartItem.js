'use client';

import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { FiTrash2 } from 'react-icons/fi';
import QuantityPicker from '../ui/QuantityPicker';
import GlassCard from '../ui/GlassCard';
import toast from 'react-hot-toast';

export default function CartItem({ item }) {
  const { token } = useAuthStore();
  const { updateQuantity, removeItem } = useCartStore();
  const { siteSettings } = useUiStore();

  const handleQtyChange = async (newQty) => {
    const res = await updateQuantity(item.id, newQty, token);
    if (!res.success) {
      toast.error(res.message);
    }
  };

  const handleRemove = async () => {
    const res = await removeItem(item.id, token);
    if (res.success) {
      toast.success('Removed from cart');
    } else {
      toast.error(res.message);
    }
  };

  const symbol = siteSettings.currency_symbol || '₹';
  const price = item.product?.price || 0;
  const totalItemPrice = price * item.quantity;

  return (
    <GlassCard className="p-4 flex items-center gap-4 text-left relative overflow-hidden" hover={false}>
      {/* Product Image */}
      <div className="w-20 md:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-white/20 flex-shrink-0">
        <img
          src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=100'}
          alt={item.product?.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm md:text-base font-semibold text-gray-800 truncate mb-0.5">
          {item.product?.name}
        </h4>
        
        {/* Attributes variants (Size, Color) */}
        <div className="flex flex-wrap gap-2 mb-3">
          {item.size && (
            <span className="glass bg-white/40 border-white/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-gray-500">
              Size: {item.size}
            </span>
          )}
          {item.color && (
            <span className="glass bg-white/40 border-white/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-gray-500">
              Color: {item.color}
            </span>
          )}
        </div>

        {/* Quantity Picker & Action */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <QuantityPicker
            quantity={item.quantity}
            setQuantity={handleQtyChange}
            max={item.product?.stock || 99}
          />

          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700">
              {symbol}{totalItemPrice.toLocaleString('en-IN')}
            </span>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-white/40"
              title="Remove item"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
