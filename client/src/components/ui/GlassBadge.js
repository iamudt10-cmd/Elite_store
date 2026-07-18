'use client';

export default function GlassBadge({ variant = 'default', children, className = '' }) {
  const styles = {
    default: 'bg-white/40 text-gray-700 border-white/40',
    success: 'bg-mint-100/40 text-mint-500 border-mint-200/40',
    warning: 'bg-amber-100/40 text-amber-600 border-amber-200/40',
    info: 'bg-baby-100/40 text-baby-500 border-baby-200/40',
    danger: 'bg-red-100/40 text-red-500 border-red-200/40',
  };

  return (
    <span
      className={`backdrop-blur-sm border px-3 py-1 rounded-full text-xs font-semibold select-none ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
