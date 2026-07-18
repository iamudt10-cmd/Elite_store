const { z } = require('zod');

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be a positive number'),
    comparePrice: z.number().positive('Compare price must be positive').optional().nullable(),
    images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    featured: z.boolean().optional(),
    categoryId: z.string().min(1, 'Category is required'),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    comparePrice: z.number().positive('Compare price must be positive').optional().nullable(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
    featured: z.boolean().optional(),
    categoryId: z.string().optional(),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
