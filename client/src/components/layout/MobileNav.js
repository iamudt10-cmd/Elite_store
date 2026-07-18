'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { FiX, FiLogOut, FiHeart, FiSettings, FiGrid, FiList } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

export default function MobileNav() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen, siteSettings } = useUiStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Close nav on route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setMobileNavOpen(false);
  };

  const navLinks = [
    { label: 'Shop All', href: '/products' },
    { label: 'Clothing', href: '/products?category=clothing' },
    { label: 'Shoes', href: '/products?category=shoes' },
    { label: 'Bags', href: '/products?category=bags' },
    { label: 'Accessories', href: '/products?category=accessories' },
  ];

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Nav Panel Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-80 max-w-[85vw] h-full glass-strong shadow-2xl border-r border-white/30 flex flex-col p-6 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/20">
              <span className="font-display font-bold text-xl bg-gradient-to-r from-lavender-500 to-blush-500 bg-clip-text text-transparent">
                {siteSettings.site_name || 'Elite Style'}
              </span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-white/40"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Menu Links */}
            <nav className="flex flex-col gap-6 font-semibold text-lg text-gray-700 mb-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-lavender-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Footer Profile actions */}
            <div className="border-t border-white/20 pt-6 mt-6">
              {isAuthenticated ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={user?.name}
                      className="w-10 h-10 rounded-full object-cover border border-lavender-200"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-700">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link
                      href="/dashboard/orders"
                      className="flex items-center justify-center gap-2 py-2.5 px-3 glass text-xs font-semibold text-gray-600 rounded-xl hover:bg-white/50"
                    >
                      <FiList size={13} /> Orders
                    </Link>
                    <Link
                      href="/dashboard/wishlist"
                      className="flex items-center justify-center gap-2 py-2.5 px-3 glass text-xs font-semibold text-gray-600 rounded-xl hover:bg-white/50"
                    >
                      <FiHeart size={13} /> Wishlist
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center justify-center gap-2 py-2.5 px-3 glass text-xs font-semibold text-gray-600 rounded-xl hover:bg-white/50"
                    >
                      <FiSettings size={13} /> Profile
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-lavender-50/50 border border-lavender-200/50 text-xs font-bold text-lavender-600 rounded-xl hover:bg-lavender-100/50"
                      >
                        <FiGrid size={13} /> Admin
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50/50 border border-red-200/50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100/50 transition-colors mt-2"
                  >
                    <FiLogOut size={14} /> Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/login"
                    className="block text-center w-full bg-gradient-to-r from-lavender-500 to-blush-400 text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-95"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block text-center w-full glass border-white/40 rounded-xl py-2.5 text-sm text-gray-700 font-semibold hover:bg-white/40"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
