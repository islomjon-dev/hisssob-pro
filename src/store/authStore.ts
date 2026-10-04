import { create } from 'zustand';
import { db } from '../db/database';
import { User } from '../types';
import { generateId } from '../utils/format';
import bcrypt from 'bcryptjs';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadSession: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isLoading: true,
  error: null,

  loadSession: async () => {
    try {
      const sessionUserId = localStorage.getItem('hissob_session');
      if (sessionUserId) {
        const user = await db.users.get(sessionUserId);
        if (user) {
          set({ currentUser: user, isLoading: false });
          return;
        }
      }
    } catch (e) {
      console.error('Session load error:', e);
    }
    set({ currentUser: null, isLoading: false });
  },

  login: async (email: string, password: string) => {
    set({ error: null, isLoading: true });
    try {
      const user = await db.users.where('email').equals(email).first();
      if (!user) {
        set({ error: "Foydalanuvchi topilmadi", isLoading: false });
        return false;
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        set({ error: "Parol noto'g'ri", isLoading: false });
        return false;
      }
      localStorage.setItem('hissob_session', user.id);
      set({ currentUser: user, isLoading: false });
      return true;
    } catch (e) {
      set({ error: "Kirishda xato yuz berdi", isLoading: false });
      return false;
    }
  },

  register: async (firstName: string, lastName: string, email: string, password: string) => {
    set({ error: null, isLoading: true });
    try {
      const existing = await db.users.where('email').equals(email).first();
      if (existing) {
        set({ error: "Bu email allaqachon ro'yxatdan o'tgan", isLoading: false });
        return false;
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const id = generateId();
      const now = new Date();
      const user: User = {
        id,
        firstName,
        lastName,
        email,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      await db.users.add(user);
      
      // Create default settings
      await db.settings.add({
        id: generateId(),
        userId: id,
        language: 'uz',
        theme: 'light',
        currency: "so'm",
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'uz-UZ',
      });

      localStorage.setItem('hissob_session', id);
      set({ currentUser: user, isLoading: false });
      return true;
    } catch (e) {
      set({ error: "Ro'yxatdan o'tishda xato yuz berdi", isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('hissob_session');
    set({ currentUser: null });
  },

  updateProfile: async (data: Partial<User>) => {
    const user = get().currentUser;
    if (!user) return false;
    try {
      const updated = { ...user, ...data, updatedAt: new Date() };
      await db.users.put(updated);
      set({ currentUser: updated });
      return true;
    } catch (e) {
      return false;
    }
  },
}));
