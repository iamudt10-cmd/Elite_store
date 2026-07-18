'use client';

import { useState, useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiTrendingUp } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';
import GlassBadge from '../../components/ui/GlassBadge';
import api from '../../lib/api';

export default function AdminDashboard() {
  const { siteSettings } = useUiStore();
  
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const symbol = siteSettings.currency_symbol || '₹';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/analytics'),
        ]);

        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
        ))}
      </div>
    );
  }

  // Calculate highest sales day for proportional CSS charts
  const dailyMetrics = analytics?.dailyMetrics || [];
  const maxSales = dailyMetrics.reduce((max, day) => (day.sales > max ? day.sales : max), 1);

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-xl font-bold text-gray-800">Control Dashboard Overview</h2>
        <p className="text-xs text-gray-400 mt-0.5">Real-time statistics & business performance metrics</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <GlassCard className="p-5 flex items-center justify-between gap-4" hover={true}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Revenue</span>
            <span className="text-base md:text-xl font-bold text-gray-800 mt-1">
              {symbol}{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-mint-100/40 text-mint-600 flex items-center justify-center border border-mint-200/40">
            <FiDollarSign size={18} />
          </div>
        </GlassCard>

        {/* Orders */}
        <GlassCard className="p-5 flex items-center justify-between gap-4" hover={true}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Orders</span>
            <span className="text-base md:text-xl font-bold text-gray-800 mt-1">
              {stats?.totalOrders || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-lavender-100/40 text-lavender-600 flex items-center justify-center border border-lavender-200/40">
            <FiShoppingBag size={18} />
          </div>
        </GlassCard>

        {/* Products */}
        <GlassCard className="p-5 flex items-center justify-between gap-4" hover={true}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Products</span>
            <span className="text-base md:text-xl font-bold text-gray-800 mt-1">
              {stats?.totalProducts || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-baby-100/40 text-baby-600 flex items-center justify-center border border-baby-200/40">
            <FiBox size={18} />
          </div>
        </GlassCard>

        {/* Users */}
        <GlassCard className="p-5 flex items-center justify-between gap-4" hover={true}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Users</span>
            <span className="text-base md:text-xl font-bold text-gray-800 mt-1">
              {stats?.totalUsers || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blush-100/40 text-blush-600 flex items-center justify-center border border-blush-200/40">
            <FiUsers size={18} />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Daily chart */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col gap-4 h-96" hover={false}>
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <FiTrendingUp className="text-lavender-500" />
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Daily Sales Volume (Past 30 Days)</h4>
          </div>
          
          <div className="flex-1 flex items-end gap-1.5 md:gap-2.5 h-full pt-4">
            {dailyMetrics.length === 0 ? (
              <div className="w-full text-center py-20 text-gray-400 text-xs font-semibold">
                No transactions completed in the last 30 days.
              </div>
            ) : (
              dailyMetrics.map((day, idx) => {
                const heightPercent = Math.max((day.sales / maxSales) * 100, 3); // minimum 3% height for styling
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      {symbol}{Math.round(day.sales)}
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-lavender-400 to-blush-300 rounded-t-sm group-hover:from-lavender-500 group-hover:to-blush-400 transition-all shadow-glow"
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 border-t border-white/10 pt-2 font-semibold select-none">
            <span>30 Days Ago</span>
            <span>Today</span>
          </div>
        </GlassCard>

        {/* Orders status breakdown */}
        <GlassCard className="p-6 flex flex-col gap-4" hover={false}>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-white/10 pb-2.5">
            Order Status Distribution
          </h4>
          <div className="flex flex-col gap-3.5 pt-2">
            {Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-xs md:text-sm font-medium">
                <span className="text-gray-500">{status}</span>
                <span className="glass bg-white/40 border-white/30 text-gray-700 font-bold px-3 py-1 rounded-full text-xs">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top-Selling products */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col gap-4" hover={false}>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-white/10 pb-2.5">
            Best Selling Products
          </h4>
          <div className="flex flex-col gap-4 divide-y divide-white/10">
            {(analytics?.topProducts || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 pt-3 first:pt-0">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=100'}
                    alt={item.name}
                    className="w-9 aspect-[3/4] object-cover rounded-lg border border-white/20"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">{item.unitsSold} units sold</p>
                  </div>
                </div>
                <span className="font-bold text-sm text-lavender-600">
                  {symbol}{item.revenue.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            {analytics?.topProducts?.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">No records available.</div>
            )}
          </div>
        </GlassCard>

        {/* Recent Orders table summary */}
        <GlassCard className="p-6 flex flex-col gap-4" hover={false}>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-white/10 pb-2.5">
            Recent Activity
          </h4>
          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
            {(stats?.recentOrders || []).map((order) => (
              <div key={order.id} className="flex items-center justify-between text-xs md:text-sm font-medium">
                <div>
                  <p className="font-bold text-gray-800">{order.orderNumber}</p>
                  <p className="text-[10px] text-gray-400">{order.user?.name || 'Guest User'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lavender-600">{symbol}{order.total.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">{order.status}</span>
                </div>
              </div>
            ))}
            {stats?.recentOrders?.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">No activity yet.</div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
