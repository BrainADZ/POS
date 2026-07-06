import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_MENU, DEFAULT_SLOT_CONFIG, DEFAULT_CATEGORIES, DEFAULT_CUISINES, DEFAULT_DISPLAY } from '../data/menu';
import { computeTotals, maxWaitMins, uid, round2, GST_RATE } from '../utils';
import type {
  CartLine, DisplaySettings, FoodCategory, Lang, MealSlot, MenuItem, Order, OrderStatus, OrderType,
  Promotion, SlotConfig, SlotWindow,
} from '../types';

export const ADMIN_EMAIL = 'admin@scran.app';
export const ADMIN_PASSWORD = 'admin123';
/** legacy demo login kept working after the rebrand */
const LEGACY_ADMIN_EMAIL = 'admin@brainadz.com';

interface PosState {
  menu: MenuItem[];
  categories: FoodCategory[];
  cuisines: string[];
  promotions: Promotion[];
  display: DisplaySettings;
  cart: CartLine[];
  orderType: OrderType;
  /** selected dine-in table, '' = none */
  tableNumber: string;
  /** customer name for the current order, '' = walk-in */
  customerName: string;
  couponCode: string | null;
  orders: Order[];
  tokenCounter: number;
  lang: Lang;
  adminLoggedIn: boolean;
  toast: string | null;

  // service settings (Admin → Settings)
  slotConfig: SlotConfig;
  supperEnabled: boolean;
  /** 'auto' follows the clock; a slot value forces that menu (for demos/testing) */
  slotOverride: 'auto' | MealSlot;
  gstRate: number;

  // kiosk / cart
  addToCart: (line: Omit<CartLine, 'lineId'>) => void;
  updateLineQty: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  setOrderType: (t: OrderType) => void;
  setTable: (table: string) => void;
  setCustomer: (name: string) => void;
  setCoupon: (code: string | null) => void;
  placeOrder: (paymentMode: string) => Order;

  // kitchen
  setOrderStatus: (orderId: string, status: OrderStatus) => void;

  // menu items
  toggleAvailability: (itemId: string) => void;
  updateMenuItem: (itemId: string, patch: Partial<MenuItem>) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => MenuItem;
  deleteMenuItem: (itemId: string) => void;

  // categories
  addCategory: (name: string, icon: string) => void;
  updateCategory: (id: string, patch: Partial<FoodCategory>) => void;
  deleteCategory: (id: string) => boolean;
  moveCategory: (id: string, dir: -1 | 1) => void;

  // cuisines
  addCuisine: (name: string) => void;
  renameCuisine: (from: string, to: string) => void;
  deleteCuisine: (name: string) => void;

