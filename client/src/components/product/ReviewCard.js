'use client';

import GlassCard from '../ui/GlassCard';
import StarRating from '../ui/StarRating';

export default function ReviewCard({ review }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <GlassCard className="p-5 flex flex-col gap-3 text-left" hover={false}>
      <div className="flex items-center justify-between gap-4">
        {/* User profile info */}
        <div className="flex items-center gap-3">
          <img
            src={review.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={review.user?.name}
            className="w-10 h-10 rounded-full object-cover border border-white/40"
          />
          <div>
            <p className="font-semibold text-sm text-gray-700">{review.user?.name}</p>
            <p className="text-[10px] text-gray-400 font-medium">{formattedDate}</p>
          </div>
        </div>

        {/* Rating stars */}
        <StarRating rating={review.rating} size="sm" />
      </div>

      <div>
        <h5 className="text-sm font-bold text-gray-800 mb-1">{review.title}</h5>
        <p className="text-sm text-gray-500 leading-relaxed">{review.comment}</p>
      </div>
    </GlassCard>
  );
}
