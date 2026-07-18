'use client';

import { FiPlus, FiMinus } from 'react-icons/fi';

export default function QuantityPicker({ quantity, setQuantity, min = 1, max = 99, className = '' }) {
  const decrement = () => {
    if (quantity > min) setQuantity(quantity - 1);
  };

  const increment = () => {
    if (quantity < max) setQuantity(quantity + 1);
  };

  return (
    <div className={`glass inline-flex items-center rounded-full p-1 border-white/40 bg-white/30 ${className}`}>
      <button
        type="button"
        disabled={quantity <= min}
        onClick={decrement}
        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-white/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus:outline-none"
      >
        <FiMinus size={14} />
      </button>
      
      <span className="w-8 text-center text-sm font-semibold text-gray-700 select-none">
        {quantity}
      </span>
      
      <button
        type="button"
        disabled={quantity >= max}
        onClick={increment}
        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-white/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus:outline-none"
      >
        <FiPlus size={14} />
      </button>
    </div>
  );
}
