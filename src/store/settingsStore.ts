import { create } from 'zustand';
import { db } from '../db/database';
import { Settings } from '../types';
import { generateId } from '../utils/format';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  loadSettings: (userId: string) => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  getLanguage: () => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async (userId: string) => {
    set({ isLoading: true });
    try {
      let settings = await db.settings.where('userId').equals(userId).first();
      if (!settings) {
        settings = {
          id: generateId(),
          userId,
          language: 'uz',
          theme: 'light',
          currency: "so'm",
          dateFormat: 'DD.MM.YYYY',
          numberFormat: 'uz-UZ',
        };
        await db.settings.add(settings);
      }
      set({ settings, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  updateSettings: async (data: Partial<Settings>) => {
    const current = get().settings;
    if (!current) return;
    const updated = { ...current, ...data };
    await db.settings.put(updated);
    set({ settings: updated });
  },

  getLanguage: () => {
    return get().settings?.language || 'uz';
  },
}));
