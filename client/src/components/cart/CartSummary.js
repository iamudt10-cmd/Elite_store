'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import toast from 'react-hot-toast';

export default function CartSummary() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { getTotals, applyPromoCode, promoCode, discountPercent } = useCartStore();
  const { siteSettings } = useUiStore();

  const [promoInput, setPromoInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const { subtotal, discount, shipping, total } = getTotals();
  const symbol = siteSettings.currency_symbol || '₹';

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to apply promo codes');
      return;
    }

    if (!promoInput.trim()) return;

    setIsApplying(true);
    const res = await applyPromoCode(promoInput.trim().toUpperCase(), token);
    setIsApplying(false);

    if (res.success) {
      toast.success(`Promo code applied! Saved ${res.discountPercent}%`);
      setPromoInput('');
    } else {
      toast.error(res.message);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to complete your checkout');
      router.push(`/auth/login?redirect=/checkout`);
      return;
    }
    router.push('/checkout');
  };

  const freeShippingThreshold = parseFloat(siteSettings.free_shipping_threshold || '5000');
  const amountToFreeShipping = freeShippingThreshold - subtotal;

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Free Shipping incentive alert bar */}
      {amountToFreeShipping > 0 && subtotal > 0 && (
        <div className="glass bg-white/40 border-white/40 rounded-xl p-3 text-xs text-gray-500 font-semibold text-center">
          Add <span className="text-lavender-600 font-bold">{symbol}{amountToFreeShipping.toLocaleString('en-IN')}</span> more to unlock <span className="text-mint-500 font-bold">FREE SHIPPING</span>!
        </div>
      )}

      <GlassCard className="p-6 flex flex-col gap-5" hover={false}>
        <h3 className="text-lg font-bold text-gray-800 border-b border-white/20 pb-2">
          Order Summary
        </h3>

        {/* Promo code apply input form */}
        <form onSubmit={handleApplyPromo} className="flex gap-2">
          <GlassInput
            placeholder="PROMO CODE"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            className="flex-1"
          />
          <GlassButton type="submit" variant="secondary" loading={isApplying} className="px-4">
            Apply
          </GlassButton>
        </form>

        {promoCode && (
          <div className="flex justify-between items-center text-xs text-mint-600 font-bold bg-mint-50/50 border border-mint-100 px-3 py-2 rounded-xl">
            <span>Code: {promoCode} ({discountPercent}% Off)</span>
          </div>
        )}

        {/* Calculation listing details */}
        <div className="flex flex-col gap-3 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-700">{symbol}{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-mint-500 font-semibold">
              <span>Discount</span>
              <span>-{symbol}{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-gray-700">
              {shipping === 0 ? 'FREE' : `${symbol}${shipping.toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-800 border-t border-white/20 pt-3 mt-1">
            <span>Total</span>
            <span className="text-lavender-600">{symbol}{total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Button */}
        <GlassButton
          onClick={handleCheckout}
          disabled={subtotal === 0}
          className="w-full mt-2"
        >
          Proceed to Checkout
        </GlassButton>
      </GlassCard>
    </div>
  );
}
