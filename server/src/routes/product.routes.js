const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

router.get('/', productController.getProducts);
router.get('/:slug', productController.getProductBySlug);
router.post('/', requireAdmin, validate(createProductSchema), productController.createProduct);
router.put('/:id', requireAdmin, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', requireAdmin, productController.deleteProduct);

module.exports = router;
