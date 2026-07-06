import { useState } from 'react';
import {
  ArrowRight, BadgePercent, CreditCard, Minus, MoreHorizontal, PauseCircle, Plus, Printer,
  ShoppingCart, SplitSquareHorizontal, Tag, Trash2, X,
} from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { computeTotals, discountLabel, inr, lineTotal } from '../utils';
import { EmptyState, FoodImage, VegDot } from './Shared';
import DiscountModal from './DiscountModal';
import { t } from '../i18n';

export default function CartPanel({ onProceed }: { onProceed: (method?: 'card') => void }) {
  const lang = usePosStore((s) => s.lang);
  const cart = usePosStore((s) => s.cart);
  const orderType = usePosStore((s) => s.orderType);
  const couponCode = usePosStore((s) => s.couponCode);
  const gstRate = usePosStore((s) => s.gstRate);
  const { setOrderType, updateLineQty, removeLine, clearCart, setCoupon, showToast } = usePosStore.getState();

  const [discountOpen, setDiscountOpen] = useState(false);
  const totals = computeTotals(cart, couponCode, gstRate);
  const itemCount = cart.reduce((n, l) => n + l.qty, 0);
  const empty = cart.length === 0;

  const actions = [
    { label: 'Discount', icon: <BadgePercent size={17} />, run: () => setDiscountOpen(true) },
    { label: 'Print Bill', icon: <Printer size={17} />, run: () => showToast('Bill sent to printer (demo)') },
    { label: 'Split Bill', icon: <SplitSquareHorizontal size={17} />, run: () => showToast('Split bill — available in full POS') },
    { label: 'More', icon: <MoreHorizontal size={17} />, run: () => showToast('More order actions (demo)') },
  ];

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      {/* header */}
      <div className="shrink-0 border-b border-sand p-4 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-navy">
            {t('currentOrder', lang)}
            <span className="ml-2 rounded-full bg-ivory px-2.5 py-1 align-middle text-xs font-bold text-slate-500">
              {itemCount} {t('items', lang)}
            </span>
          </h2>
          <button
            onClick={() => showToast(empty ? 'Nothing to hold yet' : 'Order held — retrieve from POS (demo)')}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-sand px-3 text-xs font-bold text-slate-600 active:bg-ivory"
          >
            <PauseCircle size={16} /> Hold Order
          </button>
        </div>
        {/* order type toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-ivory p-1">
          {(['dine-in', 'takeaway'] as const).map((typ) => (
            <button
              key={typ}
              onClick={() => setOrderType(typ)}
              className={`flex min-h-[46px] items-center justify-center rounded-md text-sm font-bold transition-colors ${
                orderType === typ ? 'bg-white text-navy shadow-sm' : 'text-slate-500'
              }`}
            >
              {typ === 'dine-in' ? t('dineIn', lang) : t('takeaway', lang)}
            </button>
          ))}
        </div>
      </div>

      {/* lines */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {empty ? (
          <EmptyState icon={<ShoppingCart size={28} />} title={t('emptyCartTitle', lang)} sub={t('emptyCartSub', lang)} />
        ) : (
          <ul className="space-y-2.5">
            {cart.map((line) => (
              <li key={line.lineId} className="rounded-lg border border-sand bg-white p-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sand/70 bg-white p-0.5">
                    <FoodImage image={line.image} emoji={line.emoji} name={line.name} emojiClassName="text-xl" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-navy">
                      <VegDot veg={line.veg} foodType={line.foodType} size={13} /> {line.name}
                    </p>
                    {(line.addons.length > 0 || line.spiceLevel || line.note) && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                        {[line.spiceLevel, ...line.addons.map((a) => a.name), line.note].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-extrabold tabular-nums text-navy">{inr(lineTotal(line))}</p>
                </div>
                <div className="mt-2 flex items-center justify-between pl-14">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-sand p-0.5">
                    <button
                      onClick={() => updateLineQty(line.lineId, -1)}
                      aria-label="Decrease quantity"
                      className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 active:bg-ivory"
                    >
                      <Minus size={15} strokeWidth={2.5} />
                    </button>
                    <span className="w-5 text-center text-sm font-extrabold tabular-nums">{line.qty}</span>
                    <button
                      onClick={() => updateLineQty(line.lineId, 1)}
                      aria-label="Increase quantity"
                      className="flex h-10 w-10 items-center justify-center rounded-md bg-navy text-white active:bg-brand-600"
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeLine(line.lineId)}
                    aria-label={`Remove ${line.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 active:bg-red-50 active:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* billing + actions */}
      <div className="shrink-0 border-t border-sand p-4">
        {couponCode && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-bold text-brand-700">
              <Tag size={14} /> {discountLabel(couponCode)} applied
            </span>
            <button onClick={() => setCoupon(null)} aria-label="Remove discount" className="flex h-9 w-9 items-center justify-center rounded-md text-brand-700 active:bg-brand-100">
              <X size={15} />
            </button>
          </div>
        )}

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <dt>{t('subtotal', lang)}</dt>
            <dd className="font-semibold tabular-nums">{inr(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-brand-700">
              <dt>{t('discount', lang)}</dt>
              <dd className="font-semibold tabular-nums">-{inr(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <dt>{t('gst', lang)} ({Math.round(gstRate * 1000) / 10}%)</dt>
            <dd className="font-semibold tabular-nums">{inr(totals.gst)}</dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-sand pt-2 text-lg font-extrabold text-navy">
            <dt>{t('total', lang)}</dt>
            <dd className="tabular-nums">{inr(totals.total)}</dd>
          </div>
        </dl>

        {/* action buttons */}
        <div className="mt-3.5 grid grid-cols-4 gap-1.5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.run}
              className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg border border-sand text-[10px] font-bold text-slate-600 active:bg-ivory"
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onProceed()}
          disabled={empty}
          className={`mt-3 h-14 w-full justify-between px-5 text-base ${empty ? 'btn bg-ivory text-slate-400' : 'btn-cta'}`}
        >
          <span className="font-extrabold tabular-nums">{inr(totals.total)}</span>
          <span className="flex items-center gap-2">
            Checkout <ArrowRight size={20} />
          </span>
        </button>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <button onClick={() => !empty && onProceed('card')} disabled={empty} className="btn-outline h-12 text-sm disabled:opacity-50">
            <CreditCard size={17} /> Card Payment
          </button>
          <button
            onClick={() => {
              if (!empty) {
                clearCart();
                showToast('Cart cleared');
              }
            }}
            aria-label={t('clearCart', lang)}
            className="btn-outline h-12 w-12 px-0 text-slate-400"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {discountOpen && <DiscountModal onClose={() => setDiscountOpen(false)} />}
    </aside>
  );
}
