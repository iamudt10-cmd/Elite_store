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
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cod'

  const symbol = siteSettings.currency_symbol || '₹';

  const handleCOD = async () => {
    setIsProcessing(true);
    try {
      // Pass COD payload — no Razorpay IDs, just flag it as COD
      await onNext({ paymentMethod: 'COD', razorpayOrderId: orderId });
    } catch (err) {
      toast.error('Failed to place COD order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePay = () => {
    if (paymentMethod === 'cod') {
      handleCOD();
      return;
    }

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
        onNext({
          paymentMethod: 'RAZORPAY',
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#8b5cf6' },
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
      toast.error('Failed to open payment modal. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-left">
      <GlassCard className="p-6 flex flex-col gap-5" hover={false}>
        <h4 className="text-base font-bold text-gray-800 border-b border-white/20 pb-2">
          Select Payment Method
        </h4>

        {/* Payment method selector */}
        <div className="flex flex-col gap-3">
          {/* Razorpay option */}
          <button
            type="button"
            onClick={() => setPaymentMethod('razorpay')}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              paymentMethod === 'razorpay'
                ? 'border-lavender-500 bg-lavender-50/40'
                : 'border-white/30 bg-white/20 hover:bg-white/30'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              paymentMethod === 'razorpay' ? 'border-lavender-500' : 'border-gray-300'
            }`}>
              {paymentMethod === 'razorpay' && (
                <div className="w-2.5 h-2.5 rounded-full bg-lavender-500" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Pay Online</p>
              <p className="text-xs text-gray-400 mt-0.5">Cards, UPI, Net Banking via Razorpay</p>
            </div>
            <span className="ml-auto text-xs bg-lavender-100 text-lavender-700 font-bold px-2 py-0.5 rounded-lg">Secure</span>
          </button>

          {/* COD option */}
          <button
            type="button"
            onClick={() => setPaymentMethod('cod')}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              paymentMethod === 'cod'
                ? 'border-mint-500 bg-mint-50/40'
                : 'border-white/30 bg-white/20 hover:bg-white/30'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              paymentMethod === 'cod' ? 'border-mint-500' : 'border-gray-300'
            }`}>
              {paymentMethod === 'cod' && (
                <div className="w-2.5 h-2.5 rounded-full bg-mint-500" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Cash on Delivery</p>
              <p className="text-xs text-gray-400 mt-0.5">Pay with cash when your order arrives</p>
            </div>
            <span className="ml-auto text-xs bg-mint-100 text-mint-700 font-bold px-2 py-0.5 rounded-lg">COD</span>
          </button>
        </div>

        {/* Amount summary */}
        <div className="bg-white/30 border border-white/40 p-4 rounded-2xl flex justify-between font-bold text-base text-gray-800">
          <span>Amount {paymentMethod === 'cod' ? 'on Delivery' : 'Payable'}:</span>
          <span className="text-lavender-600">{symbol}{amount.toLocaleString('en-IN')}</span>
        </div>

        {paymentMethod === 'cod' && (
          <div className="bg-amber-50/60 border border-amber-200/50 text-amber-700 text-xs px-3 py-2.5 rounded-xl font-medium">
            💵 You will pay <strong>{symbol}{amount.toLocaleString('en-IN')}</strong> in cash when your order is delivered to your door.
          </div>
        )}

        {demoMode && paymentMethod === 'razorpay' && (
          <div className="bg-amber-100/40 border border-amber-200/40 text-amber-700 text-xs px-3 py-2.5 rounded-xl font-medium">
            Demo Mode: Orders will bypass real payment gateway hooks and run simulated signature verifications.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-1">
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
            {paymentMethod === 'cod' ? '📦 Place COD Order' : '🔒 Pay with Razorpay'}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}
