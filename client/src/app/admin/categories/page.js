'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiLayers } from 'react-icons/fi';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassModal from '@/components/ui/GlassModal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim() || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=300',
      };

      if (editingId) {
        const { data } = await api.put(`/categories/${editingId}`, payload);
        if (data.success) {
          toast.success('Category updated successfully');
          setModalOpen(false);
          fetchCategories();
        }
      } else {
        const { data } = await api.post('/categories', payload);
        if (data.success) {
          toast.success('Category created successfully');
          setModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      console.error('Save category error:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? This might affect products associated with it.')) {
      return;
    }

    try {
      const { data } = await api.delete(`/categories/${id}`);
      if (data.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (err) {
      console.error('Delete category error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Manage Product Categories</h2>
          <p className="text-xs text-gray-400 mt-0.5">Organize items into browsable catalog departments</p>
        </div>
        <GlassButton onClick={handleOpenAdd} className="flex items-center gap-2 text-xs">
          <FiPlus size={16} /> Add Category
        </GlassButton>
      </div>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/20 select-none">
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Products Count</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15 text-sm text-gray-700">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 font-semibold">
                    No categories found. Click &quot;Add Category&quot; to create your first department.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/20 transition-colors">
                    <td className="p-4">
                      <img
                        src={cat.image || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=100'}
                        alt={cat.name}
                        className="w-10 h-10 object-cover rounded-lg border border-white/40 shadow-sm"
                      />
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{cat.name}</td>
                    <td className="p-4 text-xs font-mono text-gray-400">{cat.slug}</td>
                    <td className="p-4 text-xs text-gray-500 max-w-xs truncate">{cat.description || 'No description provided'}</td>
                    <td className="p-4 text-center">
                      <span className="bg-lavender-50 border border-lavender-100 text-lavender-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {cat._count?.products || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-white/50 rounded-xl transition-all"
                          title="Edit Category"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all"
                          title="Delete Category"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add/Edit Modal */}
      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left">
          <GlassInput
            label="Category Name"
            type="text"
            id="cat-name"
            placeholder="e.g. Designer Handbags"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat-desc" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              id="cat-desc"
              rows="3"
              placeholder="Provide a brief explanation of items cataloged in this department..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/30 border border-white/40 rounded-2xl p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400/40 focus:bg-white/50 resize-none transition-all"
            />
          </div>

          <GlassInput
            label="Cover Image Link"
            type="url"
            id="cat-img"
            placeholder="https://images.unsplash.com/photo-..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />

          <div className="flex gap-3 justify-end mt-4">
            <GlassButton
              type="button"
              onClick={() => setModalOpen(false)}
              className="bg-transparent border border-white/40 text-gray-600 hover:bg-white/30"
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" loading={isSaving}>
              {editingId ? 'Save Changes' : 'Create Category'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
