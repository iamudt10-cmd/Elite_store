'use client';

import { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import StarRating from '../ui/StarRating';
import toast from 'react-hot-toast';

export default function ReviewForm({ productId, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) {
      toast.error('Please enter a title and comment for your review');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({ productId, rating, title, comment });
      if (res.success) {
        setTitle('');
        setComment('');
        setRating(5);
      }
    } catch (err) {
      console.error('Review submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6 text-left" hover={false}>
      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b border-white/20 pb-2">
        Write a Review
      </h4>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Rating selection */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-600">Your Rating:</span>
          <StarRating rating={rating} setRating={setRating} size="md" />
        </div>

        {/* Title */}
        <GlassInput
          label="Review Title"
          placeholder="e.g. Uncompromising Quality / Fits perfectly!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Comment */}
        <div className="flex flex-col text-left">
          <label className="text-xs md:text-sm font-semibold text-gray-600 mb-1 ml-1">
            Review Description
          </label>
          <textarea
            placeholder="Share your detailed experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={4}
            className="glass w-full bg-white/30 rounded-2xl py-3 px-4 text-gray-700 placeholder-gray-400 text-sm border-white/30 focus:outline-none focus:ring-2 focus:ring-lavender-300/60 focus:bg-white/40"
          />
        </div>

        {/* Submit */}
        <GlassButton type="submit" loading={isSubmitting} className="self-start mt-2">
          Submit Review
        </GlassButton>
      </form>
    </GlassCard>
  );
}
