'use client';

import { useState, useEffect } from 'react';
import { FiTrash2, FiStar, FiShoppingBag, FiSearch } from 'react-icons/fi';
import GlassCard from '@/components/ui/GlassCard';
import StarRating from '@/components/ui/StarRating';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/reviews');
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this review? This action will permanently remove it and recalculate the product rating.')) {
      return;
    }

    setDeletingId(id);
    try {
      const { data } = await api.delete(`/admin/reviews/${id}`);
      if (data.success) {
        toast.success('Review removed successfully');
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Delete review error:', err);
      toast.error('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const term = searchQuery.toLowerCase().trim();
    return (
      r.title.toLowerCase().includes(term) ||
      r.comment.toLowerCase().includes(term) ||
      r.user?.name.toLowerCase().includes(term) ||
      r.product?.name.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">Review Moderation</h2>
        <p className="text-xs text-gray-400 mt-0.5">Moderate product ratings and comments posted by customers</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="w-full md:max-w-md bg-white/30 border border-white/40 rounded-2xl px-4 py-2 flex items-center gap-2">
          <FiSearch className="text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by title, comment, user, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredReviews.length === 0 ? (
          <GlassCard className="p-8 text-center text-gray-400 font-semibold" hover={false}>
            No product reviews found.
          </GlassCard>
        ) : (
          filteredReviews.map((r) => (
            <GlassCard key={r.id} className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start" hover={false}>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-gray-700">{r.user?.name || 'Anonymous User'}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400">{r.user?.email}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex text-amber-400">
                    <StarRating rating={r.rating} size={15} />
                  </div>
                  <span className="text-sm font-extrabold text-gray-800">{r.title}</span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed italic">
                  &ldquo;{r.comment}&rdquo;
                </p>

                <div className="flex items-center gap-2 text-xs mt-1 text-lavender-600 font-semibold">
                  <FiShoppingBag size={13} />
                  <span>Product:</span>
                  <a
                    href={`/products/${r.product?.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {r.product?.name}
                  </a>
                </div>
              </div>

              <div className="self-end md:self-center">
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-red-500/10 border border-red-200 text-red-600 hover:bg-red-500/20 rounded-xl transition-all"
                >
                  {deletingId === r.id ? (
                    <span className="animate-spin w-3.5 h-3.5 border border-current border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <FiTrash2 size={14} /> Remove Review
                    </>
                  )}
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
