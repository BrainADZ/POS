import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCheck, ChefHat, CircleCheck, Clock, Flame, Inbox, Timer } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import type { Order } from '../types';
import { formatToken, inr, isToday, minsSince, timeHM } from '../utils';
import { EmptyState, StatusPill, VegDot } from '../components/Shared';

const DELAY_MINUTES = 10;

export default function KitchenView() {
  const orders = usePosStore((s) => s.orders);
  const [now, setNow] = useState(Date.now());

  // refresh elapsed times + delay highlighting every 15s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const today = orders.filter((o) => isToday(o.createdAt));
  const cols: { title: string; icon: React.ReactNode; accent: string; orders: Order[]; empty: string }[] = [
    {
      title: 'New Orders',
      icon: <Inbox size={20} />,
      accent: 'border-t-brand-600',
      orders: today.filter((o) => o.status === 'new' || o.status === 'accepted'),
      empty: 'No new orders — waiting for the kiosk',
    },
    {
      title: 'Preparing',
      icon: <Flame size={20} />,
      accent: 'border-t-amber-500',
      orders: today.filter((o) => o.status === 'preparing'),
      empty: 'Nothing on the stove yet',
    },
    {
      title: 'Ready',
      icon: <CircleCheck size={20} />,
      accent: 'border-t-emerald-500',
      orders: today.filter((o) => o.status === 'ready'),
      empty: 'No orders waiting for pickup',
    },
  ];

  return (
    <div className="flex h-full flex-col bg-ivory">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-sand bg-white px-4 py-3">
        <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <ChefHat size={22} className="text-brand-600" /> Kitchen Display System
          <span className="ml-1 hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 sm:inline-flex">● LIVE</span>
        </h1>
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <span>
            {cols[0].orders.length} new · {cols[1].orders.length} preparing · {cols[2].orders.length} ready
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 tabular-nums">
            <Clock size={15} /> {timeHM(now)}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-3 md:overflow-hidden">
        {cols.map((col) => (
          <section key={col.title} className={`card flex min-h-[200px] flex-col overflow-hidden border-t-4 ${col.accent}`}>
            <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
                {col.icon} {col.title}
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-extrabold tabular-nums text-slate-600">{col.orders.length}</span>
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {col.orders.length === 0 ? (
                <EmptyState icon={<Inbox size={26} />} title={col.empty} />
              ) : (
                col.orders.map((o) => <KitchenCard key={o.id} order={o} now={now} />)
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function KitchenCard({ order, now }: { order: Order; now: number }) {
  const setOrderStatus = usePosStore((s) => s.setOrderStatus);
  const showToast = usePosStore((s) => s.showToast);
  const age = minsSince(order.createdAt, now);
  const delayed = age >= DELAY_MINUTES && order.status !== 'ready' && order.status !== 'collected';

  const advance = (status: Order['status'], msg: string) => {
    setOrderStatus(order.id, status);
    showToast(msg);
  };

  return (
    <article className={`rounded-2xl border-2 bg-white p-3.5 shadow-sm ${delayed ? 'border-red-300 bg-red-50/60' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-black tabular-nums text-slate-900">{formatToken(order.token)}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Timer size={13} /> {timeHM(order.createdAt)} · {age} min ago
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {delayed && <StatusPill label="Delayed" tone="red" />}
          <StatusPill label={order.table ?? (order.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway')} tone={order.table ? 'blue' : 'slate'} />
          {order.customerName && <span className="text-xs font-bold text-slate-500">{order.customerName.split(' (')[0]}</span>}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 border-t border-dashed border-slate-200 pt-2.5">
        {order.lines.map((l) => (
          <li key={l.lineId} className="text-sm">
            <span className="flex items-center gap-2">
              <span className="min-w-[30px] rounded-md bg-slate-900 px-1.5 py-0.5 text-center text-xs font-black text-white">{l.qty}×</span>
              <VegDot veg={l.veg} size={13} />
              <span className="font-bold text-slate-800">{l.name}</span>
            </span>
            {(l.addons.length > 0 || l.spiceLevel || l.note) && (
              <span className="ml-[38px] block text-xs text-slate-500">
                {[l.spiceLevel, ...l.addons.map((a) => a.name), l.note && `“${l.note}”`].filter(Boolean).join(' · ')}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5">
        <span className="text-xs font-semibold text-slate-400">
          {order.paymentMode} · {inr(order.total)}
        </span>
        <div className="flex gap-2">
          {order.status === 'new' && (
            <button onClick={() => advance('accepted', `${formatToken(order.token)} accepted`)} className="btn-primary h-12 px-4 text-sm">
              Accept
            </button>
          )}
          {order.status === 'accepted' && (
            <button onClick={() => advance('preparing', `${formatToken(order.token)} is being prepared`)} className="btn h-12 bg-amber-500 px-4 text-sm text-white active:bg-amber-600">
              <Flame size={16} /> Mark Preparing
            </button>
          )}
          {order.status === 'preparing' && (
            <button onClick={() => advance('ready', `${formatToken(order.token)} is ready for pickup`)} className="btn h-12 bg-emerald-600 px-4 text-sm text-white active:bg-emerald-700">
              <CircleCheck size={16} /> Mark Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button onClick={() => advance('collected', `${formatToken(order.token)} collected`)} className="btn-outline h-12 px-4 text-sm">
              <CheckCheck size={16} /> Mark Collected
            </button>
          )}
        </div>
      </div>

      {order.status === 'new' && delayed && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-600">
          <AlertTriangle size={14} /> Waiting {age} min without being accepted
        </p>
      )}
    </article>
  );
}
