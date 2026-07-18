'use client';

import { motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

export default function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...rest
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-glow hover:shadow-glow-pink focus:ring-lavender-300',
    secondary: 'glass bg-white/40 text-gray-700 hover:bg-white/60 focus:ring-lavender-200 border border-white/40',
    ghost: 'bg-transparent text-gray-600 hover:bg-white/20 focus:ring-lavender-200',
    danger: 'bg-gradient-to-r from-red-400 to-rose-500 text-white focus:ring-red-200',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      disabled={disabled || loading}
      className={`rounded-full font-medium tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <LoadingSpinner size="sm" color={variant === 'secondary' || variant === 'ghost' ? 'lavender' : 'white'} />}
      {children}
    </motion.button>
  );
}
