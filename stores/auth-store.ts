import { create } from 'zustand';

import {
  loginApi,
  type LoginPayload,
  verifyLogin2FA,
} from '@/services/auth/auth-api';
import { clearAuthToken, loadAuthToken, saveAuthToken } from '@/services/auth/auth-storage';

type AuthState = {
  isLoading: boolean;
  isHydrating: boolean;
  error: string | null;
  token: string | null;
  user: unknown | null;
  requires2FA: boolean;
  pendingTwoFAMethod: 'google' | 'email' | null;
  pendingUsernameEmail: string | null;
  pendingToken: string | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  verify2FA: (code: string) => Promise<boolean>;
  clearTwoFA: () => void;
  hydrate: () => Promise<void>;
  clearError: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: false,
  isHydrating: true,
  error: null,
  token: null,
  user: null,
  requires2FA: false,
  pendingTwoFAMethod: null,
  pendingUsernameEmail: null,
  pendingToken: null,
  clearError: () => set({ error: null }),
  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginApi(payload);
      if (result.requires2FA) {
        set({
          isLoading: false,
          requires2FA: true,
          pendingTwoFAMethod: result.twoFAMethod ?? 'google',
          pendingUsernameEmail: payload.usernameEmail,
          pendingToken: result.token ?? null,
          error: null,
        });
        return false;
      }
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
        requires2FA: false,
        pendingTwoFAMethod: null,
        pendingUsernameEmail: null,
        pendingToken: null,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      set({ isLoading: false, error: message });
      return false;
    }
  },
  verify2FA: async (code) => {
    set({ isLoading: true, error: null });
    const { pendingToken, pendingTwoFAMethod, pendingUsernameEmail } = get();
    try {
      if (pendingTwoFAMethod === 'email' && !pendingUsernameEmail) {
        set({ isLoading: false, error: "Missing username/email for verification." });
        return false;
      }
      const result = await verifyLogin2FA({
        otp: code,
        token: pendingToken,
        method: pendingTwoFAMethod ?? 'google',
        usernameEmail: pendingUsernameEmail ?? undefined,
      });
      if (!result.success) {
        set({ isLoading: false, error: result.message ?? "Verification failed." });
        return false;
      }
      const finalToken = result.token ?? pendingToken ?? null;
      await saveAuthToken(finalToken);
      set({
        isLoading: false,
        token: finalToken,
        user: result.user ?? null,
        error: null,
        requires2FA: false,
        pendingTwoFAMethod: null,
        pendingUsernameEmail: null,
        pendingToken: null,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed.";
      set({ isLoading: false, error: message });
      return false;
    }
  },
  clearTwoFA: () =>
    set({
      requires2FA: false,
      pendingTwoFAMethod: null,
      pendingUsernameEmail: null,
      pendingToken: null,
    }),
  hydrate: async () => {
    const token = await loadAuthToken();
    set({ token, isHydrating: false });
  },
  logout: () => {
    clearAuthToken();
    set({ token: null, user: null });
  },
}));
