'use client';

import Link from 'next/link';
import { useUiStore } from '../../store/uiStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

export default function OrderConfirmation({ order }) {
  const { siteSettings } = useUiStore();
  const symbol = siteSettings.currency_symbol || '₹';

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-xl mx-auto text-center mt-6">
      <GlassCard className="p-8 flex flex-col items-center gap-6" hover={false}>
        {/* Animated Checkmark Circle */}
        <div className="w-16 h-16 rounded-full bg-mint-100/40 border border-mint-200 flex items-center justify-center text-mint-500 shadow-glow">
          <svg
            className="w-8 h-8 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h2>
          <p className="text-sm text-gray-500">
            Thank you for shopping at {siteSettings.site_name || 'Elite Style'}. Your transaction was completed successfully.
          </p>
        </div>

        {/* Details Card */}
        <div className="w-full bg-white/30 border border-white/40 rounded-2xl p-5 text-left text-sm flex flex-col gap-2.5 text-gray-600">
          <div className="flex justify-between">
            <span>Order Number:</span>
            <span className="font-semibold text-gray-800">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Order Date:</span>
            <span>{orderDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Transaction ID:</span>
            <span className="font-mono text-xs">{order.razorpayPaymentId}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2.5 mt-1 font-bold text-base text-gray-800">
            <span>Amount Paid:</span>
            <span className="text-lavender-600">{symbol}{order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Information Callout */}
        <div className="bg-lavender-50/50 border border-lavender-100/50 rounded-xl p-3.5 text-xs text-lavender-600 text-left leading-relaxed">
          <strong>Notice:</strong> Your order status is currently set to <strong>PENDING</strong> and is awaiting administrator verification. You will be updated as the package moves to processing.
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/dashboard/orders" className="flex-1">
            <GlassButton variant="secondary" className="w-full text-sm">
              View Order History
            </GlassButton>
          </Link>
          <Link href="/products" className="flex-1">
            <GlassButton className="w-full text-sm">
              Continue Shopping
            </GlassButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
