'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { useUiStore } from '../../../store/uiStore';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import GlassCard from '../../../components/ui/GlassCard';
import GlassButton from '../../../components/ui/GlassButton';
import StarRating from '../../../components/ui/StarRating';
import PriceTag from '../../../components/ui/PriceTag';
import QuantityPicker from '../../../components/ui/QuantityPicker';
import ProductGallery from '../../../components/product/ProductGallery';
import ReviewCard from '../../../components/product/ReviewCard';
import ReviewForm from '../../../components/product/ReviewForm';
import ProductGrid from '../../../components/product/ProductGrid';
import useProduct from '../../../hooks/useProduct';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { siteSettings } = useUiStore();

  const { product, setProduct, isLoading, error } = useProduct(slug);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  const symbol = siteSettings.currency_symbol || '₹';

  // Initialize selected values once product data is fetched
  useEffect(() => {
    if (product) {
      if (product.sizes?.length > 0) setSelectedSize(product.sizes[0]);
      if (product.colors?.length > 0) setSelectedColor(product.colors[0]);

      // Check wishlist status
      if (isAuthenticated) {
        const checkWishlist = async () => {
          try {
            const { data } = await api.get('/users/wishlist');
            if (data.success) {
              setIsWishlisted(data.wishlist.some((item) => item.id === product.id));
            }
          } catch (err) {
            console.error('Check wishlist error:', err);
          }
        };
        checkWishlist();
      }

      // Fetch related products in the same category
      const fetchRelated = async () => {
        try {
          const { data } = await api.get(`/products?category=${product.category.slug}&limit=4`);
          if (data.success) {
            // Exclude current product
            setRelatedProducts(data.products.filter((p) => p.id !== product.id));
          }
        } catch (err) {
          console.error('Fetch related products error:', err);
        } finally {
          setIsLoadingRelated(false);
        }
      };
      fetchRelated();
    }
  }, [product, isAuthenticated]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to manage your wishlist');
      router.push(`/auth/login?redirect=/products/${slug}`);
      return;
    }

    setWishlistLoading(true);
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
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      toast.error('Out of stock');
      return;
    }

    setIsAdding(true);
    const res = await addToCart(
      product.id,
      quantity,
      selectedSize || null,
      selectedColor || null,
      product,
      token
    );
    setIsAdding(false);

    if (res.success) {
      toast.success(`${quantity} x ${product.name} added to cart!`);
    } else {
      toast.error(res.message);
    }
  };

  const handleReviewSubmit = async (reviewPayload) => {
    try {
      const { data } = await api.post('/reviews', reviewPayload);
      if (data.success) {
        toast.success('Review submitted successfully!');
        
        // Refresh product data locally in hook state
        setProduct((prev) => {
          const updatedReviews = [data.review, ...(prev.reviews || [])];
          const newCount = updatedReviews.length;
          const newAvg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / newCount;
          return {
            ...prev,
            reviews: updatedReviews,
            rating: newAvg,
            reviewCount: newCount,
          };
        });
        return { success: true };
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
      return { success: false };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 py-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] rounded-2xl bg-white/20 animate-pulse border border-white/10" />
          <div className="flex flex-col gap-4">
            <div className="h-8 bg-white/20 rounded-md animate-pulse w-3/4" />
            <div className="h-4 bg-white/20 rounded-md animate-pulse w-1/4" />
            <div className="h-16 bg-white/20 rounded-md animate-pulse w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <GlassCard className="text-center py-20 mt-6" hover={false}>
        <h2 className="text-xl font-bold text-gray-700">Product Not Found</h2>
        <p className="text-sm text-gray-400 mt-2">The product you are trying to view does not exist or has been removed.</p>
        <Link href="/products" className="inline-block mt-6">
          <GlassButton>Back to Shop</GlassButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-16 py-6 text-left">
      {/* Upper Panel details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <ProductGallery images={product.images} />

        {/* Info Column */}
        <div className="flex flex-col gap-6">
          {/* Name & Title */}
          <div>
            {product.category && (
              <span className="text-xs uppercase font-bold tracking-widest text-lavender-500 mb-1 block">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl md:text-3.5xl font-extrabold text-gray-800 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={Math.round(product.rating)} size="md" />
              <span className="text-xs text-gray-400 font-semibold">
                ({product.reviewCount} customer reviews)
              </span>
            </div>
          </div>

          <PriceTag price={product.price} comparePrice={product.comparePrice} className="text-2xl" />

          <p className="text-sm text-gray-500 leading-relaxed border-t border-white/20 pt-4">
            {product.description}
          </p>

          {/* Size selection */}
          {product.sizes?.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Size</span>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-10 h-10 px-3 rounded-xl border flex items-center justify-center font-bold text-xs transition-all focus:outline-none ${
                        isSelected
                          ? 'border-lavender-500 bg-lavender-100/30 text-lavender-600 ring-1 ring-lavender-400'
                          : 'border-white/30 glass bg-white/25 text-gray-600 hover:bg-white/45'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color swatches selection */}
          {product.colors?.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Color</span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-4 py-2 rounded-xl border font-semibold text-xs transition-all focus:outline-none ${
                        isSelected
                          ? 'border-lavender-500 bg-lavender-100/30 text-lavender-600 ring-1 ring-lavender-400'
                          : 'border-white/30 glass bg-white/25 text-gray-600 hover:bg-white/45'
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Checkout Trigger actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2 border-t border-white/20 pt-6">
            <QuantityPicker
              quantity={quantity}
              setQuantity={setQuantity}
              max={product.stock}
            />

            <div className="flex-1 flex gap-3">
              <GlassButton
                onClick={handleAddToCart}
                loading={isAdding}
                disabled={product.stock === 0}
                className="flex-1"
              >
                <FiShoppingBag size={16} /> Add to Cart
              </GlassButton>

              <GlassButton
                variant="secondary"
                onClick={handleWishlistToggle}
                loading={wishlistLoading}
                className="px-4"
              >
                {isWishlisted ? (
                  <FaHeart className="text-red-500" size={16} />
                ) : (
                  <FiHeart size={16} />
                )}
              </GlassButton>
            </div>
          </div>

          {/* Stock inventory metadata display */}
          <div className="text-xs font-medium mt-1">
            {product.stock > 0 ? (
              <span className="text-mint-500">In Stock ({product.stock} items available)</span>
            ) : (
              <span className="text-red-500 font-semibold">Out of Stock</span>
            )}
          </div>
        </div>
      </div>

      {/* Review list and Review submit form sections */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 border-b border-white/20 pb-2">
            Reviews ({product.reviewCount})
          </h3>
          
          {product.reviews?.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet for this product. Be the first to share your thoughts!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {product.reviews.map((rev) => (
                <ReviewCard key={rev.id} review={rev} />
              ))}
            </div>
          )}
        </div>

        {/* Review Form column */}
        <div>
          {isAuthenticated ? (
            // Form visible to authenticated users who haven't reviewed yet
            <ReviewForm productId={product.id} onSubmit={handleReviewSubmit} />
          ) : (
            <GlassCard className="p-6 text-center text-sm text-gray-500" hover={false}>
              <p>Please log in to submit a product review.</p>
              <Link href={`/auth/login?redirect=/products/${slug}`} className="inline-block mt-4">
                <GlassButton size="sm">Sign In</GlassButton>
              </Link>
            </GlassCard>
          )}
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="flex flex-col gap-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 border-b border-white/20 pb-2">
            You May Also Like
          </h3>
          <ProductGrid products={relatedProducts} isLoading={isLoadingRelated} />
        </section>
      )}
    </div>
  );
}
