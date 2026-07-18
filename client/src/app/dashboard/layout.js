'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { FiList, FiHeart, FiMapPin, FiUser } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [isAuthenticated, isLoading, pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-500 font-semibold gap-2">
        <span className="animate-spin w-6 h-6 border-2 border-lavender-500 border-t-transparent rounded-full" />
        Checking session status...
      </div>
    );
  }

  const menuLinks = [
    { label: 'Order History', href: '/dashboard/orders', icon: FiList },
    { label: 'My Wishlist', href: '/dashboard/wishlist', icon: FiHeart },
    { label: 'Manage Addresses', href: '/dashboard/addresses', icon: FiMapPin },
    { label: 'Profile Settings', href: '/dashboard/profile', icon: FiUser },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 py-6 items-start">
      {/* Sidebar navigation column */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <GlassCard className="p-3 flex flex-col gap-1 text-left" hover={false}>
          <div className="px-4 py-3 border-b border-white/20 mb-2">
            <h3 className="font-bold text-gray-800 text-base">Account Center</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage your details & orders</p>
          </div>

          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 font-semibold text-sm">
            {menuLinks.map((link) => {
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
        </GlassCard>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}
