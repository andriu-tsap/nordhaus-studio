'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Configuration } from '@nordhaus/domain';
import { defaultConfiguration } from '@nordhaus/domain';
interface Store {
  items: CartItem[];
  configuration: Configuration;
  locale: 'pl' | 'en';
  add: (item: CartItem) => void;
  remove: (index: number) => void;
  quantity: (index: number, n: number) => void;
  clear: () => void;
  configure: (patch: Partial<Configuration>) => void;
  setLocale: (locale: 'pl' | 'en') => void;
}
export const useStore = create<Store>()(
  persist(
    (set) => ({
      items: [],
      configuration: defaultConfiguration,
      locale: 'pl',
      add: (item) =>
        set((s) => {
          const items = [...s.items];
          const i = items.findIndex(
            (x) => x.productId === item.productId && x.color === item.color && x.size === item.size,
          );
          if (i < 0) items.push(item);
          else
            items[i] = { ...items[i], quantity: Math.min(20, items[i].quantity + item.quantity) };
          return { items };
        }),
      remove: (i) => set((s) => ({ items: s.items.filter((_, n) => n !== i) })),
      quantity: (i, n) =>
        set((s) => ({
          items: s.items.map((x, k) =>
            k === i ? { ...x, quantity: Math.min(20, Math.max(1, n)) } : x,
          ),
        })),
      clear: () => set({ items: [] }),
      configure: (patch) => set((s) => ({ configuration: { ...s.configuration, ...patch } })),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'nh-store' },
  ),
);
export function useT() {
  const locale = useStore((s) => s.locale);
  return (pl: string, en: string) => (locale === 'pl' ? pl : en);
}
