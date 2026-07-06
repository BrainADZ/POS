import type { CartLine, FoodType, MealSlot, MenuItem, Promotion, SlotConfig } from './types';

export const GST_RATE = 0.05;
export const EMPLOYEE_DISCOUNT_RATE = 0.15;

/* ---------- food type ---------- */

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  veg: 'Veg',
  nonveg: 'Non-veg',
  egg: 'Egg',
};

/** price after any per-item discount (rounded to whole rupees) */
export function effectivePrice(item: Pick<MenuItem, 'price' | 'discountPct'>): number {
  if (!item.discountPct) return item.price;
  return Math.round(item.price * (1 - item.discountPct / 100));
}

/* ---------- promotions ---------- */

/** local "YYYY-MM-DD" (NOT UTC) — matches the admin date pickers */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** an offer is live when enabled and inside its date + time bounds */
export function isPromoActive(p: Promotion, now: Date = new Date()): boolean {
  if (!p.enabled) return false;
  const today = localDateStr(now); // local date, so "today" matches the date picker in any timezone
  if (p.startDate && today < p.startDate) return false;
  if (p.endDate && today > p.endDate) return false;
  if (p.startTime && p.endTime) {
    const t = now.getHours() * 60 + now.getMinutes();
    const start = parseHM(p.startTime);
    const end = parseHM(p.endTime);
    if (start <= end) {
      // same-day window, e.g. 11:00 → 15:00
      if (t < start || t >= end) return false;
    } else {
      // overnight window crossing midnight, e.g. 23:53 → 02:53
      if (t < start && t >= end) return false;
    }
  }
  return true;
}

/* ---------- meal slots ---------- */

export const ALL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'supper'];

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  supper: 'Supper',
};

/** "16:30" → minutes since midnight */
export function parseHM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** "16:00" → "4:00 pm" */
export function formatHM(s: string): string {
  const mins = parseHM(s);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
}

/**
 * Which meal slot is live right now. Admin can force a slot via override;
 * supper only counts when enabled. Returns null outside all service windows.
 */
export function getActiveSlot(
  cfg: SlotConfig,
  supperEnabled: boolean,
  override: 'auto' | MealSlot,
  now: Date = new Date()
): MealSlot | null {
  if (override !== 'auto') return override;
  const t = now.getHours() * 60 + now.getMinutes();
  for (const slot of ALL_SLOTS) {
    if (slot === 'supper' && !supperEnabled) continue;
    const w = cfg[slot];
    if (parseHM(w.start) <= t && t < parseHM(w.end)) return slot;
  }
  return null;
}

/** customer-facing wait estimate = longest prep time in the order */
export function maxWaitMins(cart: CartLine[]): number {
  return Math.max(5, ...cart.map((l) => l.prepMins ?? 10));
}

export const COUPONS: Record<string, number> = {
  SCRAN10: 0.1,
  WELCOME5: 0.05,
};

/** Employee discounts are stored on the cart as `EMP:<employee id>` after OTP verification. */
export function isEmployeeCode(code: string | null): boolean {
  return !!code && code.toUpperCase().startsWith('EMP:');
}

export function discountRateFor(code: string | null): number {
  if (!code) return 0;
  const c = code.toUpperCase();
  if (c.startsWith('EMP:')) return EMPLOYEE_DISCOUNT_RATE;
  return COUPONS[c] ?? 0;
}

export function discountLabel(code: string | null): string {
  if (!code) return '';
  if (isEmployeeCode(code)) return `Employee ${code.slice(4)} (${EMPLOYEE_DISCOUNT_RATE * 100}%)`;
  return code.toUpperCase();
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineTotal(line: CartLine): number {
  const addonSum = line.addons.reduce((s, a) => s + a.price, 0);
  return (line.unitPrice + addonSum) * line.qty;
}

export function computeTotals(cart: CartLine[], couponCode: string | null, gstRate: number = GST_RATE) {
  const subtotal = round2(cart.reduce((s, l) => s + lineTotal(l), 0));
  const rate = discountRateFor(couponCode);
  const discount = round2(subtotal * rate);
  const gst = round2((subtotal - discount) * gstRate);
  const total = round2(subtotal - discount + gst);
  return { subtotal, discount, gst, total };
}

export function inr(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function timeHM(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function minsSince(ts: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - ts) / 60000));
}

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function formatToken(token: number): string {
  return 'T-' + String(token).padStart(3, '0');
}
