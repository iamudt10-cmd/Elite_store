'use client';

import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import GlassCard from '../ui/GlassCard';

export default function ProductGrid({ products = [], isLoading = false }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <GlassCard key={index} className="overflow-hidden p-4 flex flex-col h-[380px]" hover={false}>
            {/* Pulsing skeletons */}
            <div className="w-full aspect-[3/4] rounded-xl bg-white/20 animate-pulse mb-4 border border-white/10" />
            <div className="h-4 bg-white/20 rounded-md animate-pulse w-3/4 mb-2 border border-white/10" />
            <div className="h-3 bg-white/20 rounded-md animate-pulse w-1/2 mb-4 border border-white/10" />
            <div className="mt-auto h-8 bg-white/20 rounded-full animate-pulse border border-white/10" />
          </GlassCard>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <GlassCard className="w-full text-center py-16" hover={false}>
        <h3 className="text-lg font-bold text-gray-700 mb-1">No Products Found</h3>
        <p className="text-sm text-gray-400">Try adjusting your filters or search terms to find what you are looking for.</p>
      </GlassCard>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
    >
      {products.map((prod) => (
        <motion.div key={prod.id} variants={item}>
          <ProductCard product={prod} />
        </motion.div>
      ))}
    </motion.div>
  );
}
