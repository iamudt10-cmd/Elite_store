'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import GlassCard from '../ui/GlassCard';
import PriceTag from '../ui/PriceTag';
import StarRating from '../ui/StarRating';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Check wishlist status
  useEffect(() => {
    if (!isAuthenticated) {
      setIsWishlisted(false);
      return;
    }
    const checkWishlist = async () => {
      try {
        const { data } = await api.get('/users/wishlist');
        if (data.success) {
          const inWishlist = data.wishlist.some((item) => item.id === product.id);
          setIsWishlisted(inWishlist);
        }
      } catch (err) {
        console.error('Check wishlist error:', err);
      }
    };
    checkWishlist();
  }, [isAuthenticated, product.id]);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to manage your wishlist');
      router.push(`/auth/login?redirect=/products`);
      return;
    }

    try {
      if (isWishlisted) {
        await api.delete(`/users/wishlist/${product.id}`);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/users/wishlist/${product.id}`);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) {
      toast.error('Product is currently out of stock');
      return;
    }

    setIsAdding(true);
    const size = product.sizes?.[0] || null;
    const color = product.colors?.[0] || null;

    const res = await addToCart(product.id, 1, size, color, product, token);
    setIsAdding(false);

    if (res.success) {
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <GlassCard className="relative overflow-hidden p-4 h-full flex flex-col" hover={true}>
        {/* Category Label badge */}
        {product.category && (
          <span className="absolute top-6 left-6 z-10 glass bg-white/60 text-gray-700 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border-white/40">
            {product.category.name}
          </span>
        )}

        {/* Wishlist toggle */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-6 right-6 z-10 w-9 h-9 flex items-center justify-center rounded-full glass bg-white/60 border-white/40 text-gray-500 hover:text-red-500 hover:scale-110 active:scale-95 transition-all focus:outline-none"
        >
          {isWishlisted ? (
            <FaHeart className="text-red-500" size={16} />
          ) : (
            <FiHeart size={16} />
          )}
        </button>

        {/* Image Frame */}
        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 border border-white/20 mb-4">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=600'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-white/90 text-gray-800 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-gray-200">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Text descriptions */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 mb-1 group-hover:text-lavender-500 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={Math.round(product.rating)} size="sm" />
            <span className="text-[10px] text-gray-400 font-semibold">({product.reviewCount})</span>
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-white/20">
            <PriceTag price={product.price} comparePrice={product.comparePrice} className="text-sm" />

            <button
              onClick={handleAddToCart}
              disabled={isAdding || product.stock === 0}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-lavender-500 to-blush-400 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="Add to Cart"
            >
              <FiShoppingBag size={14} />
            </button>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
