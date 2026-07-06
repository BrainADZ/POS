import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, Clock, Soup } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { formatToken, isToday, timeHM } from '../utils';
import { ScranLogo } from '../components/Shared';

/** Customer-facing token board — light Scran theme per the design reference. */
export default function PickupView() {
  const orders = usePosStore((s) => s.orders);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const today = orders.filter((o) => isToday(o.createdAt));
  const preparing = today.filter((o) => o.status === 'new' || o.status === 'accepted' || o.status === 'preparing');
  const ready = today.filter((o) => o.status === 'ready');
  const collected = today.filter((o) => o.status === 'collected').slice(0, 6);

  return (
    <div className="flex h-full flex-col bg-ivory">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-sand bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <ScranLogo size="md" />
          <div className="border-l border-sand pl-4 leading-tight">
            <p className="text-xl font-extrabold text-navy">Order Status</p>
            <p className="text-sm font-medium text-slate-400">Please watch for your token number</p>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-xl border border-sand bg-white px-4 py-2.5 text-lg font-extrabold tabular-nums text-navy shadow-sm">
          <Clock size={19} className="text-accent-500" /> {timeHM(now)}
        </span>
      </div>

      {/* columns */}
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4 md:gap-5 md:p-5">
        {/* preparing */}
        <section className="card flex min-h-0 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-center gap-2.5 bg-brand-500 py-3.5 text-lg font-extrabold uppercase tracking-wider text-white md:text-xl">
            <Soup size={23} /> Preparing
          </header>
          <div className="flex min-h-0 flex-1 flex-wrap content-start justify-center gap-3 overflow-y-auto p-5">
            {preparing.length === 0 ? (
              <p className="mt-10 text-base font-semibold text-slate-300">No orders in the kitchen</p>
            ) : (
              preparing.map((o) => (
                <div key={o.id} className="flex h-24 min-w-[150px] items-center justify-center rounded-xl border border-sand bg-ivory px-6 md:h-28">
                  <span className="text-5xl font-black tabular-nums tracking-tight text-brand-800 md:text-6xl">{formatToken(o.token)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ready */}
        <section className="card flex min-h-0 flex-col overflow-hidden ring-1 ring-brand-600/40">
          <header className="flex shrink-0 items-center justify-center gap-2.5 bg-brand-700 py-3.5 text-lg font-extrabold uppercase tracking-wider text-white md:text-xl">
            <BellRing size={23} /> Ready for Pickup
          </header>
          <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto p-5">
            {ready.length === 0 ? (
              <p className="mt-10 text-base font-semibold text-slate-300">Nothing ready yet</p>
            ) : (
              ready.map((o, i) =>
                i === 0 ? (
                  /* newest ready order gets the hero treatment */
                  <div key={o.id} className="flex min-h-[120px] w-full max-w-[340px] animate-pulse items-center justify-center rounded-2xl bg-brand-700 px-6 shadow-xl shadow-brand-700/25 md:min-h-[150px]">
                    <span className="text-6xl font-black tabular-nums tracking-tight text-white md:text-7xl">{formatToken(o.token)}</span>
                  </div>
                ) : (
                  <div key={o.id} className="flex h-20 min-w-[170px] items-center justify-center rounded-xl border border-sand bg-ivory px-6">
                    <span className="text-4xl font-black tabular-nums tracking-tight text-brand-800 md:text-5xl">{formatToken(o.token)}</span>
                  </div>
                )
              )
            )}
          </div>
        </section>

        {/* collected */}
        <section className="card flex min-h-0 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-center gap-2.5 bg-sand/70 py-3.5 text-lg font-extrabold uppercase tracking-wider text-slate-500 md:text-xl">
            <CheckCircle2 size={23} /> Collected
          </header>
          <div className="flex min-h-0 flex-1 flex-wrap content-start justify-center gap-3 overflow-y-auto p-5">
            {collected.length === 0 ? (
              <p className="mt-10 text-base font-semibold text-slate-300">—</p>
            ) : (
              collected.map((o) => (
                <div key={o.id} className="flex h-20 min-w-[140px] items-center justify-center rounded-xl border border-sand bg-ivory/70 px-5">
                  <span className="text-4xl font-black tabular-nums tracking-tight text-slate-400 md:text-5xl">{formatToken(o.token)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <p className="shrink-0 border-t border-sand bg-white py-2.5 text-center text-xs font-medium text-slate-400">
        Scran POS Pickup Display <span className="mx-1 text-accent-500">•</span> Updates live as the kitchen changes order status
      </p>
    </div>
  );
}
