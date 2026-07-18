'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUiStore } from '../../../store/uiStore';
import { FiPlus, FiEdit2, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassButton from '../../../components/ui/GlassButton';
import GlassInput from '../../../components/ui/GlassInput';
import GlassSelect from '../../../components/ui/GlassSelect';
import GlassModal from '../../../components/ui/GlassModal';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const { token } = useAuthStore();
  const { siteSettings } = useUiStore();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    comparePrice: '',
    images: [],
    sizes: [],
    colors: [],
    stock: 0,
    featured: false,
    categoryId: '',
  });

  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [errors, setErrors] = useState({});

  const symbol = siteSettings.currency_symbol || '₹';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/products?limit=100'); // Load large set for management
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error('Fetch admin products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : (name === 'price' || name === 'stock')
        ? parseFloat(value) || 0
        : name === 'comparePrice'
        ? value === '' ? '' : parseFloat(value) || ''
        : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const { data } = await api.post('/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim().toUpperCase())) {
      setFormData((prev) => ({ ...prev, sizes: [...prev.sizes, sizeInput.trim().toUpperCase()] }));
      setSizeInput('');
    }
  };

  const removeSize = (val) => {
    setFormData((prev) => ({ ...prev, sizes: prev.sizes.filter((s) => s !== val) }));
  };

  const addColor = () => {
    if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
      setFormData((prev) => ({ ...prev, colors: [...prev.colors, colorInput.trim()] }));
      setColorInput('');
    }
  };

  const removeColor = (val) => {
    setFormData((prev) => ({ ...prev, colors: prev.colors.filter((c) => c !== val) }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than zero';
    if (!formData.categoryId) newErrors.categoryId = 'Category selection is required';
    if (formData.images.length === 0) newErrors.images = 'At least one product image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId('');
    setFormData({
      name: '',
      description: '',
      price: '',
      comparePrice: '',
      images: [],
      sizes: [],
      colors: [],
      stock: '',
      featured: false,
      categoryId: categories[0]?.id || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setIsEditing(true);
    setEditingId(prod.id);
    setFormData({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      comparePrice: prod.comparePrice || '',
      images: prod.images || [],
      sizes: prod.sizes || [],
      colors: prod.colors || [],
      stock: prod.stock,
      featured: prod.featured,
      categoryId: prod.categoryId,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    const payload = {
      ...formData,
      comparePrice: formData.comparePrice === '' ? null : formData.comparePrice,
    };

    try {
      if (isEditing) {
        const { data } = await api.put(`/products/${editingId}`, payload);
        if (data.success) {
          toast.success('Product updated successfully');
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        const { data } = await api.post('/products', payload);
        if (data.success) {
          toast.success('Product created successfully');
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product? This action is permanent.')) return;
    try {
      const { data } = await api.delete(`/products/${id}`);
      if (data.success) {
        toast.success('Product deleted');
        fetchProducts();
      }
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      <div className="border-b border-white/20 pb-3 mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Product Catalog Manager</h2>
          <p className="text-xs text-gray-400 mt-0.5">Add, modify and manage stock inventory</p>
        </div>

        <GlassButton onClick={openAddModal} size="sm" className="flex items-center gap-1.5 py-2">
          <FiPlus size={16} /> Add Product
        </GlassButton>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
        </div>
      ) : (
        <GlassCard className="p-0 overflow-x-auto" hover={false}>
          <table className="w-full text-sm text-left text-gray-600 border-collapse min-w-[700px]">
            <thead className="bg-white/10 border-b border-white/20 text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-white/10 transition-colors">
                  <td className="px-6 py-3">
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=100'}
                      alt={prod.name}
                      className="w-9 aspect-[3/4] object-cover rounded-lg border border-white/20"
                    />
                  </td>
                  <td className="px-6 py-3 font-semibold text-gray-800 truncate max-w-[200px]" title={prod.name}>
                    {prod.name}
                  </td>
                  <td className="px-6 py-3 font-semibold text-xs text-gray-400 uppercase">
                    {prod.category?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-800">
                    {symbol}{prod.price.toLocaleString('en-IN')}
                  </td>
                  <td className={`px-6 py-3 font-bold ${prod.stock <= 5 ? 'text-red-500' : 'text-mint-500'}`}>
                    {prod.stock}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="text-gray-400 hover:text-lavender-500 p-2 rounded-full hover:bg-white/40 transition-colors"
                        title="Edit product"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-white/40 transition-colors"
                        title="Delete product"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* CRUD Product Modal */}
      <GlassModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Product' : 'Add Product'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <GlassInput
            label="Product Name"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            required
          />

          <div className="flex flex-col text-left">
            <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 ml-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className={`glass w-full bg-white/30 rounded-2xl py-3 px-4 text-gray-700 placeholder-gray-400 text-sm border-white/30 focus:outline-none focus:ring-2 focus:ring-lavender-300/60 focus:bg-white/40 ${
                errors.description ? 'border-red-400' : ''
              }`}
            />
            {errors.description && <span className="text-red-500 text-xs mt-1 ml-2 font-medium">{errors.description}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Price (₹)"
              type="number"
              name="price"
              id="price"
              value={formData.price}
              onChange={handleInputChange}
              error={errors.price}
              required
            />
            <GlassInput
              label="Compare At Price (₹ - Optional)"
              type="number"
              name="comparePrice"
              id="comparePrice"
              value={formData.comparePrice}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassSelect
              label="Category"
              name="categoryId"
              id="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              error={errors.categoryId}
              required
            />
            <GlassInput
              label="Stock Quantity"
              type="number"
              name="stock"
              id="stock"
              value={formData.stock}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Sizes Tag input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 ml-1">Sizes (e.g. S, M, L)</label>
            <div className="flex gap-2">
              <GlassInput
                placeholder="Add Size"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="flex-1"
              />
              <GlassButton type="button" variant="secondary" onClick={addSize} className="px-4">Add</GlassButton>
            </div>
            {formData.sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pl-1 select-none">
                {formData.sizes.map((s) => (
                  <span key={s} className="bg-white/40 border border-white/40 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    {s} <button type="button" onClick={() => removeSize(s)} className="text-gray-400 hover:text-red-500 font-bold">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Colors Tag input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 ml-1">Colors (e.g. Camel, Black)</label>
            <div className="flex gap-2">
              <GlassInput
                placeholder="Add Color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="flex-1"
              />
              <GlassButton type="button" variant="secondary" onClick={addColor} className="px-4">Add</GlassButton>
            </div>
            {formData.colors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pl-1 select-none">
                {formData.colors.map((c) => (
                  <span key={c} className="bg-white/40 border border-white/40 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    {c} <button type="button" onClick={() => removeColor(c)} className="text-gray-400 hover:text-red-500 font-bold">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image Uploader & Preview list */}
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 ml-1">Product Images</label>
            <div className="flex items-center gap-4">
              <label className="glass-strong border-dashed border-2 border-gray-300 rounded-2xl w-32 h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 transition-colors select-none text-gray-400">
                <FiUploadCloud size={24} />
                <span className="text-[10px] font-bold mt-1.5">Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
              
              <div className="flex-1 flex gap-3 overflow-x-auto py-1 scrollbar-thin select-none">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 aspect-[3/4] rounded-xl overflow-hidden glass border flex-shrink-0">
                    <img src={img} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold hover:scale-110 transition-transform focus:outline-none"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {errors.images && <span className="text-red-500 text-xs mt-1 ml-2 font-medium">{errors.images}</span>}
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-600 font-semibold cursor-pointer py-2 pl-1 select-none">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-lavender-500 focus:ring-lavender-400 w-4 h-4"
            />
            Mark as featured product
          </label>

          <GlassButton type="submit" loading={isSaving} className="mt-2 self-end">
            Save Product Details
          </GlassButton>
        </form>
      </GlassModal>
    </div>
  );
}
