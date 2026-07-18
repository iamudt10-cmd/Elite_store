'use client';

import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import { FiShoppingBag } from 'react-icons/fi';

export default function Cart() {
  const { items } = useCartStore();

  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col gap-6 py-6 text-left">
      <div className="border-b border-white/20 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Shopping Cart</h1>
      </div>

      {isEmpty ? (
        <div className="max-w-md mx-auto w-full text-center mt-8">
          <GlassCard className="p-8 flex flex-col items-center gap-6" hover={false}>
            <div className="w-16 h-16 rounded-full bg-white/40 border border-white/40 flex items-center justify-center text-gray-400">
              <FiShoppingBag size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-700">Your cart is empty</h3>
              <p className="text-sm text-gray-400 mt-1">Looks like you haven&apos;t added anything to your cart yet.</p>
            </div>
            <Link href="/products" className="w-full">
              <GlassButton className="w-full text-sm">Start Shopping</GlassButton>
            </Link>
          </GlassCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items listing Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Checkout Totals Summary Column */}
          <div>
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
