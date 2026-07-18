'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductGallery({ images = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const galleryImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=800'];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Large Display */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden glass border border-white/30 bg-gray-50 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={galleryImages[activeIdx]}
            alt="Product Gallery Display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Thumbnails strip */}
      {galleryImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`w-20 aspect-[3/4] rounded-xl overflow-hidden glass border transition-all flex-shrink-0 focus:outline-none ${
                activeIdx === idx
                  ? 'ring-2 ring-lavender-400 border-lavender-300'
                  : 'border-white/30 hover:opacity-80'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
