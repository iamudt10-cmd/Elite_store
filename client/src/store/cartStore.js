import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Simple check for browser environment
const isBrowser = typeof window !== 'undefined';

export const useCartStore = create((set, get) => ({
  items: [],
  isLoading: false,
  promoCode: null,
  discountPercent: 0,
  shippingThreshold: 5000,
  shippingCostDefault: 150,

  // Calculate totals helper
  getTotals: () => {
    const { items, discountPercent, shippingThreshold, shippingCostDefault } = get();
    const subtotal = items.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    const discount = (subtotal * discountPercent) / 100;
    const shipping = subtotal >= shippingThreshold || subtotal === 0 ? 0 : shippingCostDefault;
    const total = subtotal - discount + shipping;

    return {
      subtotal,
      discount,
      shipping,
      total,
    };
  },

  fetchCart: async (token = null) => {
    if (!token) {
      // Load from local storage for guests
      if (isBrowser) {
        const local = localStorage.getItem('elite-style-cart');
        if (local) {
          try {
            set({ items: JSON.parse(local) });
          } catch (e) {
            set({ items: [] });
          }
        }
      }
      return;
    }

    set({ isLoading: true });
    try {
      const { data } = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        set({ items: data.cartItems, isLoading: false });
      }
    } catch (error) {
      console.error('Fetch cart error:', error);
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity, size, color, productInfo = null, token = null) => {
    const { items } = get();
    
    if (!token) {
      // Guest local storage update
      const existingIdx = items.findIndex(
        (item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color
      );

      let newItems = [...items];
      if (existingIdx > -1) {
        newItems[existingIdx].quantity += quantity;
      } else {
        newItems.push({
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId,
          quantity,
          size,
          color,
          product: productInfo, // Contains name, price, images, comparePrice, stock
        });
      }

      set({ items: newItems });
      if (isBrowser) {
        localStorage.setItem('elite-style-cart', JSON.stringify(newItems));
      }
      return { success: true };
    }

    // Authenticated API request
    try {
      const { data } = await axios.post(
        `${API_URL}/cart/add`,
        { productId, quantity, size, color },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        await get().fetchCart(token);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add item to cart',
      };
    }
  },

  updateQuantity: async (itemId, quantity, token = null) => {
    const { items } = get();
    
    if (!token) {
      if (quantity <= 0) {
        return get().removeItem(itemId, null);
      }
      
      const newItems = items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      set({ items: newItems });
      if (isBrowser) {
        localStorage.setItem('elite-style-cart', JSON.stringify(newItems));
      }
      return { success: true };
    }

    try {
      const { data } = await axios.put(
        `${API_URL}/cart/${itemId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        await get().fetchCart(token);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update quantity',
      };
    }
  },

  removeItem: async (itemId, token = null) => {
    const { items } = get();

    if (!token) {
      const newItems = items.filter((item) => item.id !== itemId);
      set({ items: newItems });
      if (isBrowser) {
        localStorage.setItem('elite-style-cart', JSON.stringify(newItems));
      }
      return { success: true };
    }

    try {
      const { data } = await axios.delete(`${API_URL}/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        await get().fetchCart(token);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove item',
      };
    }
  },

  clearCart: async (token = null) => {
    set({ items: [], promoCode: null, discountPercent: 0 });
    
    if (!token) {
      if (isBrowser) {
        localStorage.removeItem('elite-style-cart');
      }
      return;
    }

    try {
      await axios.delete(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Clear cart on DB error:', error);
    }
  },

  applyPromoCode: async (code, token) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/checkout/verify-promo`,
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        set({ promoCode: data.code, discountPercent: data.discountPercent });
        return { success: true, discountPercent: data.discountPercent };
      }
    } catch (error) {
      set({ promoCode: null, discountPercent: 0 });
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid or expired promo code',
      };
    }
  },

  syncGuestCart: async (token) => {
    if (!isBrowser) return;
    const local = localStorage.getItem('elite-style-cart');
    if (!local) return;

    try {
      const guestItems = JSON.parse(local);
      if (guestItems.length === 0) return;

      // Send requests sequentially to merge items to DB
      for (const item of guestItems) {
        await axios.post(
          `${API_URL}/cart/add`,
          {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Clear local storage cart once merged successfully
      localStorage.removeItem('elite-style-cart');
      await get().fetchCart(token);
    } catch (error) {
      console.error('Sync guest cart error:', error);
    }
  },
}));
