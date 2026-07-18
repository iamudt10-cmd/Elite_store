'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '../../components/product/ProductGrid';
import GlassCard from '../../components/ui/GlassCard';
import api from '../../lib/api';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    const triggerSearch = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (data.success) setProducts(data.products);
      } catch (err) {
        console.error('Search results error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    triggerSearch();
  }, [query]);

  return (
    <div className="flex flex-col gap-6 py-6 text-left">
      <div className="border-b border-white/20 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Search Results</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-0.5">
          {query ? `Showing results for "${query}"` : 'Enter a search term to find products'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
        </div>
      ) : products.length === 0 ? (
        <GlassCard className="text-center py-20" hover={false}>
          <h3 className="text-lg font-bold text-gray-700">No Results Found</h3>
          <p className="text-sm text-gray-400 mt-1">We couldn&apos;t find any products matching your search term.</p>
        </GlassCard>
      ) : (
        <ProductGrid products={products} isLoading={false} />
      )}
    </div>
  );
}

export default function SearchResults() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-4 py-6">
        <div className="h-10 bg-white/20 animate-pulse rounded-2xl border border-white/10 w-1/3" />
        <div className="h-32 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
