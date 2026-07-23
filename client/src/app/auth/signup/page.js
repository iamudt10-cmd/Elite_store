'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassInput from '../../../components/ui/GlassInput';
import GlassButton from '../../../components/ui/GlassButton';
import toast from 'react-hot-toast';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    const res = await register(name, email, password);
    setIsLoading(false);
    if (res.success) {
      toast.success('Account created successfully!');
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        await useCartStore.getState().syncGuestCart(currentToken);
      }
      router.push(redirectUrl);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 text-left">
      <GlassCard className="p-8 flex flex-col gap-6" hover={false}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-xs text-gray-400 mt-1">Join the Elite Club and start shopping luxury style</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <GlassInput
            label="Full Name"
            type="text"
            id="name"
            placeholder="Jane Doe"
            icon={FiUser}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <GlassInput
            label="Email Address"
            type="email"
            id="email"
            placeholder="name@example.com"
            icon={FiMail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <GlassInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              icon={FiLock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <GlassInput
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            placeholder="••••••••"
            icon={FiLock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <GlassButton type="submit" loading={isLoading} className="w-full mt-2">
            Create Account
          </GlassButton>
        </form>

        <div className="text-center text-xs text-gray-500 mt-2">
          Already have an account?{' '}
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
            className="font-bold text-lavender-600 hover:text-lavender-500 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto py-12">
        <div className="h-96 bg-white/20 animate-pulse rounded-3xl border border-white/10" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
