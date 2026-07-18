'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import GlassCard from '../../../components/ui/GlassCard';
import GlassInput from '../../../components/ui/GlassInput';
import GlassButton from '../../../components/ui/GlassButton';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.success) {
        setSubmitted(true);
        toast.success('Reset link dispatched successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 text-left">
      <GlassCard className="p-8 flex flex-col gap-6" hover={false}>
        {submitted ? (
          <div className="text-center flex flex-col gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-mint-100/40 border border-mint-200 text-mint-500 flex items-center justify-center mx-auto">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Check Your Email</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                We have dispatched a password reset link to <strong>{email}</strong>. The link will remain active for 1 hour.
              </p>
            </div>
            <Link href="/auth/login" className="mt-4">
              <GlassButton variant="secondary" className="w-full text-xs">
                Back to Sign In
              </GlassButton>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">Forgot Password</h2>
              <p className="text-xs text-gray-400 mt-1">
                Enter your email address below, and we will send you a password reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <GlassInput
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                icon={FiMail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <GlassButton type="submit" loading={isLoading} className="w-full mt-2">
                Send Reset Link
              </GlassButton>
            </form>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5 justify-center"
              >
                <FiArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
