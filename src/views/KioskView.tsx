import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Armchair, Banknote, Beef, Bell, Cake, CheckCircle2, ChevronDown, ChevronRight, Clock,
  Coffee, CreditCard, EggFried, LayoutGrid, Leaf, List, Package, Pizza, Printer, QrCode,
  RefreshCw, Salad, Search, ShoppingCart, SlidersHorizontal, Star, TicketCheck, User, UtensilsCrossed,
  Wallet, Wifi, X, XCircle,
} from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { CATEGORIES, SPICE_LEVELS } from '../data/menu';
import type { Category, MenuItem, Order } from '../types';
import ItemCard from '../components/ItemCard';
import CustomizeModal from '../components/CustomizeModal';
import CartPanel from '../components/CartPanel';
import { FoodImage, MockQR, QRCanvas, ScranLogo, VegDot } from '../components/Shared';
import { computeTotals, effectivePrice, formatHM, formatToken, getActiveSlot, inr, isPromoActive, lineTotal, maxWaitMins, SLOT_LABELS, uid } from '../utils';
import { t } from '../i18n';
import { navigate } from '../App';

type Step = 'welcome' | 'order' | 'payment' | 'confirm';
type CategoryFilter = 'All' | Category;

const CATEGORY_ICONS: Record<CategoryFilter, React.ReactNode> = {
  All: <LayoutGrid size={19} />,
  Breakfast: <EggFried size={19} />,
  Combos: <Package size={19} />,
  Burgers: <Beef size={19} />,
  Pizza: <Pizza size={19} />,
  Pasta: <UtensilsCrossed size={19} />,
  Sides: <Salad size={19} />,
  Drinks: <Coffee size={19} />,
  Desserts: <Cake size={19} />,
};

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI QR', icon: <QrCode size={24} />, desc: 'Scan & pay from your phone' },
  { id: 'card', label: 'Card POS', icon: <CreditCard size={24} />, desc: 'Tap / insert card on terminal' },
  { id: 'cash', label: 'Cash Counter', icon: <Banknote size={24} />, desc: 'Pay when you collect' },
  { id: 'wallet', label: 'Corporate Wallet', icon: <Wallet size={24} />, desc: 'Employee ID / meal wallet' },
];

export default function KioskView() {
  const [step, setStep] = useState<Step>('welcome');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [initialMethod, setInitialMethod] = useState('upi');

  return (
    <div className="h-full">
      {step === 'welcome' && <WelcomeScreen onStart={() => setStep('order')} />}
      {step === 'order' && (
        <OrderScreen
          onProceed={(method) => {
            setInitialMethod(method === 'card' ? 'card' : 'upi');
            setStep('payment');
          }}
        />
      )}
      {step === 'payment' && (
        <PaymentScreen
          initialMethod={initialMethod}
          onBack={() => setStep('order')}
          onPaid={(order) => {
            setPlacedOrder(order);
            setStep('confirm');
          }}
        />
      )}
      {step === 'confirm' && placedOrder && <ConfirmScreen order={placedOrder} onNewOrder={() => setStep('welcome')} />}
    </div>
  );
}

