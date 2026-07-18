'use client';

import { useUiStore } from '../../store/uiStore';

export default function PriceTag({ price = 0, comparePrice, className = '' }) {
  const { siteSettings } = useUiStore();
  const symbol = siteSettings.currency_symbol || '₹';

  const formatPrice = (amount) => {
    return amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="text-gray-800 font-bold tracking-tight">
        {symbol}{formatPrice(price)}
      </span>
      {comparePrice && comparePrice > price && (
        <span className="text-gray-400 line-through text-xs md:text-sm font-medium">
          {symbol}{formatPrice(comparePrice)}
        </span>
      )}
    </div>
  );
}
