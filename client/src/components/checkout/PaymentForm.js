'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import toast from 'react-hot-toast';

export default function PaymentForm({ onNext, onBack, amount, orderId, demoMode }) {
  const { user } = useAuthStore();
  const { siteSettings } = useUiStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [upiId, setUpiId] = useState('');

  const symbol = siteSettings.currency_symbol || '₹';

  const handleCOD = async () => {
    setIsProcessing(true);
    try {
      await onNext({ paymentMethod: 'COD', razorpayOrderId: orderId });
    } catch (err) {
      toast.error('Failed to place COD order. Please try again.');
      setIsProcessing(false);
    }
  };

  const openRazorpay = (extraOptions = {}) => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      toast.error('Payment SDK failed to load. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TF3dSkIL8U4WGg',
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: siteSettings.site_name || 'Elite Style',
      description: 'E-commerce Purchase',
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
        contact: user?.phone || '',
      },
      theme: { color: '#8b5cf6' },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          toast.error('Payment window closed. Please try again to complete your order.');
        },
      },
      ...extraOptions,
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      toast.error('Failed to open payment modal. Please try again.');
    }
  };

  const handlePay = () => {
    if (paymentMethod === 'cod') {
      handleCOD();
      return;
    }

    if (paymentMethod === 'upi') {
      if (!upiId.trim()) {
        toast.error('Please enter your UPI ID (e.g. name@upi)');
        return;
      }
      // Basic UPI ID validation
      if (!upiId.includes('@')) {
        toast.error('Invalid UPI ID format. Example: name@okaxis');
        return;
      }
      openRazorpay({
        method: 'upi',
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          vpa: upiId.trim(), // pre-fill UPI ID
        },
      });
      return;
    }

    // Default Razorpay (cards/netbanking)
    openRazorpay();
  };

  const methods = [
    {
      id: 'razorpay',
      title: 'Cards / Net Banking',
      subtitle: 'Debit card, credit card, or net banking',
      badge: 'Secure',
      badgeColor: 'lavender',
      icon: '💳',
    },
    {
      id: 'upi',
      title: 'UPI',
      subtitle: 'Pay via any UPI app instantly',
      badge: 'Instant',
      badgeColor: 'mint',
      icon: '⚡',
    },
    {
      id: 'cod',
      title: 'Cash on Delivery',
      subtitle: 'Pay with cash when order arrives',
      badge: 'COD',
      badgeColor: 'amber',
      icon: '💵',
    },
  ];

  const badgeClasses = {
    lavender: 'bg-lavender-100 text-lavender-700',
    mint: 'bg-mint-100 text-mint-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  const selectedBorderClasses = {
    lavender: 'border-lavender-500 bg-lavender-50/40',
    mint: 'border-mint-500 bg-mint-50/40',
    amber: 'border-amber-400 bg-amber-50/30',
  };

  const radioDotClasses = {
    lavender: 'border-lavender-500',
    mint: 'border-mint-500',
    amber: 'border-amber-400',
  };

  const dotFillClasses = {
    lavender: 'bg-lavender-500',
    mint: 'bg-mint-500',
    amber: 'bg-amber-400',
  };

  const selectedMethod = methods.find(m => m.id === paymentMethod);

  return (
    <div className="w-full max-w-md mx-auto text-left">
      <GlassCard className="p-6 flex flex-col gap-5" hover={false}>
        <h4 className="text-base font-bold text-gray-800 border-b border-white/20 pb-2">
          Select Payment Method
        </h4>

        {/* Payment method selector */}
        <div className="flex flex-col gap-3">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                paymentMethod === m.id
                  ? selectedBorderClasses[m.badgeColor]
                  : 'border-white/30 bg-white/20 hover:bg-white/30'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === m.id ? radioDotClasses[m.badgeColor] : 'border-gray-300'
                }`}
              >
                {paymentMethod === m.id && (
                  <div className={`w-2.5 h-2.5 rounded-full ${dotFillClasses[m.badgeColor]}`} />
                )}
              </div>
              <span className="text-lg">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{m.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.subtitle}</p>
              </div>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${badgeClasses[m.badgeColor]}`}>
                {m.badge}
              </span>
            </button>
          ))}
        </div>

        {/* UPI ID input — only shown when UPI is selected */}
        {paymentMethod === 'upi' && (
          <div className="flex flex-col gap-2">
            <GlassInput
              label="UPI ID"
              placeholder="yourname@okaxis / yourname@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-400 px-1">
              Enter any UPI ID (GPay, PhonePe, Paytm, BHIM etc.)
              {demoMode && <span className="text-amber-600 font-semibold ml-1">— Test: use <code>success@razorpay</code></span>}
            </p>
          </div>
        )}

        {/* Amount summary */}
        <div className="bg-white/30 border border-white/40 p-4 rounded-2xl flex justify-between font-bold text-sm text-gray-800">
          <span>Amount {paymentMethod === 'cod' ? 'on Delivery' : 'Payable'}:</span>
          <span className="text-lavender-600 text-base">{symbol}{amount.toLocaleString('en-IN')}</span>
        </div>

        {paymentMethod === 'cod' && (
          <div className="bg-amber-50/60 border border-amber-200/50 text-amber-700 text-xs px-3 py-2.5 rounded-xl font-medium">
            💵 Pay <strong>{symbol}{amount.toLocaleString('en-IN')}</strong> in cash when your order is delivered.
          </div>
        )}

        {demoMode && paymentMethod === 'razorpay' && (
          <div className="bg-amber-100/40 border border-amber-200/40 text-amber-700 text-xs px-3 py-2.5 rounded-xl font-medium">
            Demo Mode: Simulated payment verification is active.
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
            {paymentMethod === 'cod' && '📦 Place COD Order'}
            {paymentMethod === 'upi' && '⚡ Pay via UPI'}
            {paymentMethod === 'razorpay' && '🔒 Pay Securely'}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}
