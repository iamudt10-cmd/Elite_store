'use client';

import { motion } from 'framer-motion';

export default function GlassInput({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  ...rest
}) {
  return (
    <div className={`flex flex-col w-full text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs md:text-sm font-semibold text-gray-600 mb-1 ml-1">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-gray-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        
        <input
          id={id}
          className={`glass w-full bg-white/30 rounded-2xl py-3 px-4 text-gray-700 placeholder-gray-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-lavender-300/60 focus:bg-white/40 ${
            Icon ? 'pl-11' : ''
          } ${
            error ? 'border-red-400 focus:ring-red-200' : 'border-white/30'
          }`}
          {...rest}
        />
      </div>

      {error && (
        <span className="text-red-500 text-xs mt-1 ml-2 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
