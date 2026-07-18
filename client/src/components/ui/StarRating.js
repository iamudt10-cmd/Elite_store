'use client';

import { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

export default function StarRating({ rating = 0, setRating, size = 'sm', className = '' }) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const isInteractive = typeof setRating === 'function';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = isInteractive
          ? (hoverRating || rating) >= index
          : rating >= index;

        return (
          <button
            key={index}
            type="button"
            disabled={!isInteractive}
            onClick={() => isInteractive && setRating(index)}
            onMouseEnter={() => isInteractive && setHoverRating(index)}
            onMouseLeave={() => isInteractive && setHoverRating(0)}
            className={`transition-colors focus:outline-none ${
              isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${isFilled ? 'text-amber-500' : 'text-gray-300'}`}
          >
            {isFilled ? <FaStar size={starSizes[size]} /> : <FaRegStar size={starSizes[size]} />}
          </button>
        );
      })}
    </div>
  );
}
