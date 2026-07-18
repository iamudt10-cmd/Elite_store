'use client';

import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, onClick, ...rest }) {
  return (
    <motion.div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      className={`glass rounded-glass p-6 text-left transition-shadow duration-300 ${
        onClick ? 'w-full focus:outline-none focus:ring-2 focus:ring-lavender-300/50 cursor-pointer' : ''
      } ${className}`}
      whileHover={hover ? { y: -5, boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.12)' } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