/* ---------------------------------- 1. Welcome / idle screen ---------------------------------- */

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const lang = usePosStore((s) => s.lang);
  const setLang = usePosStore((s) => s.setLang);
  const promotions = usePosStore((s) => s.promotions);
  // digital-signage ad plays on loop while the kiosk is idle; falls back to the
  // static branded screen if the video asset is missing or cannot autoplay
  const [videoOk, setVideoOk] = useState(true);
  // top active promotion flagged for the kiosk home screen — it drives the idle ad
  const homePromo = promotions.find((p) => p.placements.kioskHome && isPromoActive(p));
  // an active promo's own video/banner replaces the default signage on the home screen
  const promoVideo = homePromo?.video || null;
  const promoImage = homePromo && !homePromo.video ? homePromo.banner || null : null;
  const videoSrc = promoVideo || '/ads/signage.mp4';
  const hasMediaBg = promoImage ? true : videoOk;
  const light = hasMediaBg; // white text over media, dark text on the ivory fallback

  return (
    <button
      onClick={onStart}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-navy"
      style={
        hasMediaBg
          ? undefined
          : { background: '#F7F6F2', backgroundImage: 'radial-gradient(rgba(15,23,42,0.045) 1px, transparent 1px)', backgroundSize: '26px 26px' }
      }
    >
      {/* background media: promo video → promo banner image → default signage video */}
      {promoImage ? (
        <img src={promoImage} alt={homePromo?.title ?? ''} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        videoOk && (
          <video
            key={videoSrc}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoOk(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      )}
      {hasMediaBg && (
        <>
          {/* legibility scrim for the branding + CTA */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-navy/50" />
          <div className="absolute left-5 top-5 z-10 flex items-center gap-3">
            <ScranLogo size="md" light />
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
              Self-Ordering Kiosk
            </span>
          </div>
        </>
      )}

      {/* live offer badge, top-right */}
      {homePromo && (
        <div className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-extrabold text-white shadow-lg">
          <Star size={15} fill="currentColor" /> Today's Offer
        </div>
      )}

      <div className={`z-10 flex flex-col items-center px-6 text-center ${hasMediaBg ? 'mt-auto pb-10' : ''}`}>
        {!hasMediaBg && (
          <>
            <ScranLogo size="xl" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.35em] text-accent-600">Restaurant POS · Self-Ordering</p>
          </>
        )}
        <h1 className={`mt-6 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl ${light ? 'text-white drop-shadow-lg' : 'text-navy'}`}>
          {t('welcomeTitle', lang)}
        </h1>
        <p className={`mt-3 max-w-xl text-base md:text-lg ${light ? 'text-white/85' : 'text-slate-500'}`}>{t('welcomeSub', lang)}</p>

        {/* prominent promotion card */}
        {homePromo && (
          <div className="mt-6 flex w-full max-w-lg items-center gap-4 rounded-2xl border border-white/25 bg-white/95 p-4 text-left shadow-2xl">
            {homePromo.banner ? (
              <img src={homePromo.banner} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-4xl">🎉</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-navy">{homePromo.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500">{homePromo.desc}</p>
            </div>
            {homePromo.discountPct > 0 && (
              <div className="shrink-0 rounded-xl bg-accent-500 px-3 py-2 text-center text-white">
                <p className="text-2xl font-black leading-none">{homePromo.discountPct}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wide">Off</p>
              </div>
            )}
          </div>
        )}

        <span className="btn-cta mt-8 h-16 animate-pulse px-14 text-xl shadow-2xl shadow-black/30">
          {t('startOrder', lang)} <ChevronRight size={24} />
        </span>
        <p className={`mt-4 text-sm ${light ? 'text-white/70' : 'text-slate-400'}`}>{t('touchToBegin', lang)}</p>

        {/* language toggle */}
        <div
          className={`mt-6 inline-flex rounded-xl p-1.5 ${hasMediaBg ? 'bg-white/15 backdrop-blur' : 'border border-sand bg-white shadow-sm'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {(['en', 'hi'] as const).map((l) => (
            <span
              key={l}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setLang(l);
              }}
              className={`flex min-h-[48px] min-w-[110px] items-center justify-center rounded-lg px-5 text-base font-bold ${
                lang === l ? (light ? 'bg-white text-navy' : 'bg-navy text-white') : light ? 'text-white' : 'text-slate-500'
              }`}
            >
              {l === 'en' ? 'English' : 'हिंदी'}
            </span>
          ))}
        </div>
        <p className={`mt-5 text-xs font-medium ${light ? 'text-white/50' : 'text-slate-400'}`}>
          Scran POS · Self-Ordering Kiosk · Kiosk 1 · Cloud POS for Restaurants, Cafés, Hotels &amp; QSR Brands
        </p>
      </div>
    </button>
  );
}

/* ---------------------------------- 2. Main POS screen ---------------------------------- */

function OrderScreen({ onProceed }: { onProceed: (method?: 'card') => void }) {
  const lang = usePosStore((s) => s.lang);
  const menu = usePosStore((s) => s.menu);
  const categories = usePosStore((s) => s.categories);
  const cuisines = usePosStore((s) => s.cuisines);
  const display = usePosStore((s) => s.display);
  const promotions = usePosStore((s) => s.promotions);
  const cart = usePosStore((s) => s.cart);
  const couponCode = usePosStore((s) => s.couponCode);
  const gstRate = usePosStore((s) => s.gstRate);
  const slotConfig = usePosStore((s) => s.slotConfig);
  const supperEnabled = usePosStore((s) => s.supperEnabled);
  const slotOverride = usePosStore((s) => s.slotOverride);
  const tableNumber = usePosStore((s) => s.tableNumber);
  const showToast = usePosStore((s) => s.showToast);

  const layoutMode = display.layoutMode; // 'category' | 'cuisine'
  const groupField: 'category' | 'cuisine' = layoutMode;

  const [tableOpen, setTableOpen] = useState(false);

  const [group, setGroup] = useState<string>('All'); // selected category or cuisine name
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [combosOnly, setCombosOnly] = useState(false);
  const [promoFilter, setPromoFilter] = useState<{ title: string; ids: string[] } | null>(null);
  const [view, setView] = useState<'grid' | 'list'>(display.defaultView);
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // re-evaluate the active meal slot every 30s so the menu flips automatically
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const activeSlot = getActiveSlot(slotConfig, supperEnabled, slotOverride, now);

  // only kiosk-visible items, then the current meal slot
  const slotMenu = useMemo(() => {
    const kioskMenu = menu.filter((m) => m.showOnKiosk);
    return activeSlot ? kioskMenu.filter((m) => m.slots.includes(activeSlot)) : kioskMenu;
  }, [menu, activeSlot]);

  // sidebar groups: visible categories (ordered) or cuisines, limited to those with items in slot
  const groupList = useMemo(() => {
    if (layoutMode === 'cuisine') return cuisines.filter((c) => slotMenu.some((m) => m.cuisine === c));
    return [...categories]
      .filter((c) => c.visible)
      .sort((a, b) => a.order - b.order)
      .map((c) => c.name)
      .filter((name) => slotMenu.some((m) => m.category === name));
  }, [layoutMode, cuisines, categories, slotMenu]);

  const activePromos = useMemo(() => promotions.filter((p) => isPromoActive(p, now)), [promotions, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = slotMenu;
    if (promoFilter) base = base.filter((m) => promoFilter.ids.includes(m.id));
    return base.filter((m) => {
      if (group !== 'All' && m[groupField] !== group) return false;
      if (combosOnly && m.category !== 'Combos') return false;
      if (vegOnly && m.foodType !== 'veg') return false;
      if (bestsellerOnly && !m.bestseller) return false;
      if (availableOnly && !m.available) return false;
      if (
        q &&
        !(
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.cuisine.toLowerCase().includes(q) ||
          m.desc.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [slotMenu, promoFilter, group, groupField, combosOnly, vegOnly, bestsellerOnly, availableOnly, search]);

  const itemCount = cart.reduce((n, l) => n + l.qty, 0);
  const totals = computeTotals(cart, couponCode, gstRate);

  // icon for a sidebar group (category emoji/image, or a generic mark for cuisines)
  const groupIcon = (name: string) => {
    if (layoutMode === 'category') {
      const c = categories.find((cat) => cat.name === name);
      if (c?.image) return <img src={c.image} alt="" className="h-5 w-5 rounded object-contain" />;
      if (c?.icon) return <span className="text-lg leading-none">{c.icon}</span>;
    }
    return <UtensilsCrossed size={19} />;
  };

  const chips = [
    { label: t('vegOnly', lang), icon: <Leaf size={14} />, on: vegOnly, toggle: () => setVegOnly((v) => !v), show: true },
    { label: t('bestseller', lang), icon: <Star size={14} />, on: bestsellerOnly, toggle: () => setBestsellerOnly((v) => !v), show: display.showBestsellers },
    { label: t('available', lang), icon: <CheckCircle2 size={14} />, on: availableOnly, toggle: () => setAvailableOnly((v) => !v), show: true },
    { label: t('combos', lang), icon: <Package size={14} />, on: combosOnly, toggle: () => setCombosOnly((v) => !v), show: display.showCombos },
  ].filter((c) => c.show);

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)_370px] xl:grid-cols-[248px_minmax(0,1fr)_392px]">
      {/* left: logo + categories/cuisines */}
      <aside className="hidden h-full flex-col border-r border-sand bg-white lg:flex">
        <div className="px-5 pb-3 pt-5">
          <ScranLogo size="md" />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {layoutMode === 'cuisine' ? 'By Cuisine' : 'Categories'}
          </p>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
          {(['All', ...groupList] as string[]).map((c) => {
            const active = group === c;
            const count = c === 'All' ? slotMenu.length : slotMenu.filter((m) => m[groupField] === c).length;
            return (
              <button
                key={c}
                onClick={() => setGroup(c)}
                className={`flex min-h-[52px] items-center gap-3 rounded-lg px-3.5 text-left text-[15px] font-semibold transition-colors ${
                  active ? 'bg-brand-100 text-navy' : 'text-slate-500 active:bg-ivory'
                }`}
              >
                <span className={active ? 'text-brand-700' : 'text-slate-400'}>{c === 'All' ? <LayoutGrid size={19} /> : groupIcon(c)}</span>
                <span className="flex-1 truncate">{c}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/70 text-brand-800' : 'bg-ivory text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-sand p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-700">DM</span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-navy">Demo Manager</p>
              <p className="text-[11px] text-slate-400">Kiosk 1 · shift open</p>
            </div>
          </div>
        </div>
      </aside>

      {/* centre: top bar + grid */}
      <section className="flex h-full min-w-0 flex-col">
        <div className="shrink-0 space-y-3 border-b border-sand bg-white p-4 pb-3">
          {/* top bar */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="min-h-[50px] w-full rounded-lg border border-sand bg-ivory/60 pl-11 pr-11 text-[15px] font-medium outline-none focus:border-brand-500 focus:bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 active:bg-ivory"
                >
                  <X size={17} />
                </button>
              )}
            </div>
            <button
              onClick={() => setTableOpen(true)}
              className={`hidden min-h-[50px] items-center gap-2 rounded-lg border px-3.5 text-sm font-bold md:flex ${
                tableNumber ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-sand text-slate-600 active:bg-ivory'
              }`}
            >
              <Armchair size={17} className={tableNumber ? 'text-brand-700' : 'text-slate-400'} /> {tableNumber || 'Select Table'}{' '}
              <ChevronDown size={15} className={tableNumber ? 'text-brand-600' : 'text-slate-400'} />
            </button>
            <button onClick={() => showToast('No new notifications')} aria-label="Notifications" className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-lg border border-sand text-slate-500 active:bg-ivory">
              <Bell size={18} />
            </button>
            <button onClick={() => showToast('Settings — demo')} aria-label="Settings" className="hidden h-[50px] w-[50px] shrink-0 items-center justify-center rounded-lg border border-sand text-slate-500 active:bg-ivory sm:flex">
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* heading + filters + view toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-1 text-lg font-extrabold text-navy">{group === 'All' ? 'All Items' : group}</h2>
            <span
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-xs font-bold ${
                activeSlot ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              <Clock size={13} />
              {activeSlot
                ? `${SLOT_LABELS[activeSlot]} Menu · ${formatHM(slotConfig[activeSlot].start)} – ${formatHM(slotConfig[activeSlot].end)}`
                : 'Outside service hours — full menu preview'}
              {slotOverride !== 'auto' && <span className="font-medium text-slate-400">(manual)</span>}
            </span>
            {/* group strip for small screens */}
            <div className="flex w-full gap-1.5 overflow-x-auto pb-1 lg:hidden">
              {(['All', ...groupList] as string[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setGroup(c)}
                  className={`chip shrink-0 ${group === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-sand bg-white text-slate-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            {chips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.toggle}
                className={`chip ${chip.on ? 'border-brand-600 bg-brand-100 text-brand-800' : 'border-sand bg-white text-slate-500'}`}
              >
                {chip.icon} {chip.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-sm font-semibold text-slate-400 sm:block">
                {filtered.length} {t('items', lang)}
              </span>
              <div className="inline-flex rounded-lg border border-sand p-0.5">
                {(
                  [
                    { id: 'grid', icon: <LayoutGrid size={16} /> },
                    { id: 'list', icon: <List size={16} /> },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    aria-label={`${v.id} view`}
                    className={`flex h-10 w-11 items-center justify-center rounded-md ${view === v.id ? 'bg-ivory text-navy' : 'text-slate-400'}`}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {/* featured offers strip */}
          {display.showFeatured && activePromos.length > 0 && !promoFilter && (
            <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
              {activePromos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.linkedItemIds.length) {
                      setPromoFilter({ title: p.title, ids: p.linkedItemIds });
                      setGroup('All');
                    } else {
                      showToast(`${p.title} — ${p.discountPct}% off`);
                    }
                  }}
                  className="flex min-w-[280px] shrink-0 items-center gap-3 overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-r from-brand-600 to-brand-500 p-3 text-left text-white active:opacity-95"
                >
                  {p.banner ? (
                    <img src={p.banner} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/15 text-2xl">🎉</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{p.title}</p>
                    <p className="truncate text-xs text-white/80">{p.desc}</p>
                  </div>
                  {p.discountPct > 0 && (
                    <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-sm font-black text-brand-700">{p.discountPct}%</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {promoFilter && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5">
              <p className="flex items-center gap-2 text-sm font-bold text-brand-800">
                <Star size={15} fill="currentColor" /> Showing offer: {promoFilter.title}
              </p>
              <button onClick={() => setPromoFilter(null)} className="flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-xs font-bold text-brand-700 active:bg-brand-100">
                <X size={15} /> Clear
              </button>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-sand bg-white text-slate-300">
                <Search size={28} />
              </div>
              <p className="text-base font-bold text-slate-600">{t('noResults', lang)}</p>
              <p className="text-sm text-slate-400">{t('noResultsSub', lang)}</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((item) => (
                <ItemCard key={item.id} item={item} onAdd={setCustomizing} />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => item.available && setCustomizing(item)}
                    disabled={!item.available}
                    className={`card flex w-full items-center gap-3.5 p-3 text-left ${item.available ? 'active:shadow-md' : 'opacity-60'}`}
                  >
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sand/70 bg-white p-1">
                      <FoodImage image={item.image} emoji={item.emoji} name={item.name} emojiClassName="text-3xl" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[15px] font-bold text-navy">
                        <VegDot foodType={item.foodType} size={13} /> {item.name}
                        {item.bestseller && <Star size={13} className="text-accent-500" fill="currentColor" />}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {item.category}
                        {item.cuisine ? ` · ${item.cuisine}` : ''} · {item.desc}
                        {item.allergens.length > 0 && <span className="text-amber-700"> · ⚠ {item.allergens.join(', ')}</span>}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-extrabold text-navy">
                      {inr(effectivePrice(item))}
                      {item.discountPct > 0 && <span className="ml-1 text-xs font-semibold text-slate-400 line-through">{inr(item.price)}</span>}
                    </p>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${item.available ? 'bg-navy text-white' : 'bg-slate-100 text-slate-300'}`}>
                      +
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* floating cart button for < lg screens */}
        {itemCount > 0 && (
          <button onClick={() => setMobileCartOpen(true)} className="btn-cta fixed bottom-5 left-1/2 z-40 h-14 -translate-x-1/2 px-6 shadow-xl lg:hidden">
            <ShoppingCart size={20} /> {itemCount} {t('items', lang)} · {inr(totals.total)}
          </button>
        )}
      </section>

      {/* right: cart */}
      <aside className="hidden h-full min-h-0 border-l border-sand lg:block">
        <CartPanel onProceed={onProceed} />
      </aside>

      {/* mobile cart drawer */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 bg-navy/50 lg:hidden" onClick={() => setMobileCartOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 top-14 overflow-hidden rounded-t-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMobileCartOpen(false)}
              aria-label="Close cart"
              className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-ivory text-slate-600"
            >
              <X size={20} />
            </button>
            <CartPanel
              onProceed={(m) => {
                setMobileCartOpen(false);
                onProceed(m);
              }}
            />
          </div>
        </div>
      )}

      {customizing && <CustomizeModal item={customizing} onClose={() => setCustomizing(null)} />}
      {tableOpen && <TableSelectModal onClose={() => setTableOpen(false)} />}
    </div>
  );
}

/* ---------------------------------- Table selector ---------------------------------- */

function TableSelectModal({ onClose }: { onClose: () => void }) {
  const tableNumber = usePosStore((s) => s.tableNumber);
  const { setTable, setOrderType, showToast } = usePosStore.getState();

  const pick = (t: string) => {
    setTable(t);
    if (t) {
      setOrderType('dine-in'); // choosing a table implies dine-in
      showToast(`${t} selected — order set to dine-in`);
    } else {
      showToast('Table cleared');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy">
            <Armchair size={20} className="text-brand-600" /> Select Table
          </h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 active:bg-ivory">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }, (_, i) => `Table ${i + 1}`).map((t) => (
            <button
              key={t}
              onClick={() => pick(t)}
              className={`flex min-h-[56px] flex-col items-center justify-center rounded-lg border text-sm font-bold ${
                tableNumber === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-sand bg-white text-slate-600 active:bg-ivory'
              }`}
            >
              <Armchair size={16} className={tableNumber === t ? 'text-white' : 'text-slate-300'} />
              {t.replace('Table ', 'T')}
            </button>
          ))}
        </div>
        <button onClick={() => pick('')} className="btn-outline mt-3 h-12 w-full text-sm">
          No table · counter / takeaway order
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- Customer selector ---------------------------------- */

function CustomerModal({ onClose }: { onClose: () => void }) {
  const customerName = usePosStore((s) => s.customerName);
  const { setCustomer, showToast } = usePosStore.getState();
  const [name, setName] = useState(customerName.split(' (')[0] ?? '');
  const [phone, setPhone] = useState('');

  const save = () => {
    const n = name.trim();
    if (!n) {
      showToast('Enter the customer name (or continue as walk-in)');
      return;
    }
    const label = phone.trim() ? `${n} (${phone.trim()})` : n;
    setCustomer(label);
    showToast(`Order tagged to ${n}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy">
            <User size={20} className="text-brand-600" /> Customer Details
          </h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 active:bg-ivory">
            <X size={20} />
          </button>
        </div>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul"
            className="min-h-[50px] w-full rounded-lg border border-sand px-3.5 text-base font-semibold outline-none focus:border-brand-500"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Phone (optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, '').slice(0, 15))}
            inputMode="tel"
            placeholder="98XXXXXXXX"
            className="min-h-[50px] w-full rounded-lg border border-sand px-3.5 text-base font-semibold outline-none focus:border-brand-500"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setCustomer('');
              showToast('Continuing as walk-in customer');
              onClose();
            }}
            className="btn-outline h-12 text-sm"
          >
            Walk-in (no name)
          </button>
          <button onClick={save} className="btn-primary h-12 text-sm">
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- 3. Payment screen ---------------------------------- */

function PaymentScreen({ initialMethod, onBack, onPaid }: { initialMethod: string; onBack: () => void; onPaid: (order: Order) => void }) {
  const lang = usePosStore((s) => s.lang);
  const cart = usePosStore((s) => s.cart);
  const couponCode = usePosStore((s) => s.couponCode);
  const orderType = usePosStore((s) => s.orderType);
  const gstRate = usePosStore((s) => s.gstRate);
  const tableNumber = usePosStore((s) => s.tableNumber);
  const customerName = usePosStore((s) => s.customerName);
  const placeOrder = usePosStore((s) => s.placeOrder);
  const setCustomer = usePosStore((s) => s.setCustomer);

  const [method, setMethod] = useState(PAYMENT_METHODS.find((m) => m.id === initialMethod) ?? PAYMENT_METHODS[0]);
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'failed'>('idle');
  const [customerOpen, setCustomerOpen] = useState(false);

  const totals = computeTotals(cart, couponCode, gstRate);

  // ---- live phone-payment session (real QR, confirmed from the customer's phone) ----
  const sidRef = useRef(uid());
  const paidRef = useRef(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [qrState, setQrState] = useState<'loading' | 'ready' | 'offline'>('loading');

  useEffect(() => {
    if (cart.length === 0) return;
    let cancelled = false;
    // register the full order so the customer's phone can show a review screen
    fetch('/api/pay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sid: sidRef.current,
        amount: totals.total,
        orderType,
        waitMins: maxWaitMins(cart),
        lines: cart.map((l) => ({ name: l.name, qty: l.qty, price: lineTotal(l) })),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.ok) {
          setPayUrl(`${d.lanUrl}/pay?sid=${sidRef.current}`);
          setQrState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setQrState('offline');
      });
    return () => {
      cancelled = true;
    };
    // session is created once for this payment attempt; cart is locked on this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // poll for phone confirmation while UPI is the selected method
  useEffect(() => {
    if (qrState !== 'ready' || method.id !== 'upi') return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/pay/status?sid=${sidRef.current}`);
        const d = await r.json();
        if (d.status === 'paid' && !paidRef.current) {
          paidRef.current = true;
          clearInterval(id);
          const order = placeOrder('UPI QR');
          // push the token + wait time back so the phone shows the confirmation
          fetch(`/api/pay/complete?sid=${sidRef.current}&token=${order.token}&eta=${order.etaMins}`).catch(() => {});
          onPaid(order);
        }
      } catch {
        /* server briefly unreachable — keep polling */
      }
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrState, method.id]);

  const simulateSuccess = () => {
    setStatus('processing');
    setTimeout(() => {
      if (paidRef.current) return;
      paidRef.current = true;
      const label = method.id === 'wallet' && employeeId.trim() ? `${method.label} (${employeeId.trim().toUpperCase()})` : method.label;
      onPaid(placeOrder(label));
    }, 900);
  };

  if (cart.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg font-bold text-slate-600">{t('emptyCartTitle', lang)}</p>
        <button onClick={onBack} className="btn-primary">
          <ArrowLeft size={18} /> {t('backToMenu', lang)}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={onBack} disabled={status === 'processing'} className="btn-outline h-12">
            <ArrowLeft size={18} /> {t('backToMenu', lang)}
          </button>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('amountToPay', lang)}</p>
            <p className="text-3xl font-black text-navy">{inr(totals.total)}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_390px]">
          {/* payment methods + detail */}
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-extrabold text-navy">{t('choosePayment', lang)}</h2>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m);
                    setStatus('idle');
                  }}
                  disabled={status === 'processing'}
                  className={`flex min-h-[92px] flex-col items-start justify-center gap-1.5 rounded-lg border p-4 text-left transition-colors ${
                    method.id === m.id ? 'border-brand-600 bg-brand-50' : 'border-sand bg-white active:bg-ivory'
                  }`}
                >
                  <span className={method.id === m.id ? 'text-brand-700' : 'text-slate-400'}>{m.icon}</span>
                  <span className="text-[15px] font-bold text-navy">{m.label}</span>
                  <span className="text-xs text-slate-500">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* method detail */}
            <div className="mt-5 rounded-lg border border-dashed border-sand bg-ivory/50 p-5">
              {method.id === 'upi' && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-xl border border-sand bg-white p-3 shadow-sm">
                    {qrState === 'ready' && payUrl ? (
                      <QRCanvas value={payUrl} size={196} />
                    ) : qrState === 'loading' ? (
                      <div className="flex h-[196px] w-[196px] items-center justify-center">
                        <RefreshCw size={28} className="animate-spin text-slate-300" />
                      </div>
                    ) : (
                      <MockQR seed={`upi-${totals.total}`} size={196} />
                    )}
                  </div>
                  {qrState === 'ready' ? (
                    <>
                      <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
                        </span>
                        Waiting for payment · scan with your phone camera
                      </p>
                      <p className="text-sm font-semibold text-slate-600">
                        Pay <span className="font-extrabold text-navy">{inr(totals.total)}</span> — confirmation appears here automatically
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Wifi size={13} /> Phone must be on the same Wi-Fi network as this kiosk (demo payment page)
                      </p>
                    </>
                  ) : qrState === 'offline' ? (
                    <p className="text-xs text-slate-400">
                      Live phone-pay service unavailable on this host — use “Simulate Payment Success” below.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Preparing secure payment QR…</p>
                  )}
                </div>
              )}
              {method.id === 'card' && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CreditCard size={44} className="text-navy" />
                  <p className="text-base font-bold text-slate-700">Tap or insert your card on the POS terminal</p>
                  <p className="text-sm text-slate-400">Terminal: SCRAN-POS-01 · waiting for card…</p>
                </div>
              )}
              {method.id === 'cash' && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Banknote size={44} className="text-brand-600" />
                  <p className="text-base font-bold text-slate-700">Pay {inr(totals.total)} at the billing counter</p>
                  <p className="text-sm text-slate-400">Show your token number after ordering. Order is marked unpaid until settled.</p>
                </div>
              )}
              {method.id === 'wallet' && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <Wallet size={40} className="text-navy" />
                  <p className="text-base font-bold text-slate-700">Corporate wallet / employee meal card</p>
                  <input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter Employee ID (e.g. EMP1024)"
                    className="min-h-[52px] w-full max-w-xs rounded-lg border border-sand px-4 text-center text-base font-bold uppercase outline-none placeholder:normal-case placeholder:font-normal focus:border-brand-500"
                  />
                  <p className="text-xs text-slate-400">Wallet balance check is mocked in this demo.</p>
                </div>
              )}
            </div>

            {/* status + simulate buttons */}
            {status === 'failed' && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                <XCircle size={20} /> Payment failed. No amount was charged — please retry.
              </div>
            )}
            {status === 'processing' && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700">
                <RefreshCw size={20} className="animate-spin" /> Processing payment…
              </div>
            )}
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <button onClick={simulateSuccess} disabled={status === 'processing'} className="btn-cta h-14 text-base disabled:opacity-60">
                <CheckCircle2 size={20} /> Simulate Payment Success
              </button>
              <button
                onClick={() => setStatus((s) => (s === 'failed' ? 'idle' : 'failed'))}
                disabled={status === 'processing'}
                className={`btn h-14 text-base ${status === 'failed' ? 'btn-outline' : 'border border-red-200 bg-white text-red-600 active:bg-red-50'}`}
              >
                {status === 'failed' ? (
                  <>
                    <RefreshCw size={20} /> Retry Payment
                  </>
                ) : (
                  <>
                    <XCircle size={20} /> Payment Failed / Retry
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Demo payments — integrates with Razorpay / PhonePe / bank POS terminals in production.
            </p>
          </div>

          {/* order summary */}
          <div className="card h-fit p-5">
            <h3 className="mb-3 text-base font-extrabold text-navy">
              Order Summary{' '}
              <span className="ml-1 rounded-full bg-ivory px-2.5 py-0.5 text-xs font-bold text-slate-500">
                {orderType === 'dine-in' ? t('dineIn', lang) : t('takeaway', lang)}
              </span>
              {tableNumber && <span className="ml-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-800">{tableNumber}</span>}
            </h3>
            <div className="mb-4 rounded-lg border border-sand bg-ivory/50 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700">
                  <User size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Customer</p>
                  <p className="truncate text-sm font-extrabold text-navy">{customerName || 'Walk-in Customer'}</p>
                </div>
                <button
                  onClick={() => setCustomerOpen(true)}
                  disabled={status === 'processing'}
                  className="btn-outline h-11 min-h-[44px] px-3 text-sm disabled:opacity-50"
                >
                  {customerName ? 'Change' : 'Add Name'}
                </button>
                {customerName && (
                  <button
                    onClick={() => setCustomer('')}
                    disabled={status === 'processing'}
                    aria-label="Continue as walk-in customer"
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-sand bg-white text-slate-400 active:bg-ivory disabled:opacity-50"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            </div>
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
              {cart.map((l) => (
                <li key={l.lineId} className="flex items-start justify-between gap-3">
                  <span className="text-slate-600">
                    <span className="font-bold text-navy">{l.qty}×</span> {l.name}
                    {l.addons.length > 0 && <span className="block text-xs text-slate-400">+ {l.addons.map((a) => a.name).join(', ')}</span>}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-700">{inr((l.unitPrice + l.addons.reduce((s, a) => s + a.price, 0)) * l.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-dashed border-sand pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <dt>{t('subtotal', lang)}</dt>
                <dd className="tabular-nums">{inr(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-brand-700">
                  <dt>{t('discount', lang)}</dt>
                  <dd className="tabular-nums">-{inr(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <dt>{t('gst', lang)} ({Math.round(gstRate * 1000) / 10}%)</dt>
                <dd className="tabular-nums">{inr(totals.gst)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-lg font-black text-navy">
                <dt>{t('total', lang)}</dt>
                <dd className="tabular-nums">{inr(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      {customerOpen && <CustomerModal onClose={() => setCustomerOpen(false)} />}
    </div>
  );
}

/* ---------------------------------- 4. Confirmation screen ---------------------------------- */

function ConfirmScreen({ order, onNewOrder }: { order: Order; onNewOrder: () => void }) {
  const lang = usePosStore((s) => s.lang);
  const showToast = usePosStore((s) => s.showToast);

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-4">
      <div className="card w-full max-w-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <CheckCircle2 size={34} />
        </div>
        <p className="text-lg font-extrabold text-brand-700">{t('orderReceived', lang)}</p>
        <p className="mt-1 text-sm text-slate-400">
          Order ID: <span className="font-bold text-slate-600">{order.id}</span> ·{' '}
          {order.orderType === 'dine-in' ? t('dineIn', lang) : t('takeaway', lang)}
          {order.table ? ` · ${order.table}` : ''}
          {order.customerName ? ` · ${order.customerName.split(' (')[0]}` : ''} · {order.paymentMode}
        </p>

        <div className="mx-auto mt-6 w-fit rounded-2xl bg-navy px-14 py-7 text-white shadow-xl shadow-navy/25">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent-300">{t('yourToken', lang)}</p>
          <p className="mt-1 text-7xl font-black tabular-nums tracking-tight">{formatToken(order.token)}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-600">
          <Clock size={18} className="text-brand-600" />
          <p className="text-sm font-semibold">
            {t('estPrep', lang)}: <span className="font-extrabold text-navy">~{order.etaMins} {t('minutes', lang)}</span>
          </p>
        </div>
        <p className="mt-2 text-sm text-slate-400">Paid {inr(order.total)} · Watch the pickup screen for your token</p>

        <div className="mt-7 grid gap-2.5 sm:grid-cols-3">
          <button onClick={() => showToast('Receipt sent to thermal printer (demo)')} className="btn-outline min-h-[52px]">
            <Printer size={18} /> {t('printReceipt', lang)}
          </button>
          <button onClick={() => navigate('pickup')} className="btn-outline min-h-[52px]">
            <TicketCheck size={18} /> {t('viewPickup', lang)}
          </button>
          <button onClick={onNewOrder} className="btn-primary min-h-[52px]">
            {t('newOrder', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
