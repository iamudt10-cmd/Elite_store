'use client';

import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import GlassCard from '../../../components/ui/GlassCard';
import GlassInput from '../../../components/ui/GlassInput';
import GlassButton from '../../../components/ui/GlassButton';
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const { user, updateProfile } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }

    if (password && password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdating(true);
    const payload = { name, email };
    if (password) payload.password = password;

    const res = await updateProfile(payload);
    setIsUpdating(false);

    if (res.success) {
      toast.success('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full max-w-xl">
      <div className="border-b border-white/20 pb-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">Profile Settings</h2>
        <p className="text-xs text-gray-400 mt-0.5">Manage your personal information and security details</p>
      </div>

      <GlassCard className="p-6" hover={false}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <GlassInput
            label="Full Name"
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <GlassInput
            label="Email Address"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="h-[1px] bg-white/20 my-2" />
          <h3 className="font-bold text-gray-700 text-sm">Change Password</h3>

          <GlassInput
            label="New Password (optional)"
            type="password"
            id="password"
            placeholder="Leave blank to keep current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <GlassInput
            label="Confirm New Password"
            type="password"
            id="confirmPassword"
            placeholder="Leave blank to keep current password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <GlassButton type="submit" loading={isUpdating} className="self-end mt-4">
            Save Changes
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
