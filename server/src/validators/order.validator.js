const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    shippingName: z.string().min(2, 'Name is required'),
    shippingStreet: z.string().min(5, 'Street address is required'),
    shippingCity: z.string().min(2, 'City is required'),
    shippingState: z.string().min(2, 'State is required'),
    shippingZip: z.string().min(3, 'ZIP/Postal code is required'),
    shippingCountry: z.string().min(2, 'Country is required'),
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
    promoCode: z.string().optional().nullable(),
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    adminNote: z.string().optional().nullable(),
    rejectedReason: z.string().optional().nullable(),
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
