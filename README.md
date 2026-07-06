# Scran POS

**Premium Restaurant POS — Self-Ordering Kiosk with POS-like Order Management.**
Scran (Scottish slang for *food*) is a demo-ready Mini POS Layer: self-ordering kiosk + kitchen display + token/pickup display + admin dashboard in one app. Built for cafés, restaurants, cloud kitchens, hotels, QSR brands and food courts.

> ⚠️ Positioning: this is a **Mini POS Layer / POS-like Order Management demo**, not a full enterprise POS. It shows how self-ordering, kitchen coordination, token management and reporting can be added to any outlet — even one with no existing POS — and later plugged into real POS/payment/ERP systems.

---

## 1. What this software does

| Screen | What it shows |
|---|---|
| **Kiosk** (`/kiosk`) | Welcome/idle screen (English/हिंदी) → premium 3-column POS (category sidebar · menu grid/list with allergy cautions · Current Order panel with Hold Order, Discount, Print, Split) → item customisation → payment (live scan-to-pay QR / Card / Cash / Corporate Wallet) → token confirmation |
| **Phone Pay** (`/pay`) | Opened by scanning the kiosk QR from a real phone — confirm payment on the phone, kiosk completes the order automatically |
| **Kitchen** (`/kitchen`) | Live KDS: New → Preparing → Ready columns, action buttons, delayed-order highlighting |
| **Pickup Display** (`/pickup`) | Customer-facing token board: Preparing / Ready (green) / Collected |
| **Admin** (`/admin`) | KPI dashboard, menu management, order history, reports, device monitoring mock |

All flows are fully functional and share one persisted state (localStorage) with live cross-tab sync.

## 2. How to run locally

```bash
npm install
npm run dev          # → http://localhost:5173  (also on your LAN IP for phone/QR testing)
```

Production build (enables the offline service worker):

```bash
npm run build
npm run preview      # → http://localhost:4173
```

Requires Node 18+. No backend server or API keys — the scan-to-pay session API runs inside the Vite dev/preview server.

## 3. Demo login & codes

- **Admin:** `admin@scran.app` / `admin123` (legacy `admin@brainadz.com` also works)
- **Coupons:** `SCRAN10` (10%), `WELCOME5` (5%)
- **Employee discount:** Cart → Discount → Employee ID tab → enter any ID (e.g. `EMP1024`) → a 4-digit OTP is "sent" to the employee's registered phone/email (demo shows it on screen) → verify → 15% off

## 4. Scan-to-pay from a real phone (demo highlight)

1. On the kiosk, go to payment with **UPI QR** selected. The QR is a real, scannable code.
2. Make sure your phone is on the **same Wi-Fi** as the computer running the app.
3. Scan with the phone camera → a Scran payment page opens with the amount → tap **Pay**.
4. The kiosk detects the confirmation within ~1.5 s and jumps straight to the token screen — no touch needed.

Notes:
- Windows may ask to allow Node.js through the firewall the first time — allow it on **Private networks**.
- If the phone can't reach the page, open `http://<your-LAN-IP>:5173` on the phone browser first to verify connectivity.
- The payment session API is in-memory inside `vite.config.ts` (`/api/pay/*`). In production this is replaced by Razorpay / PhonePe order + webhook confirmation — the kiosk polling logic stays identical.

## 5. Kiosk flow

Start Order → browse by category / search / filters (Veg, Bestseller, Available, Combos) → tap an item card (allergy cautions shown on the card and in the customisation sheet) → set quantity, add-ons, spice, notes → cart calculates Subtotal → Discount → GST 5% → Total → Checkout → pay → token (e.g. `T-101`) with estimated prep time.

## 6. Kitchen & pickup flow

Orders land in **Kitchen → New Orders** instantly. Buttons advance status: **Accept → Mark Preparing → Mark Ready → Mark Collected**. Orders waiting 10+ minutes are highlighted as delayed. Every change updates the **Pickup Display** columns live.

## 7. Admin dashboard

