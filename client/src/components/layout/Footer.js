'use client';

import Link from 'next/link';
import { useUiStore } from '../../store/uiStore';
import { FaInstagram, FaFacebookF, FaTwitter, FaPinterestP } from 'react-icons/fa';
import GlassButton from '../ui/GlassButton';

export default function Footer() {
  const { siteSettings } = useUiStore();

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert('Thank you for subscribing to our newsletter!');
  };

  const currentYear = new Date().getFullYear();
  const siteName = siteSettings.site_name || 'Elite Style';
  const aboutText = siteSettings.footer_about || 'Elite Style is your premium boutique destination.';
  const email = siteSettings.contact_email || 'support@elitestyle.com';
  const phone = siteSettings.contact_phone || '+91 98765 43210';

  return (
    <footer className="w-full glass border-t border-white/30 mt-auto py-12 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* About Column */}
        <div className="flex flex-col gap-4 text-left">
          {siteSettings.site_logo ? (
            <img src={siteSettings.site_logo} alt={siteName} className="h-10 w-auto object-contain" />
          ) : (
            <img src="/logo.png" alt={siteName} className="h-10 w-auto object-contain" />
          )}
          <p className="text-sm text-gray-500 leading-relaxed">
            {aboutText}
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#" className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-600 hover:bg-lavender-400 hover:text-white transition-all">
              <FaFacebookF size={14} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-600 hover:bg-lavender-400 hover:text-white transition-all">
              <FaInstagram size={14} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-600 hover:bg-lavender-400 hover:text-white transition-all">
              <FaTwitter size={14} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-600 hover:bg-lavender-400 hover:text-white transition-all">
              <FaPinterestP size={14} />
            </a>
          </div>
        </div>

        {/* Shop Links Column */}
        <div className="flex flex-col gap-3 text-left">
          <h4 className="text-sm font-bold text-gray-700 tracking-wider uppercase mb-1">Collections</h4>
          <Link href="/products?category=clothing" className="text-sm text-gray-500 hover:text-lavender-500 transition-colors">Clothing</Link>
          <Link href="/products?category=shoes" className="text-sm text-gray-500 hover:text-lavender-500 transition-colors">Shoes</Link>
          <Link href="/products?category=bags" className="text-sm text-gray-500 hover:text-lavender-500 transition-colors">Bags</Link>
          <Link href="/products?category=accessories" className="text-sm text-gray-500 hover:text-lavender-500 transition-colors">Accessories</Link>
        </div>

        {/* Customer Service Column */}
        <div className="flex flex-col gap-3 text-left">
          <h4 className="text-sm font-bold text-gray-700 tracking-wider uppercase mb-1">Customer Care</h4>
          <span className="text-sm text-gray-500">Contact: {phone}</span>
          <span className="text-sm text-gray-500">Email: {email}</span>
          <span className="text-sm text-gray-500">Free shipping on orders over {siteSettings.currency_symbol || '₹'}{siteSettings.free_shipping_threshold}</span>
          <Link href="#" className="text-sm text-gray-500 hover:text-lavender-500 transition-colors">Privacy Policy</Link>
        </div>

        {/* Newsletter Column */}
        <div className="flex flex-col gap-3 text-left">
          <h4 className="text-sm font-bold text-gray-700 tracking-wider uppercase mb-1">Newsletter</h4>
          <p className="text-sm text-gray-500 mb-2">Subscribe to receive updates, access to exclusive deals, and more.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="glass bg-white/20 border border-white/40 rounded-full px-4 py-2.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400/40"
            />
            <GlassButton type="submit" size="sm" className="w-full text-xs">
              Subscribe
            </GlassButton>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
        <span>&copy; {currentYear} {siteName}. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-gray-600">Terms of Service</Link>
          <Link href="#" className="hover:text-gray-600">Privacy Policy</Link>
          <Link href="#" className="hover:text-gray-600">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
