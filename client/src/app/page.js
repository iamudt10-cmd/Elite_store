'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { FiChevronRight, FiMail, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import ProductGrid from '../components/product/ProductGrid';
import api from '../lib/api';

export default function Home() {
  const router = useRouter();
  const { siteSettings, fetchSettings } = useUiStore();
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  useEffect(() => {
    fetchSettings();

    const fetchCategoriesData = async () => {
      try {
        const { data } = await api.get('/categories');
        if (data.success) {
          setCategories(data.categories.slice(0, 4));
        }
      } catch (err) {
        console.error('Fetch categories homepage error:', err);
      } finally {
        setIsLoadingCats(false);
      }
    };

    const fetchTrendingData = async () => {
      try {
        const { data } = await api.get('/products?featured=true&limit=8');
        if (data.success) {
          setTrendingProducts(data.products);
        }
      } catch (err) {
        console.error('Fetch trending products homepage error:', err);
      } finally {
        setIsLoadingTrending(false);
      }
    };

    fetchCategoriesData();
    fetchTrendingData();
  }, []);

  // Framer Motion specs
  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const stagger = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const heroTitle = siteSettings.hero_title || 'Elevate Your Everyday Style';
  const heroSubtitle = siteSettings.hero_subtitle || 'Discover premium clothing and luxury accessories curated for you.';
  const heroCtaText = siteSettings.hero_cta_text || 'Explore Collection';
  const heroImage = siteSettings.hero_image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200';

  return (
    <div className="flex flex-col gap-20 py-6">
      {/* Hero Section Banner */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideUp}
        className="relative w-full rounded-4xl overflow-hidden glass border border-white/30 aspect-[16/9] md:aspect-[21/9] flex items-center p-8 md:p-16 text-left"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Elite Style Banner"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent" />
        </div>

        <div className="relative z-10 max-w-lg flex flex-col gap-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-800 leading-tight">
            {heroTitle}
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="mt-2">
            <Link href="/products">
              <GlassButton className="flex items-center gap-2 font-bold px-6 py-3.5 shadow-lg">
                {heroCtaText} <FiArrowRight size={16} />
              </GlassButton>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Featured Categories list section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/20 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Featured Collections</h2>
        </div>

        {isLoadingCats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-white/20 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {categories.map((cat) => (
              <motion.div variants={slideUp} key={cat.id}>
                <Link href={`/products?category=${cat.slug}`}>
                  <div className="relative rounded-2xl overflow-hidden glass border border-white/30 aspect-[4/3] group cursor-pointer">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=400'}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/25 flex flex-col justify-end p-4 text-left">
                      <h4 className="text-sm md:text-base font-bold text-white mb-0.5">{cat.name}</h4>
                      <p className="text-[10px] md:text-xs text-white/80 font-medium">
                        {cat._count?.products || 0} items
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Trending Products grid section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/20 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Trending Now</h2>
          <Link href="/products" className="text-xs md:text-sm font-semibold text-lavender-600 hover:text-lavender-500 flex items-center gap-1.5">
            View All <FiChevronRight size={16} />
          </Link>
        </div>

        <ProductGrid products={trendingProducts} isLoading={isLoadingTrending} />
      </section>

      {/* Newsletter signup container section */}
      <section className="w-full">
        <GlassCard className="p-8 md:p-12 text-center flex flex-col items-center max-w-4xl mx-auto gap-4 relative overflow-hidden" hover={false}>
          <div className="absolute top-[-50px] right-[-50px] w-24 h-24 bg-blush-200/20 filter blur-xl rounded-full" />
          <div className="absolute bottom-[-50px] left-[-50px] w-24 h-24 bg-lavender-200/20 filter blur-xl rounded-full" />

          <h2 className="text-xl md:text-3xl font-extrabold text-gray-800">Join the Elite Club</h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-md leading-relaxed">
            Subscribe to receive premium weekly updates on hot style trends, seasonal sales drop warnings and VIP member promo codes.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Successfully subscribed to newsletter!');
            }}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2"
          >
            <div className="relative flex-1 text-left">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="w-full glass bg-white/30 border border-white/40 rounded-full py-3 pl-11 pr-4 text-xs md:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400/40"
              />
            </div>
            <GlassButton type="submit" size="md">
              Subscribe
            </GlassButton>
          </form>
        </GlassCard>
      </section>
    </div>
  );
}
