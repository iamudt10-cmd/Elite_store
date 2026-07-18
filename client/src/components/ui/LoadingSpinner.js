'use client';

export default function LoadingSpinner({ size = 'md', color = 'lavender', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colors = {
    lavender: 'border-lavender-500 border-t-transparent',
    blush: 'border-blush-500 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizes[size]} ${colors[color]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