  // promotions
  addPromotion: (promo: Omit<Promotion, 'id'>) => void;
  updatePromotion: (id: string, patch: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;

  // display
  setDisplay: (patch: Partial<DisplaySettings>) => void;

  // settings
  updateSlotWindow: (slot: MealSlot, patch: Partial<SlotWindow>) => void;
  setSupperEnabled: (on: boolean) => void;
  setSlotOverride: (v: 'auto' | MealSlot) => void;
  setGstRate: (rate: number) => void;

  // misc
  setLang: (lang: Lang) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  resetDemoData: () => void;

  login: (email: string, password: string) => boolean;
  logout: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      menu: DEFAULT_MENU,
      categories: DEFAULT_CATEGORIES,
      cuisines: DEFAULT_CUISINES,
      promotions: [],
      display: DEFAULT_DISPLAY,
      cart: [],
      orderType: 'dine-in',
      tableNumber: '',
      customerName: '',
      couponCode: null,
      orders: [],
      tokenCounter: 101,
      lang: 'en',
      adminLoggedIn: false,
      toast: null,
      slotConfig: DEFAULT_SLOT_CONFIG,
      supperEnabled: false,
      slotOverride: 'auto',
      gstRate: GST_RATE,

      addToCart: (line) => set((s) => ({ cart: [...s.cart, { ...line, lineId: uid() }] })),

      updateLineQty: (lineId, delta) =>
        set((s) => ({
          cart: s.cart
            .map((l) => (l.lineId === lineId ? { ...l, qty: Math.min(20, Math.max(0, l.qty + delta)) } : l))
            .filter((l) => l.qty > 0),
        })),

      removeLine: (lineId) => set((s) => ({ cart: s.cart.filter((l) => l.lineId !== lineId) })),

      clearCart: () => set({ cart: [], couponCode: null }),

      setOrderType: (orderType) => set({ orderType }),

      setTable: (tableNumber) => set({ tableNumber }),

      setCustomer: (customerName) => set({ customerName }),

      setCoupon: (couponCode) => set({ couponCode }),

      placeOrder: (paymentMode) => {
        const s = get();
        const totals = computeTotals(s.cart, s.couponCode, s.gstRate);
        const token = s.tokenCounter;
        const now = Date.now();
        const order: Order = {
          id: `SC-${new Date(now).toISOString().slice(0, 10).replace(/-/g, '')}-${token}`,
          token,
          table: s.orderType === 'dine-in' && s.tableNumber ? s.tableNumber : undefined,
          customerName: s.customerName || undefined,
          lines: s.cart,
          subtotal: totals.subtotal,
          discount: totals.discount,
          gst: totals.gst,
          total: totals.total,
          orderType: s.orderType,
          paymentMode,
          status: 'new',
          createdAt: now,
          // customer promise = longest dish prep time in the order
          etaMins: maxWaitMins(s.cart),
          couponCode: s.couponCode,
        };
        set({
          orders: [order, ...s.orders],
          tokenCounter: token >= 999 ? 101 : token + 1,
          cart: [],
          couponCode: null,
          // table & customer belong to the completed order — reset for the next guest
          tableNumber: '',
          customerName: '',
        });
        return order;
      },

      setOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const stamp = Date.now();
            const patch: Partial<Order> = { status };
            if (status === 'accepted') patch.acceptedAt = stamp;
            if (status === 'preparing') patch.preparingAt = stamp;
            if (status === 'ready') patch.readyAt = stamp;
            if (status === 'collected') patch.collectedAt = stamp;
            return { ...o, ...patch };
          }),
        })),

      /* ---------- menu items ---------- */

      toggleAvailability: (itemId) =>
        set((s) => ({ menu: s.menu.map((m) => (m.id === itemId ? { ...m, available: !m.available } : m)) })),

      updateMenuItem: (itemId, patch) =>
        set((s) => ({
          menu: s.menu.map((m) => {
            if (m.id !== itemId) return m;
            const next = { ...m, ...patch };
            if (patch.price !== undefined) next.price = round2(patch.price);
            // keep the legacy `veg` boolean in sync with foodType
            if (patch.foodType !== undefined) next.veg = patch.foodType === 'veg';
            return next;
          }),
        })),

      addMenuItem: (item) => {
        const created: MenuItem = { ...item, id: uid(), price: round2(item.price), veg: item.foodType === 'veg' };
        set((s) => ({ menu: [...s.menu, created] }));
        return created;
      },

      deleteMenuItem: (itemId) => set((s) => ({ menu: s.menu.filter((m) => m.id !== itemId) })),

      /* ---------- categories ---------- */

      addCategory: (name, icon) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return s;
          const order = s.categories.length ? Math.max(...s.categories.map((c) => c.order)) + 1 : 0;
          return {
            categories: [...s.categories, { id: uid(), name: trimmed, icon: icon || '🍽️', order, visible: true }],
          };
        }),

      updateCategory: (id, patch) =>
        set((s) => {
          const target = s.categories.find((c) => c.id === id);
          const renaming = patch.name !== undefined && target && patch.name !== target.name;
          return {
            categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
            // rename cascades to every item in that category
            menu: renaming && target ? s.menu.map((m) => (m.category === target.name ? { ...m, category: patch.name! } : m)) : s.menu,
          };
        }),

      deleteCategory: (id) => {
        const s = get();
        const target = s.categories.find((c) => c.id === id);
        if (!target) return false;
        if (s.menu.some((m) => m.category === target.name)) return false; // block delete while items assigned
        set({ categories: s.categories.filter((c) => c.id !== id) });
        return true;
      },

      moveCategory: (id, dir) =>
        set((s) => {
          const sorted = [...s.categories].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((c) => c.id === id);
          const swap = idx + dir;
          if (idx < 0 || swap < 0 || swap >= sorted.length) return s;
          const a = sorted[idx];
          const b = sorted[swap];
          return { categories: s.categories.map((c) => (c.id === a.id ? { ...c, order: b.order } : c.id === b.id ? { ...c, order: a.order } : c)) };
        }),

      /* ---------- cuisines ---------- */

      addCuisine: (name) =>
        set((s) => {
          const t = name.trim();
          if (!t || s.cuisines.some((c) => c.toLowerCase() === t.toLowerCase())) return s;
          return { cuisines: [...s.cuisines, t] };
        }),

      renameCuisine: (from, to) =>
        set((s) => {
          const t = to.trim();
          if (!t) return s;
          return {
            cuisines: s.cuisines.map((c) => (c === from ? t : c)),
            menu: s.menu.map((m) => (m.cuisine === from ? { ...m, cuisine: t } : m)),
          };
        }),

      deleteCuisine: (name) =>
        set((s) => ({
          cuisines: s.cuisines.filter((c) => c !== name),
          menu: s.menu.map((m) => (m.cuisine === name ? { ...m, cuisine: '' } : m)),
        })),

      /* ---------- promotions ---------- */

      addPromotion: (promo) => set((s) => ({ promotions: [...s.promotions, { ...promo, id: uid() }] })),

      updatePromotion: (id, patch) =>
        set((s) => ({ promotions: s.promotions.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      deletePromotion: (id) => set((s) => ({ promotions: s.promotions.filter((p) => p.id !== id) })),

      /* ---------- display ---------- */

      setDisplay: (patch) => set((s) => ({ display: { ...s.display, ...patch } })),

      /* ---------- settings ---------- */

      updateSlotWindow: (slot, patch) =>
        set((s) => ({ slotConfig: { ...s.slotConfig, [slot]: { ...s.slotConfig[slot], ...patch } } })),

      setSupperEnabled: (supperEnabled) => set({ supperEnabled }),

      setSlotOverride: (slotOverride) => set({ slotOverride }),

      setGstRate: (rate) => set({ gstRate: Math.min(0.28, Math.max(0, rate)) }),

      setLang: (lang) => set({ lang }),

      showToast: (msg) => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toast: msg });
        toastTimer = setTimeout(() => set({ toast: null }), 2600);
      },

      clearToast: () => set({ toast: null }),

      resetDemoData: () =>
        set({
          menu: DEFAULT_MENU,
          categories: DEFAULT_CATEGORIES,
          cuisines: DEFAULT_CUISINES,
          promotions: [],
          display: DEFAULT_DISPLAY,
          cart: [],
          orders: [],
          tokenCounter: 101,
          couponCode: null,
          slotConfig: DEFAULT_SLOT_CONFIG,
          supperEnabled: false,
          slotOverride: 'auto',
          gstRate: GST_RATE,
        }),

      login: (email, password) => {
        const e = email.trim().toLowerCase();
        const ok = (e === ADMIN_EMAIL || e === LEGACY_ADMIN_EMAIL) && password === ADMIN_PASSWORD;
        if (ok) set({ adminLoggedIn: true });
        return ok;
      },

      logout: () => set({ adminLoggedIn: false }),
    }),
    {
      name: 'scran-pos',
      version: 5,
      // reset the catalogue-shaped state when the model changes
      // (v4: meal slots + prep; v5: categories, cuisines, promotions, variants, food type)
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<PosState>;
        if (version < 5) {
          return {
            ...state,
            menu: DEFAULT_MENU,
            categories: DEFAULT_CATEGORIES,
            cuisines: DEFAULT_CUISINES,
            promotions: [],
            display: DEFAULT_DISPLAY,
            cart: [],
            slotConfig: DEFAULT_SLOT_CONFIG,
            supperEnabled: false,
            slotOverride: 'auto' as const,
            gstRate: GST_RATE,
          };
        }
        return state;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        menu: s.menu,
        categories: s.categories,
        cuisines: s.cuisines,
        promotions: s.promotions,
        display: s.display,
        cart: s.cart,
        orderType: s.orderType,
        tableNumber: s.tableNumber,
        customerName: s.customerName,
        couponCode: s.couponCode,
        orders: s.orders,
        tokenCounter: s.tokenCounter,
        lang: s.lang,
        adminLoggedIn: s.adminLoggedIn,
        slotConfig: s.slotConfig,
        supperEnabled: s.supperEnabled,
        slotOverride: s.slotOverride,
        gstRate: s.gstRate,
      }),
    }
  )
);

/** Live-sync store across browser tabs (kiosk / kitchen / pickup open together). */
export function initCrossTabSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'scran-pos') {
      usePosStore.persist.rehydrate();
    }
  });
}
