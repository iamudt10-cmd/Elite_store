'use client';

import { useState, useEffect } from 'react';
import { FiHeart } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import ProductGrid from '../../../components/product/ProductGrid';
import api from '../../../lib/api';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await api.get('/users/wishlist');
        if (data.success) {
          setWishlist(data.wishlist);
        }
      } catch (err) {
        console.error('Fetch wishlist error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">Your Wishlist</h2>
        <p className="text-xs text-gray-400 mt-0.5">Premium styles you have bookmarked</p>
      </div>

      {wishlist.length === 0 ? (
        <GlassCard className="text-center py-16" hover={false}>
          <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center mx-auto text-gray-400 mb-4">
            <FiHeart size={20} />
          </div>
          <h3 className="text-base font-bold text-gray-700">Your Wishlist is Empty</h3>
          <p className="text-sm text-gray-400 mt-1">Start browsing products and click the heart icon to save items.</p>
        </GlassCard>
      ) : (
        <ProductGrid products={wishlist} isLoading={false} />
      )}
    </div>
  );
}
