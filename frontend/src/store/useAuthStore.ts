import { create } from 'zustand';
import { User } from '@/types';
import { AuthService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  ageGateShown: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setAgeGateShown: (shown: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  ageGateShown: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  logout: async () => {
    try {
      await AuthService.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  loadUser: async () => {
    try {
      if (AuthService.isAuthenticated()) {
        const user = await AuthService.getProfile();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setAgeGateShown: (shown) => {
    set({ ageGateShown: shown });
    if (shown) {
      localStorage.setItem('ageGateShown', 'true');
    }
  },
}));