- **Dashboard** — KPIs (today's orders, revenue, AOV, best-seller, pending) + recent orders + device health.
- **Food & Menu** — a full menu-management system with four sub-tabs:
  - *Items* — add / edit / delete dishes, per-dish photo upload, availability + kiosk/POS visibility toggles, search & category filter. A new dish appears on the kiosk in its category immediately.
  - *Categories* — create / rename / reorder (up-down) / show-hide / delete categories, with an emoji or uploaded image icon. Drives the kiosk sidebar. A category can't be deleted while dishes are assigned to it.
  - *Cuisines* — create / rename / delete cuisine groups (Indian, American, Italian, Chinese, Continental…). Items can be grouped and browsed by cuisine.
  - *Display* — default view (grid/list), sidebar layout (category-first vs cuisine-first), and section toggles (featured offers, bestseller/combos filter chips).
- **Ads & Promotions** — create offers with banner image + optional video, title/description/discount, linked menu items, date + time scheduling, enable/disable, and placement targets (kiosk home, POS idle, QR screen, pickup display, menu board). Active promos surface as a kiosk offers strip and a kiosk-home banner.
- **Order History**, **Reports** (sales by item & category, payment split, hourly volume), **Device Monitoring** mock, **Settings** (meal-slot times, GST, kiosk menu mode), and **Reset Demo Data**.

### Adding a dish (works end-to-end)
Admin → Food & Menu → *Items* → **Add Dish** → fill name, description, price, category, cuisine, photo, prep time, food type (veg/non-veg/egg), spice level, add-ons, variants, per-item discount, meal slots, kiosk/POS visibility → **Add Dish**. The item shows in the admin list and on the kiosk/POS under its category right away; edit or delete it any time from the same list. New dishes default to **All Day** so they're visible regardless of the current meal slot.

## 8. Integrating with real systems later

Single state layer (`src/store/posStore.ts`) — integration is swapping store actions for API calls:

- **Existing POS API** — push confirmed orders to the outlet's POS.
- **Razorpay / PhonePe** — replace the demo pay session with a real payment intent + webhook; the QR/polling UX is already built.
- **Thermal printer** — Print Receipt/Bill actions target ESC/POS printers or Android print services.
- **Multiple devices** — point each screen at its route; replace localStorage sync with WebSocket/Firebase for cross-device realtime.
- **Employee wallet / HRIS** — the OTP-verified employee discount and wallet payment already capture employee IDs.
- **ERP / accounting** — order history and report aggregates map to daily sales export.

## 9. Android OS 11 deployment notes

Target: Android 11, 8 GB RAM, 1080p touchscreen — the app is lightweight (no heavy animation, no remote images).

**Option A — Chrome kiosk / PWA:** `npm run build`, host `dist/`, *Add to Home screen* (fullscreen landscape manifest, navy theme), pin with a kiosk launcher (e.g. Fully Kiosk Browser). Works offline after first load. Note: the scan-to-pay API needs the Node preview server (or the future real gateway) — pure static hosting falls back to simulated payment.

**Option B — WebView APK:** wrap the hosted URL in a fullscreen WebView, or use Bubblewrap (TWA) / Capacitor for a store-ready APK. Lock with screen pinning or MDM.

Each physical screen opens its own route: kiosk → `/kiosk`, kitchen → `/kitchen`, pickup TV → `/pickup`.

## 10. Feature list

- Premium Scran design system: warm ivory background, navy/sage/copper palette, serif wordmark, 8px-radius cards, thin-line icons
- Realistic food photography assets in `public/food/*.png` (object-contain in cards, emoji only as a load-failure fallback)
- Digital-signage **ad video idle screen** (`public/ads/signage.mp4`) — plays on loop until a customer taps to start ordering
- Self-ordering kiosk: categories, search, filter chips, grid/list views, veg/non-veg badges, Popular tags, **allergy cautions**
- Item customisation: quantity, add-ons, spice level, special instructions + allergen warning
- Cart: Hold Order, Discount (coupon or **Employee ID + 4-digit OTP**), Print Bill, Split Bill, dine-in/takeaway, GST 5%
- Payments: **real scan-to-pay QR confirmed from a phone**, Card POS, Cash, Corporate Wallet + simulated success/failure
- Token generation, Kitchen Display, Pickup Display, Admin dashboard with reports & device monitoring
- Bilingual kiosk (EN/हिंदी), PWA manifest + service worker, localStorage persistence, cross-tab live sync
- Touch-first: 48px+ targets, no hover-only interactions; tested at 1366×768 and 1920×1080

## 11. Known limitations (demo scope)

- Payment, printing, split bill, table/customer selectors and device monitoring are simulated; the phone-pay confirmation is a real HTTP round-trip but no money moves.
- The employee OTP is displayed on screen (no real SMS/email gateway in the demo).
- Persistence is per-browser; cross-device sync needs a small backend.
- Food photos are AI-generated studio-style renders (512×512, consistent white-background style); swap the files in `public/food/` for licensed photography whenever available — same filenames, no code changes.
- Flat 5% GST; token counter wraps at 999; Hindi covers the kiosk flow only.

---

**Tech stack:** React 18 + TypeScript · Vite (+ in-dev payment session middleware) · Tailwind CSS · Zustand (persisted) · lucide-react · qrcode · PWA. No paid services.

© Scran POS — demo build.
