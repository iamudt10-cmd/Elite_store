'use client';

import Link from 'next/link';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

export default function NotFound() {
  return (
    <div className="w-full max-w-md mx-auto py-20 text-center select-none">
      <GlassCard className="p-8 flex flex-col items-center gap-6" hover={false}>
        <div className="text-6xl font-extrabold bg-gradient-to-r from-lavender-500 to-blush-500 bg-clip-text text-transparent tracking-tight">
          404
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Page Not Found</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            The page you are looking for does not exist, has been removed or is temporarily unavailable.
          </p>
        </div>
        <Link href="/" className="w-full">
          <GlassButton className="w-full text-sm">Return Home</GlassButton>
        </Link>
      </GlassCard>
    </div>
  );
}
