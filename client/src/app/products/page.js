'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSliders, FiX } from 'react-icons/fi';
import { useUiStore } from '../../store/uiStore';
import GlassCard from '../../components/ui/GlassCard';
import GlassSelect from '../../components/ui/GlassSelect';
import GlassButton from '../../components/ui/GlassButton';
import ProductGrid from '../../components/product/ProductGrid';
import ProductFilters from '../../components/product/ProductFilters';
import useProducts from '../../hooks/useProducts';

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get('category') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const ratingParam = searchParams.get('rating') || '';
  const sortParam = searchParams.get('sort') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [filters, setFilters] = useState({
    category: categoryParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    rating: ratingParam,
    sort: sortParam,
    page: pageParam,
    limit: 12,
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { siteSettings } = useUiStore();
  const symbol = siteSettings.currency_symbol || '₹';

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      rating: searchParams.get('rating') || '',
      sort: searchParams.get('sort') || '',
      page: parseInt(searchParams.get('page') || '1', 10),
    }));
  }, [searchParams]);

  const { products, total, pages, isLoading } = useProducts(filters);

  const updateUrl = (updatedFilters) => {
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    router.push(`/products?${params.toString()}`);
  };

  const handleFilterChange = (updater) => {
    const nextFilters = typeof updater === 'function' ? updater(filters) : updater;
    setFilters(nextFilters);
    updateUrl(nextFilters);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    handleFilterChange((prev) => ({ ...prev, sort: newSort, page: 1 }));
  };

  const handlePageChange = (p) => {
    if (p < 1 || p > pages) return;
    handleFilterChange((prev) => ({ ...prev, page: p }));
  };

  const sortOptions = [
    { label: 'Newest Arrivals', value: '' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
    { label: 'Top Rated', value: 'rating' },
  ];

  return (
    <div className="flex flex-col gap-6 py-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Browse Collection</h1>
          <p className="text-xs md:text-sm text-gray-400 mt-0.5">Found {total} premium items</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 glass px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-600 border-white/40"
          >
            <FiSliders size={16} /> Filters
          </button>

          <div className="w-48">
            <GlassSelect
              options={sortOptions}
              value={filters.sort}
              onChange={handleSortChange}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-8 relative items-start">
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
          <ProductFilters filters={filters} setFilters={handleFilterChange} />
        </aside>

        <div className="flex-1 flex flex-col gap-8">
          <ProductGrid products={products} isLoading={isLoading} />

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 select-none">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
              >
                Prev
              </GlassButton>

              {[...Array(pages)].map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = filters.page === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-glow'
                        : 'glass bg-white/30 text-gray-600 border-white/30 hover:bg-white/50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pages}
              >
                Next
              </GlassButton>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div onClick={() => setMobileFiltersOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative w-80 max-w-[85vw] h-full glass-strong shadow-2xl p-6 overflow-y-auto text-left flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <h3 className="font-bold text-gray-800">Filter Selection</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-white/40"
              >
                <FiX size={18} />
              </button>
            </div>
            <ProductFilters
              filters={filters}
              setFilters={(updated) => {
                handleFilterChange(updated);
                setMobileFiltersOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 py-6">
        <div className="h-12 bg-white/20 animate-pulse rounded-2xl border border-white/10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-white/20 animate-pulse rounded-2xl border border-white/10" />
          ))}
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
