import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Create basic API URL fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/login`,
            { email, password },
            { withCredentials: true }
          );
          if (data.success) {
            set({
              user: data.user,
              token: data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed. Please check your credentials.',
          };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/register`,
            { name, email, password },
            { withCredentials: true }
          );
          if (data.success) {
            set({
              user: data.user,
              token: data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Registration failed. Please try again.',
          };
        }
      },

      logout: async () => {
        const token = get().token;
        try {
          await axios.post(
            `${API_URL}/auth/logout`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          );
        } catch (error) {
          console.error('Logout error on backend:', error);
        } finally {
          // Local clear regardless of API success
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          // Clear refresh token cookies implicitly
          document.cookie = 'refreshToken=; Max-Age=0; path=/;';
        }
      },

      refreshToken: async () => {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          if (data.success) {
            set({
              token: data.accessToken,
              isAuthenticated: true,
            });
            return data.accessToken;
          }
        } catch (error) {
          // Revoke local credentials if refresh fails (expired session)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return null;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true });
        const token = get().token;
        try {
          const { data } = await axios.put(
            `${API_URL}/users/profile`,
            profileData,
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          );
          if (data.success) {
            set({
              user: data.user,
              isLoading: false,
            });
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to update profile.',
          };
        }
      },
    }),
    {
      name: 'elite-style-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // store user metadata, token remains in memory
    }
  )
);
