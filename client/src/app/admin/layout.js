'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { FiGrid, FiBox, FiShoppingBag, FiSettings, FiArrowLeft, FiTruck, FiLayers, FiUsers, FiTag, FiStar } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login?redirect=' + encodeURIComponent(pathname));
      } else if (user?.role !== 'ADMIN') {
        router.replace('/');
      }
    }
  }, [user, isAuthenticated, isLoading, pathname]);

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-500 font-semibold gap-2">
        <span className="animate-spin w-6 h-6 border-2 border-lavender-500 border-t-transparent rounded-full" />
        Verifying administrator session...
      </div>
    );
  }

  const adminLinks = [
    { label: 'Overview Dashboard', href: '/admin', icon: FiGrid },
    { label: 'Manage Products', href: '/admin/products', icon: FiBox },
    { label: 'Manage Categories', href: '/admin/categories', icon: FiLayers },
    { label: 'Manage Orders', href: '/admin/orders', icon: FiShoppingBag },
    { label: 'Manage Deliveries', href: '/admin/delivery', icon: FiTruck },
    { label: 'Manage Customers', href: '/admin/customers', icon: FiUsers },
    { label: 'Manage Promo Codes', href: '/admin/coupons', icon: FiTag },
    { label: 'Moderation Reviews', href: '/admin/reviews', icon: FiStar },
    { label: 'Site Customizations', href: '/admin/settings', icon: FiSettings },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 py-6 items-start">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <GlassCard className="p-3 flex flex-col gap-1 text-left" hover={false}>
          <div className="px-4 py-3 border-b border-white/20 mb-2">
            <h3 className="font-bold text-gray-800 text-base">Elite Control</h3>
            <p className="text-xs text-gray-400 mt-0.5">Admin Management Console</p>
          </div>

          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 font-semibold text-sm">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-lavender-500/10 to-blush-400/10 border border-lavender-200/50 text-lavender-600 font-bold'
                      : 'hover:bg-white/40 text-gray-600 border border-transparent'
                  }`}
                >
                  <Icon size={16} /> {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-3 border-t border-white/10 hidden lg:block">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiArrowLeft size={14} /> Back to Main Website
            </Link>
          </div>
        </GlassCard>
      </aside>

      {/* Main Admin View */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}
