'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { FiShoppingBag, FiSearch, FiUser, FiX, FiMenu, FiLogOut, FiHeart, FiSettings, FiGrid, FiList } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import useDebounce from '../../hooks/useDebounce';
import api from '../../lib/api';

export default function Header() {
  const router = useRouter();
  const { user, token, logout, isAuthenticated } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const {
    mobileNavOpen,
    toggleMobileNav,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    siteSettings,
    fetchSettings,
  } = useUiStore();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // Fetch initial configs
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch cart when authenticated changes
  useEffect(() => {
    fetchCart(token);
  }, [token]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Input Debounce
  useEffect(() => {
    const triggerSearch = async () => {
      if (!debouncedSearch || debouncedSearch.trim() === '') {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(debouncedSearch)}`);
        if (data.success) {
          setSearchResults(data.products);
        }
      } catch (err) {
        console.error('Live search error:', err);
      } finally {
        setIsSearching(false);
      }
    };
    triggerSearch();
  }, [debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleResultClick = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogoutClick = () => {
    setUserDropdownOpen(false);
    logout();
    router.push('/');
  };

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Read Site Customizations
  const showAnnounce = siteSettings.show_announcement === 'true';
  const announceText = siteSettings.announcement_bar;
  const siteName = siteSettings.site_name || 'Elite Style';

  return (
    <header className="w-full z-40 relative">
      {/* Announcement Bar */}
      {showAnnounce && announceText && (
        <div className="bg-gradient-to-r from-lavender-500 to-blush-400 text-white text-center py-2 px-4 text-xs font-semibold tracking-wide shadow-sm relative z-50">
          {announceText}
        </div>
      )}

      {/* Main Navbar */}
      <div className="w-full sticky top-0 glass-strong border-b border-white/30 px-4 md:px-8 py-4 flex items-center justify-between z-40">
        {/* Mobile Hamburger menu */}
        <button
          onClick={toggleMobileNav}
          className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none p-1 rounded-full hover:bg-white/40"
        >
          <FiMenu size={22} />
        </button>

        {/* Logo Branding */}
        <Link href="/" className="flex items-center gap-2">
          {siteSettings.site_logo ? (
            <img
              src={siteSettings.site_logo}
              alt={siteName}
              className="h-10 md:h-12 w-auto object-contain"
            />
          ) : (
            <img
              src="/logo.png"
              alt={siteName}
              className="h-10 md:h-12 w-auto object-contain"
            />
          )}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-600">
          <Link href="/products" className="hover:text-lavender-500 transition-colors">
            Shop All
          </Link>
          <Link href="/products?category=clothing" className="hover:text-lavender-500 transition-colors">
            Clothing
          </Link>
          <Link href="/products?category=shoes" className="hover:text-lavender-500 transition-colors">
            Shoes
          </Link>
          <Link href="/products?category=bags" className="hover:text-lavender-500 transition-colors">
            Bags
          </Link>
          <Link href="/products?category=accessories" className="hover:text-lavender-500 transition-colors">
            Accessories
          </Link>
        </nav>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 md:gap-4 relative">
          {/* Live Search Trigger button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-white/40 transition-colors"
          >
            {searchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
          </button>

          {/* Cart Bag Icon with dynamic counter badge */}
          <Link
            href="/cart"
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-white/40 transition-colors relative"
          >
            <FiShoppingBag size={20} />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blush-500 to-pink-500 text-white font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-white">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {/* User Account / Admin Panel Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-white/40 transition-colors"
            >
              {isAuthenticated && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover border border-lavender-200"
                />
              ) : (
                <FiUser size={20} />
              )}
            </button>

            {/* Dropdown Card */}
            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-56 glass-strong rounded-2xl shadow-xl border border-white/40 p-2 z-50 text-left"
                >
                  {isAuthenticated ? (
                    <>
                      {/* Authenticated user profile metadata summary */}
                      <div className="px-4 py-3 border-b border-gray-100 mb-1">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-700 truncate">{user?.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                      </div>

                      <Link
                        href="/dashboard/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 rounded-xl hover:bg-white/50 transition-colors"
                      >
                        <FiList size={16} /> My Orders
                      </Link>

                      <Link
                        href="/dashboard/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 rounded-xl hover:bg-white/50 transition-colors"
                      >
                        <FiHeart size={16} /> Wishlist
                      </Link>

                      <Link
                        href="/dashboard/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 rounded-xl hover:bg-white/50 transition-colors"
                      >
                        <FiSettings size={16} /> Profile Settings
                      </Link>

                      {user?.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-lavender-600 font-semibold rounded-xl bg-lavender-50/50 hover:bg-lavender-100/50 transition-colors mt-1"
                        >
                          <FiGrid size={16} /> Admin Portal
                        </Link>
                      )}

                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 rounded-xl hover:bg-red-50/50 transition-colors mt-1"
                      >
                        <FiLogOut size={16} /> Log Out
                      </button>
                    </>
                  ) : (
                    <div className="p-1">
                      <Link
                        href="/auth/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block text-center w-full bg-gradient-to-r from-lavender-500 to-blush-400 text-white rounded-xl py-2 text-sm font-semibold mb-2 transition-all hover:opacity-95"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block text-center w-full glass rounded-xl py-2 text-sm text-gray-700 font-semibold border-white/40 hover:bg-white/40 transition-colors"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Live Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 right-0 glass-strong border-b border-white/30 shadow-lg p-4 z-30"
          >
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search premium apparel, shoes, designer bags..."
                  className="w-full bg-white/30 border border-white/40 rounded-full py-3 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400/40 focus:bg-white/50"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search dropdown suggestions */}
            {searchResults.length > 0 && (
              <div className="max-w-3xl mx-auto mt-2 glass-strong rounded-2xl border border-white/40 shadow-xl overflow-hidden z-50 relative">
                <div className="p-2 border-b border-white/30 bg-white/10 text-xs font-semibold text-gray-400">
                  Products Found ({searchResults.length})
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-white/20">
                  {searchResults.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-4 p-3 hover:bg-white/40 transition-colors"
                    >
                      <img
                        src={prod.images[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=100'}
                        alt={prod.name}
                        className="w-10 h-10 object-cover rounded-lg border border-white/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{prod.name}</p>
                        <p className="text-xs text-gray-400 truncate">{prod.category.name}</p>
                      </div>
                      <p className="text-sm font-bold text-lavender-600">
                        {siteSettings.currency_symbol || '₹'}{prod.price.toLocaleString('en-IN')}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isSearching && (
              <div className="max-w-3xl mx-auto text-center mt-4 text-sm text-gray-400 flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-lavender-400 border-t-transparent rounded-full" />
                Searching collection...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
