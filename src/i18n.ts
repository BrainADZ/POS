import type { Lang } from './types';

const STRINGS = {
  welcomeTitle: { en: 'Welcome to Scran', hi: 'Scran में आपका स्वागत है' },
  welcomeSub: {
    en: 'Order at the kiosk. Skip the queue. Collect with your token.',
    hi: 'कियोस्क से ऑर्डर करें। लाइन छोड़ें। टोकन से खाना लें।',
  },
  startOrder: { en: 'Start Order', hi: 'ऑर्डर शुरू करें' },
  touchToBegin: { en: 'Touch anywhere to begin', hi: 'शुरू करने के लिए स्क्रीन छुएं' },
  searchPlaceholder: { en: 'Search menu item…', hi: 'मेनू आइटम खोजें…' },
  currentOrder: { en: 'Current Order', hi: 'वर्तमान ऑर्डर' },
  dineIn: { en: 'Dine-in', hi: 'यहीं खाएं' },
  takeaway: { en: 'Takeaway', hi: 'पैक कराएं' },
  emptyCartTitle: { en: 'Your order is empty', hi: 'आपका ऑर्डर खाली है' },
  emptyCartSub: { en: 'Tap items on the menu to add them here.', hi: 'मेनू से आइटम चुनकर यहां जोड़ें।' },
  subtotal: { en: 'Subtotal', hi: 'उप-योग' },
  gst: { en: 'GST', hi: 'जीएसटी' },
  discount: { en: 'Discount', hi: 'छूट' },
  total: { en: 'Total', hi: 'कुल राशि' },
  proceedToPayment: { en: 'Proceed to Payment', hi: 'भुगतान करें' },
  clearCart: { en: 'Clear Cart', hi: 'कार्ट खाली करें' },
  addToOrder: { en: 'Add to Order', hi: 'ऑर्डर में जोड़ें' },
  add: { en: 'Add', hi: 'जोड़ें' },
  vegOnly: { en: 'Veg', hi: 'वेज' },
  bestseller: { en: 'Bestseller', hi: 'बेस्टसेलर' },
  available: { en: 'Available', hi: 'उपलब्ध' },
  combos: { en: 'Combos', hi: 'कॉम्बो' },
  outOfStock: { en: 'Out of stock', hi: 'स्टॉक ख़त्म' },
  quantity: { en: 'Quantity', hi: 'मात्रा' },
  addons: { en: 'Add-ons', hi: 'ऐड-ऑन' },
  spiceLevel: { en: 'Spice level', hi: 'तीखापन' },
  specialInstructions: { en: 'Special instructions', hi: 'विशेष निर्देश' },
  notePlaceholder: { en: 'e.g. less oil, no onion…', hi: 'जैसे कम तेल, बिना प्याज़…' },
  couponPlaceholder: { en: 'Coupon code (try SCRAN10)', hi: 'कूपन कोड (SCRAN10 आज़माएं)' },
  apply: { en: 'Apply', hi: 'लागू करें' },
  allergyNote: { en: 'Allergy caution — contains', hi: 'एलर्जी सावधानी — इसमें शामिल है' },
  allergyStaff: { en: 'Please inform staff of any allergies.', hi: 'कृपया किसी भी एलर्जी की जानकारी स्टाफ को दें।' },
  choosePayment: { en: 'Choose payment method', hi: 'भुगतान का तरीका चुनें' },
  amountToPay: { en: 'Amount to pay', hi: 'भुगतान राशि' },
  orderReceived: { en: 'Order Received', hi: 'ऑर्डर मिल गया' },
  yourToken: { en: 'Your token number', hi: 'आपका टोकन नंबर' },
  estPrep: { en: 'Estimated preparation time', hi: 'अनुमानित तैयारी समय' },
  newOrder: { en: 'New Order', hi: 'नया ऑर्डर' },
  printReceipt: { en: 'Print Receipt', hi: 'रसीद प्रिंट करें' },
  viewPickup: { en: 'View Pickup Display', hi: 'पिकअप डिस्प्ले देखें' },
  minutes: { en: 'minutes', hi: 'मिनट' },
  back: { en: 'Back', hi: 'वापस' },
  backToMenu: { en: 'Back to Menu', hi: 'मेनू पर वापस' },
  items: { en: 'items', hi: 'आइटम' },
  noResults: { en: 'No items match your search', hi: 'कोई आइटम नहीं मिला' },
  noResultsSub: { en: 'Try a different keyword or clear the filters.', hi: 'दूसरा शब्द आज़माएं या फ़िल्टर हटाएं।' },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}
