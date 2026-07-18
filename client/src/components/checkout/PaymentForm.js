'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import toast from 'react-hot-toast';

export default function PaymentForm({ onNext, onBack, amount, orderId, demoMode }) {
  const { user } = useAuthStore();
  const { siteSettings } = useUiStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const symbol = siteSettings.currency_symbol || '₹';

  const handlePay = () => {
    if (typeof window === 'undefined') return;

    if (!window.Razorpay) {
      toast.error('Payment checkout SDK failed to load. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TF3dSkIL8U4WGg',
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      name: siteSettings.site_name || 'Elite Style',
      description: 'E-commerce Purchase Checkout',
      order_id: orderId,
      handler: function (response) {
        setIsProcessing(false);
        // Pass checkout confirmation payload details back to wizard parent
        onNext({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: {
        color: '#8b5cf6', // purple theme color
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          toast.error('Payment window closed. Please complete checkout to place order.');
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      console.error('Razorpay runtime launch error:', err);
      toast.error('Failed to open payment modal. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-left">
      <GlassCard className="p-6 flex flex-col gap-6" hover={false}>
        <h4 className="text-base font-bold text-gray-800 border-b border-white/20 pb-2">
          Secure Payment Integration
        </h4>

        {/* Info detail banner */}
        <div className="bg-white/30 border border-white/40 p-4 rounded-2xl flex flex-col gap-1 text-sm text-gray-600">
          <div className="flex justify-between font-semibold">
            <span>Payment Method:</span>
            <span className="text-lavender-600">Razorpay Secure Checkout</span>
          </div>
          <div className="flex justify-between font-bold text-base text-gray-800 mt-3 pt-3 border-t border-white/10">
            <span>Amount Payable:</span>
            <span className="text-lavender-600">{symbol}{amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {demoMode && (
          <div className="bg-amber-100/40 border border-amber-200/40 text-amber-700 text-xs px-3 py-2.5 rounded-xl font-medium">
            Demo Mode Enabled: Orders will bypass real payment gateway hooks and run simulated signature verifications.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={onBack}
            className="w-1/3"
            disabled={isProcessing}
          >
            Back
          </GlassButton>
          <GlassButton
            type="button"
            onClick={handlePay}
            loading={isProcessing}
            className="flex-1"
          >
            Pay with Razorpay
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}
