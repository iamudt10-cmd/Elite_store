'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import CheckoutSteps from '../../components/checkout/CheckoutSteps';
import ShippingForm from '../../components/checkout/ShippingForm';
import PaymentForm from '../../components/checkout/PaymentForm';
import OrderConfirmation from '../../components/checkout/OrderConfirmation';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PriceTag from '../../components/ui/PriceTag';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { items, getTotals, clearCart, promoCode } = useCartStore();
  const { siteSettings } = useUiStore();

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  
  // Razorpay transaction states
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Completed final order result record
  const [placedOrder, setPlacedOrder] = useState(null);

  const symbol = siteSettings.currency_symbol || '₹';
  const { subtotal, discount, shipping, total } = getTotals();

  // Route security shield
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Authentication required. Please sign in to continue.');
      router.push(`/auth/login?redirect=/checkout`);
      return;
    }

    if (items.length === 0 && step < 4) {
      toast.error('Your cart is empty. Add products before checkout.');
      router.push('/cart');
      return;
    }

    // Fetch user's saved addresses
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/users/addresses');
        if (data.success) {
          setSavedAddresses(data.addresses);
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  // Shipping Form completion hook
  const handleShippingSubmit = (addr) => {
    setShippingAddress(addr);
    setStep(2);
    initializePaymentOrder(addr);
  };

  // Trigger Razorpay order creation on backend
  const initializePaymentOrder = async (addr) => {
    setIsCreatingOrder(true);
    try {
      const { data } = await api.post('/checkout/create-order', {
        promoCode,
      });
      if (data.success) {
        setPaymentOrder(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment order');
      setStep(1);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Payment confirmation hook
  const handlePaymentSubmit = (payload) => {
    setPaymentDetails(payload); // Contains order id, payment id, signature
    setStep(3);
  };

  // Place Final order database record
  const handlePlaceOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const { data } = await api.post('/orders', {
        shippingName: shippingAddress.fullName,
        shippingStreet: shippingAddress.street,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZip: shippingAddress.zipCode,
        shippingCountry: shippingAddress.country || 'IN',
        razorpayOrderId: paymentDetails.razorpayOrderId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
        razorpaySignature: paymentDetails.razorpaySignature,
        promoCode,
      });

      if (data.success) {
        setPlacedOrder(data.order);
        clearCart(token); // Clear user's backend DB and local cart items
        toast.success('Order placed successfully!');
        setStep(4);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to finalize purchase order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-6 text-left">
      <div className="border-b border-white/20 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Checkout Checkout</h1>
      </div>

      <CheckoutSteps currentStep={step} />

      {step === 1 && (
        <ShippingForm onNext={handleShippingSubmit} savedAddresses={savedAddresses} />
      )}

      {step === 2 && (
        <div className="flex flex-col items-center">
          {isCreatingOrder ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-gray-500 font-semibold">
              <span className="animate-spin w-8 h-8 border-4 border-lavender-500 border-t-transparent rounded-full" />
              Initializing payment gateway channels...
            </div>
          ) : (
            paymentOrder && (
              <PaymentForm
                onNext={handlePaymentSubmit}
                onBack={() => setStep(1)}
                amount={paymentOrder.total}
                orderId={paymentOrder.orderId}
                demoMode={paymentOrder.demoMode}
              />
            )
          )}
        </div>
      )}

      {step === 3 && shippingAddress && paymentDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl mx-auto w-full">
          {/* Detailed Review column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Shipping Card */}
            <GlassCard className="p-5 flex flex-col gap-3" hover={false}>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-white/10 pb-1.5">
                Delivery Details
              </h4>
              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-800">{shippingAddress.fullName}</p>
                <p className="mt-1 leading-relaxed">{shippingAddress.street}</p>
                <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zipCode}</p>
                <p>{shippingAddress.country}</p>
              </div>
            </GlassCard>

            {/* Payment Details Card */}
            <GlassCard className="p-5 flex flex-col gap-3" hover={false}>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-white/10 pb-1.5">
                Payment Verification ID
              </h4>
              <div className="text-sm text-gray-600 font-mono text-xs">
                <p>Order ID: {paymentDetails.razorpayOrderId}</p>
                <p className="mt-1">Payment ID: {paymentDetails.razorpayPaymentId}</p>
              </div>
            </GlassCard>

            {/* Cart Items listing */}
            <GlassCard className="p-5 flex flex-col gap-3" hover={false}>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-white/10 pb-1.5">
                Items Summary
              </h4>
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 text-xs md:text-sm">
                    <img
                      src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=100'}
                      alt={item.product?.name}
                      className="w-12 aspect-[3/4] object-cover rounded-lg border border-white/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.product?.name}</p>
                      <p className="text-gray-400 mt-0.5">Qty: {item.quantity} | Size: {item.size || 'N/A'}</p>
                    </div>
                    <span className="font-bold text-gray-700">
                      {symbol}{(item.product?.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Checkout Review Totals Summary Column */}
          <div>
            <GlassCard className="p-6 flex flex-col gap-5" hover={false}>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-white/10 pb-1.5">
                Totals Breakdown
              </h4>
              <div className="flex flex-col gap-3 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-700">{symbol}{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-mint-500 font-semibold">
                    <span>Discount Applied</span>
                    <span>-{symbol}{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="font-semibold text-gray-700">
                    {shipping === 0 ? 'FREE' : `${symbol}${shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-800 border-t border-white/20 pt-3 mt-1">
                  <span>Grand Total</span>
                  <span className="text-lavender-600">{symbol}{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <GlassButton
                onClick={handlePlaceOrder}
                loading={isCreatingOrder}
                className="w-full mt-2"
              >
                Place Order
              </GlassButton>
            </GlassCard>
          </div>
        </div>
      )}

      {step === 4 && placedOrder && (
        <OrderConfirmation order={placedOrder} />
      )}
    </div>
  );
}
