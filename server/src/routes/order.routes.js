const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

router.get('/', requireAuth, orderController.getUserOrders);
router.get('/admin/all', requireAdmin, orderController.getAllOrders);
router.get('/:id', requireAuth, orderController.getOrderById);
router.post('/', requireAuth, validate(createOrderSchema), orderController.createOrder);

router.put('/:id/status', requireAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.put('/:id/accept', requireAdmin, orderController.acceptOrder);
router.put('/:id/reject', requireAdmin, orderController.rejectOrder);
router.put('/:id/ship', requireAdmin, orderController.shipOrder);
router.put('/:id/delivery-status', requireAdmin, orderController.updateDeliveryStatus);
router.put('/:id/toggle-paid', requireAdmin, orderController.togglePaymentPaid);
router.put('/:id/refund', requireAdmin, orderController.refundOrder);

module.exports = router;
