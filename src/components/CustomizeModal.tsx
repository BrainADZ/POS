import { useState } from 'react';
import { Flame, Minus, Plus, TriangleAlert, X } from 'lucide-react';
import type { Addon, MenuItem, Variant } from '../types';
import { FoodImage, VegDot } from './Shared';
import { effectivePrice, inr, round2 } from '../utils';
import { SPICE_LEVELS } from '../data/menu';
import { usePosStore } from '../store/posStore';
import { t } from '../i18n';

export default function CustomizeModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const lang = usePosStore((s) => s.lang);
  const addToCart = usePosStore((s) => s.addToCart);
  const showToast = usePosStore((s) => s.showToast);

  const [qty, setQty] = useState(1);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [variant, setVariant] = useState<Variant | null>(item.variants[0] ?? null);
  const [spiceLevel, setSpiceLevel] = useState<string>('Medium');
  const [note, setNote] = useState('');

  const discounted = item.discountPct > 0;
  // variant sets the base price; per-item discount then applies to it
  const basePrice = variant ? variant.price : item.price;
  const unitPrice = discounted ? Math.round(basePrice * (1 - item.discountPct / 100)) : basePrice;
  const addonSum = addons.reduce((s, a) => s + a.price, 0);
  const total = round2((unitPrice + addonSum) * qty);

  const toggleAddon = (a: Addon) =>
    setAddons((cur) => (cur.some((x) => x.name === a.name) ? cur.filter((x) => x.name !== a.name) : [...cur, a]));

  const confirm = () => {
    addToCart({
      itemId: item.id,
      name: variant ? `${item.name} (${variant.name})` : item.name,
      image: item.image,
      emoji: item.emoji,
      veg: item.veg,
      foodType: item.foodType,
      unitPrice,
      qty,
      addons,
      variant: variant?.name,
      prepMins: item.prepMins,
      spiceLevel: item.spice ? spiceLevel : undefined,
      note: note.trim() || undefined,
    });
    showToast(`${item.name} × ${qty} added to order`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="relative flex h-40 shrink-0 items-center justify-center bg-white pt-2">
          <div className="flex h-full w-full max-w-[170px] items-center justify-center p-2">
            <FoodImage image={item.image} emoji={item.emoji} name={item.name} emojiClassName="text-7xl" />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow active:bg-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <VegDot foodType={item.foodType} />
                <h2 className="text-xl font-extrabold text-slate-900">{item.name}</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
            <p className="flex items-baseline gap-1.5 text-xl font-extrabold text-navy">
              {inr(unitPrice)}
              {discounted && <span className="text-sm font-semibold text-slate-400 line-through">{inr(basePrice)}</span>}
            </p>
          </div>

          {/* variants */}
          {item.variants.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Choose an option</p>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => {
                  const on = variant?.name === v.name;
                  return (
                    <button
                      key={v.name}
                      onClick={() => setVariant(v)}
                      className={`chip ${on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      {v.name}
                      <span className={`text-xs font-bold ${on ? 'text-brand-600' : 'text-slate-400'}`}>
                        {inr(discounted ? Math.round(v.price * (1 - item.discountPct / 100)) : v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* allergy caution */}
          {item.allergens.length > 0 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <TriangleAlert size={17} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-[13px] font-semibold leading-snug text-amber-800">
                {t('allergyNote', lang)}: <span className="capitalize">{item.allergens.join(', ')}</span>.{' '}
                <span className="font-medium">{t('allergyStaff', lang)}</span>
              </p>
            </div>
          )}

          {/* quantity */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{t('quantity', lang)}</p>
            <div className="inline-flex items-center gap-4 rounded-2xl border-2 border-slate-200 p-1.5">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200"
              >
                <Minus size={20} strokeWidth={3} />
              </button>
              <span className="w-8 text-center text-2xl font-extrabold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                aria-label="Increase quantity"
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white active:bg-brand-700"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* add-ons */}
          {item.addons.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{t('addons', lang)}</p>
              <div className="flex flex-wrap gap-2">
                {item.addons.map((a) => {
                  const on = addons.some((x) => x.name === a.name);
                  return (
                    <button
                      key={a.name}
                      onClick={() => toggleAddon(a)}
                      className={`chip ${on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      {a.name}
                      <span className={`text-xs font-bold ${on ? 'text-brand-600' : 'text-slate-400'}`}>
                        {a.price > 0 ? `+${inr(a.price)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* spice level */}
          {item.spice && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{t('spiceLevel', lang)}</p>
              <div className="grid grid-cols-3 gap-2">
                {SPICE_LEVELS.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setSpiceLevel(s)}
                    className={`chip justify-center ${
                      spiceLevel === s ? 'border-accent-600 bg-red-50 text-accent-600' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {Array.from({ length: i + 1 }).map((_, j) => (
                      <Flame key={j} size={14} fill={spiceLevel === s ? 'currentColor' : 'none'} />
                    ))}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* special instructions */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{t('specialInstructions', lang)}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('notePlaceholder', lang)}
              rows={2}
              maxLength={120}
              className="w-full resize-none rounded-xl border-2 border-slate-200 p-3 text-base outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 border-t border-slate-100 p-4">
          <button onClick={confirm} className="btn-primary h-14 w-full text-lg">
            {t('addToOrder', lang)} · {inr(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
