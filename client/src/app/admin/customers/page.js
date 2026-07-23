'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiUserCheck, FiUserX, FiShield } from 'react-icons/fi';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/users/admin/all');
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Fetch admin users error:', err);
      toast.error('Failed to load user accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlock = async (user) => {
    if (user.role === 'ADMIN') {
      toast.error('Administrators cannot be blocked.');
      return;
    }

    const actionText = user.isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${actionText} the customer: ${user.name}?`)) {
      return;
    }

    setTogglingId(user.id);
    try {
      const { data } = await api.put(`/users/admin/${user.id}/block`);
      if (data.success) {
        toast.success(`User successfully ${user.isBlocked ? 'unblocked' : 'blocked'}`);
        // Update local state state
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u))
        );
      }
    } catch (err) {
      console.error('Toggle block error:', err);
      toast.error(err.response?.data?.message || 'Failed to update user block status');
    } finally {
      setTogglingId(null);
    }
  };

  // Filter users list by search query
  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 bg-white/20 animate-pulse rounded-2xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">Manage Customers</h2>
        <p className="text-xs text-gray-400 mt-0.5">Audit user accounts and manage block list controls</p>
      </div>

      {/* Search Filter Header */}
      <div className="max-w-md">
        <GlassInput
          type="text"
          id="user-search"
          placeholder="Search by name, email, role..."
          icon={FiSearch}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/20 select-none">
                <th className="p-4">Customer Details</th>
                <th className="p-4">Role</th>
                <th className="p-4">Signup Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15 text-sm text-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 font-semibold">
                    No customers found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/40 shadow-sm"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                            {u.name}
                            {u.role === 'ADMIN' && (
                              <FiShield className="text-lavender-500" size={13} title="Administrator" />
                            )}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'ADMIN' 
                          ? 'bg-lavender-50 border border-lavender-100 text-lavender-600' 
                          : 'bg-white/40 border border-white/20 text-gray-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="p-4">
                      {u.isBlocked ? (
                        <span className="bg-red-50 border border-red-100 text-red-500 px-2 py-0.5 rounded-full text-xs font-bold">
                          Suspended
                        </span>
                      ) : (
                        <span className="bg-mint-50 border border-mint-100 text-mint-600 px-2 py-0.5 rounded-full text-xs font-bold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleBlock(u)}
                          disabled={togglingId === u.id}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ml-auto border transition-all ${
                            u.isBlocked
                              ? 'bg-mint-500/10 border-mint-200 text-mint-600 hover:bg-mint-500/20'
                              : 'bg-red-500/10 border-red-200 text-red-600 hover:bg-red-500/20'
                          }`}
                        >
                          {togglingId === u.id ? (
                            <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                          ) : u.isBlocked ? (
                            <>
                              <FiUserCheck size={14} /> Unblock
                            </>
                          ) : (
                            <>
                              <FiUserX size={14} /> Block Account
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
