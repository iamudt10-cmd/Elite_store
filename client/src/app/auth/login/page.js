'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassInput from '../../../components/ui/GlassInput';
import GlassButton from '../../../components/ui/GlassButton';
import toast from 'react-hot-toast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/';

  const { login, googleLogin } = useAuthStore();

  // Initialize Google Identity Services
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '204701911248-3meavgl3ge83tbe3njba00dpd3dgg4d5.apps.googleusercontent.com',
          callback: async (response) => {
            if (response.credential) {
              const res = await googleLogin(response.credential);
              if (res.success) {
                toast.success('Signed in with Google successfully!');
                const currentToken = useAuthStore.getState().token;
                if (currentToken) {
                  await useCartStore.getState().syncGuestCart(currentToken);
                }
                router.push(redirectUrl);
              } else {
                toast.error(res.message || 'Google sign-in failed');
              }
            }
          },
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '100%', 
            text: 'continue_with',
            shape: 'rectangular'
          }
        );
      } catch (err) {
        console.warn('Google Identity Services initialization failed:', err);
      }
    }
  }, [googleLogin, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('All fields are required');
      return;
    }
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (res.success) {
      toast.success('Logged in successfully!');
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
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-xs text-gray-400 mt-1">Please enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-lavender-600 hover:text-lavender-500 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <GlassButton type="submit" loading={isLoading} className="w-full mt-2">
            Sign In
          </GlassButton>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/20"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-wider select-none">Or continue with</span>
          <div className="flex-grow border-t border-white/20"></div>
        </div>

        <div id="google-signin-btn" className="w-full flex justify-center py-1"></div>

        <div className="text-center text-xs text-gray-500 mt-2">
          Don&apos;t have an account?{' '}
          <Link
            href={`/auth/signup?redirect=${encodeURIComponent(redirectUrl)}`}
            className="font-bold text-lavender-600 hover:text-lavender-500 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto py-12">
        <div className="h-80 bg-white/20 animate-pulse rounded-3xl border border-white/10" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
