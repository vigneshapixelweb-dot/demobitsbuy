import { create } from 'zustand';

import { loginApi, type LoginPayload } from '@/services/auth/auth-api';
import { clearAuthToken, loadAuthToken, saveAuthToken } from '@/services/auth/auth-storage';

type AuthState = {
  isLoading: boolean;
  isHydrating: boolean;
  error: string | null;
  token: string | null;
  user: unknown | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  hydrate: () => Promise<void>;
  clearError: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  isHydrating: true,
  error: null,
  token: null,
  user: null,
  clearError: () => set({ error: null }),
  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginApi(payload);
      if (!result.success) {
        set({ isLoading: false, error: result.message ?? 'Login failed.' });
        return false;
      }

      await saveAuthToken(result.token ?? null);
      set({
        isLoading: false,
        token: result.token ?? null,
        user: result.user ?? null,
        error: null,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      set({ isLoading: false, error: message });
      return false;
    }
  },
  hydrate: async () => {
    const token = await loadAuthToken();
    set({ token, isHydrating: false });
  },
  logout: () => {
    clearAuthToken();
    set({ token: null, user: null });
  },
}));
