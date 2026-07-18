import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useUiStore = create((set, get) => ({
  mobileNavOpen: false,
  searchOpen: false,
  searchQuery: '',
  siteSettings: {
    site_name: 'Elite Style',
    site_tagline: 'Premium Fashion & Lifestyle',
    site_logo: '',
    hero_title: 'Elevate Your Everyday Style',
    hero_subtitle: 'Discover premium clothing, shoes, bags, and luxury accessories curated for the modern lifestyle.',
    hero_cta_text: 'Explore Collection',
    hero_image: '',
    footer_about: 'Elite Style is your premium boutique destination. We offer hand-picked apparel and accessories combining modern designs with lasting quality.',
    contact_email: 'support@elitestyle.com',
    contact_phone: '+91 98765 43210',
    meta_title: 'Elite Style | Premium E-Commerce Boutique',
    meta_description: 'Shop premium fashion, blazers, designer bags, shoes and accessories with free shipping.',
    free_shipping_threshold: '5000',
    currency: 'INR',
    currency_symbol: '₹',
    announcement_bar: 'Grand Opening! Apply code STYLE20 for 20% off!',
    show_announcement: 'true',
  },
  isLoadingSettings: false,

  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setMobileNavOpen: (isOpen) => set({ mobileNavOpen: isOpen }),
  
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (isOpen) => set({ searchOpen: isOpen }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSettings: async () => {
    set({ isLoadingSettings: true });
    try {
      const { data } = await axios.get(`${API_URL}/settings`);
      if (data.success) {
        set({
          siteSettings: {
            ...get().siteSettings,
            ...data.settings,
          },
          isLoadingSettings: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
      set({ isLoadingSettings: false });
    }
  },

  updateSettingInStore: (key, value) => {
    set((state) => ({
      siteSettings: {
        ...state.siteSettings,
        [key]: String(value),
      },
    }));
  },
}));
