import { Flame, Plus, TriangleAlert } from 'lucide-react';
import type { MenuItem } from '../types';
import { FoodImage, VegDot } from './Shared';
import { effectivePrice, inr } from '../utils';
import { t } from '../i18n';
import { usePosStore } from '../store/posStore';

export default function ItemCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  const lang = usePosStore((s) => s.lang);
  const disabled = !item.available;
  const price = effectivePrice(item);
  const discounted = item.discountPct > 0;

  return (
    <button
      onClick={() => !disabled && onAdd(item)}
      disabled={disabled}
      className={`card group relative flex flex-col overflow-hidden p-3 text-left transition-shadow ${
        disabled ? 'opacity-60' : 'active:shadow-md'
      }`}
    >
      {/* realistic food photo — object-contain on the white card, photo carries its own soft shadow */}
      <div className={`relative flex h-32 items-center justify-center rounded-lg bg-white ${disabled ? 'grayscale' : ''}`}>
        <div className="flex h-full w-full max-w-[150px] items-center justify-center p-1.5">
          <FoodImage image={item.image} emoji={item.emoji} name={item.name} emojiClassName="text-[56px] leading-none" />
        </div>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {item.bestseller && (
            <span className="rounded-full bg-accent-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Popular
            </span>
          )}
          {discounted && (
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {item.discountPct}% Off
            </span>
          )}
        </div>
        <span className="absolute right-2 top-2 rounded-md bg-white/90 p-1 shadow-sm">
          <VegDot foodType={item.foodType} size={15} />
        </span>
        {disabled && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60">
            <span className="rounded-full bg-navy/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              {t('outOfStock', lang)}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[15px] font-bold leading-snug text-navy">{item.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span>{item.category}</span>
          {item.cuisine && <span className="text-slate-300">·</span>}
          {item.cuisine && <span>{item.cuisine}</span>}
          {item.spicyLevel > 0 && (
            <span className="inline-flex text-red-500">
              {Array.from({ length: item.spicyLevel }).map((_, i) => (
                <Flame key={i} size={11} fill="currentColor" />
              ))}
            </span>
          )}
        </p>
        {item.allergens.length > 0 && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <TriangleAlert size={12} className="shrink-0" />
            <span className="truncate">Contains {item.allergens.join(', ')}</span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="flex items-baseline gap-1.5 text-lg font-extrabold text-navy">
            {inr(price)}
            {discounted && <span className="text-xs font-semibold text-slate-400 line-through">{inr(item.price)}</span>}
          </p>
          <span
            aria-hidden
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
              disabled ? 'bg-slate-100 text-slate-300' : 'bg-navy text-white group-active:bg-brand-600'
            }`}
          >
            <Plus size={20} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}
