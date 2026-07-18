'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export default function GlassModal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`glass-strong rounded-3xl w-full p-6 relative z-10 overflow-hidden shadow-2xl ${maxWidth}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/30 mb-4">
              {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/40 focus:outline-none"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
