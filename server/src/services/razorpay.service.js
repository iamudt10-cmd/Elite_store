const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config');

// Initialize Razorpay instance if keys are present
let razorpay;
if (config.razorpayKeyId && config.razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
} else {
  console.warn('WARNING: Razorpay keys are missing from environment configuration. Payment integrations will run in simulated demo mode.');
}

const createOrder = async (amountInINR, receiptId) => {
  if (!razorpay) {
    // Return dummy order if keys are missing
    const dummyId = `order_dummy_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: dummyId,
      amount: amountInINR * 100,
      currency: 'INR',
      receipt: receiptId,
      demoMode: true,
      key_id: 'rzp_test_TF3dSkIL8U4WGg'
    };
  }

  try {
    const options = {
      amount: Math.round(amountInINR * 100), // Razorpay expects amount in paise (cents)
      currency: 'INR',
      receipt: receiptId,
    };
    const order = await razorpay.orders.create(options);
    return {
      ...order,
      key_id: config.razorpayKeyId,
    };
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    throw new Error(`Payment service failed to initialize order: ${error.message}`);
  }
};

const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  if (!razorpay) {
    // In demo mode, accept any signature beginning with 'verify_dummy' or verify simple strings
    return razorpayOrderId.startsWith('order_dummy_') || razorpaySignature === 'demo_sig';
  }

  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(text)
      .digest('hex');

    return generatedSignature === razorpaySignature;
  } catch (error) {
    console.error('Razorpay Signature Verification Error:', error);
    return false;
  }
};

const refundPayment = async (paymentId, amountInINR) => {
  if (!razorpay || !paymentId || paymentId.startsWith('verify_dummy') || paymentId.includes('dummy')) {
    return {
      id: `rfnd_dummy_${Math.random().toString(36).substr(2, 9)}`,
      entity: 'refund',
      amount: amountInINR * 100,
      status: 'processed',
      demoMode: true
    };
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amountInINR * 100), // paise
    });
    return refund;
  } catch (error) {
    console.error('Razorpay Refund Error:', error);
    throw new Error(`Refund failed: ${error.message}`);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  refundPayment,
};
