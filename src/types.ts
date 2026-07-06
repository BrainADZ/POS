export type Lang = 'en' | 'hi';
export type OrderType = 'dine-in' | 'takeaway';
export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'collected';

/** category is a free-form name now (managed in Admin → Food & Menu → Categories) */
export type Category = string;

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'supper';

/** veg / non-veg / contains-egg indicator */
export type FoodType = 'veg' | 'nonveg' | 'egg';

export interface SlotWindow {
  /** 24h "HH:MM" */
  start: string;
  end: string;
}

export type SlotConfig = Record<MealSlot, SlotWindow>;

export interface Addon {
  name: string;
  price: number;
}

/** e.g. Regular / Large — selecting a variant overrides the base price */
export interface Variant {
  name: string;
  price: number;
}

/** admin-managed kiosk sidebar category */
export interface FoodCategory {
  id: string;
  name: string;
  /** emoji glyph fallback */
  icon: string;
  /** optional uploaded image (data URL) */
  image?: string;
  order: number;
  visible: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  /** cuisine / food-type grouping, e.g. Indian, Italian, Chinese */
  cuisine: string;
  price: number;
  /** true when foodType === 'veg' — kept for existing filters/kitchen */
  veg: boolean;
  foodType: FoodType;
  bestseller: boolean;
  available: boolean;
  /** realistic food photo asset or uploaded data URL */
  image?: string;
  /** fallback glyph used only if the image fails to load */
  emoji: string;
  gradient: string;
  desc: string;
  addons: Addon[];
  variants: Variant[];
  /** whether spice-level selection applies in the customise modal */
  spice: boolean;
  /** 0 none · 1 mild · 2 medium · 3 hot — indicator only */
  spicyLevel: number;
  /** allergy caution list, e.g. ['gluten', 'dairy'] */
  allergens: string[];
  /** meal slots this dish is served in; all four = all day */
  slots: MealSlot[];
  /** kitchen preparation time in minutes — drives the customer wait estimate */
  prepMins: number;
  /** per-item discount percentage, 0–100 */
  discountPct: number;
  /** visible on the self-ordering kiosk */
  showOnKiosk: boolean;
  /** visible on the staff POS */
  showOnPos: boolean;
}

export interface CartLine {
  lineId: string;
  itemId: string;
  name: string;
  image?: string;
  emoji: string;
  veg: boolean;
  foodType?: FoodType;
  unitPrice: number;
  qty: number;
  addons: Addon[];
  variant?: string;
  spiceLevel?: string;
  note?: string;
  prepMins?: number;
}

export interface Order {
  id: string;
  token: number;
  /** dine-in table, e.g. "Table 12" */
  table?: string;
  /** customer name (empty = walk-in) */
  customerName?: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  orderType: OrderType;
  paymentMode: string;
  status: OrderStatus;
  createdAt: number;
  acceptedAt?: number;
  preparingAt?: number;
  readyAt?: number;
  collectedAt?: number;
  etaMins: number;
  couponCode?: string | null;
}

/** where a promotion is allowed to display */
export interface PromoPlacements {
  kioskHome: boolean;
  posIdle: boolean;
  qrScreen: boolean;
  pickupDisplay: boolean;
  menuBoard: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  desc: string;
  discountPct: number;
  /** banner image data URL */
  banner?: string;
  /** promo video data URL (optional) */
  video?: string;
  linkedItemIds: string[];
  /** "YYYY-MM-DD" or '' for no bound */
  startDate: string;
  endDate: string;
  /** "HH:MM" or '' for all-day */
  startTime: string;
  endTime: string;
  enabled: boolean;
  placements: PromoPlacements;
}

/** kiosk menu presentation, controlled from Admin → Display */
export interface DisplaySettings {
  defaultView: 'grid' | 'list';
  layoutMode: 'category' | 'cuisine';
  showFeatured: boolean;
  showBestsellers: boolean;
  showCombos: boolean;
}
