import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Flame, Lock, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { ScranLogo } from '../components/Shared';
import { formatToken, inr } from '../utils';

interface SessionOrder {
  status: 'pending' | 'paid' | 'done' | 'unknown';
  amount: number;
  orderType: string;
  lines: { name: string; qty: number; price: number }[];
  waitMins: number;
  token: number | null;
}

/**
 * Customer-phone flow, opened by scanning the kiosk QR:
 *   1. review the order (items, total, max wait time)
 *   2. tap Confirm Order
 *   3. see Order Confirmed + token + wait time + status Preparing
 * The kiosk polls the same session, places the order and pushes the token back.
 */
export default function PhonePayView() {
  const query = window.location.search || (window.location.hash.includes('?') ? `?${window.location.hash.split('?')[1]}` : '');
  const params = new URLSearchParams(query);
  const sid = params.get('sid') ?? '';

  const [order, setOrder] = useState<SessionOrder | null>(null);
  const [notFound, setNotFound] = useState(!sid);
  const [state, setState] = useState<'review' | 'confirming' | 'done' | 'error'>('review');
  const [token, setToken] = useState<number | null>(null);
  const [waitMins, setWaitMins] = useState<number>(15);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // load the order for review
  useEffect(() => {
    if (!sid) return;
    fetch(`/api/pay/order?sid=${sid}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: SessionOrder) => {
        setOrder(d);
        setWaitMins(d.waitMins || 15);
        if (d.status === 'done' && d.token) {
          setToken(d.token);
          setState('done');
        } else if (d.status === 'paid') {
          setState('confirming');
        }
      })
      .catch(() => setNotFound(true));
  }, [sid]);

  // after confirming, poll until the kiosk attaches the token
  useEffect(() => {
    if (state !== 'confirming') return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/pay/status?sid=${sid}`);
        const d = await r.json();
        if (d.status === 'done' && d.token) {
          if (d.waitMins) setWaitMins(d.waitMins);
          setToken(d.token);
          setState('done');
          clearInterval(pollRef.current);
        }
      } catch {
        /* keep polling */
      }
    }, 1200);
    return () => clearInterval(pollRef.current);
  }, [state, sid]);

  const confirm = async () => {
    setState('confirming');
    try {
      const r = await fetch(`/api/pay/confirm?sid=${sid}`);
      const d = await r.json();
      if (!d.ok) setState('error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-ivory px-5 py-8">
      <ScranLogo size="lg" />
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Scran Restaurant · Kiosk 1</p>

      <div className="card mt-6 w-full max-w-sm overflow-hidden">
        {notFound ? (
          <div className="p-6 text-center">
            <XCircle size={44} className="mx-auto text-red-400" />
            <p className="mt-3 text-base font-bold text-navy">Order session not found</p>
            <p className="mt-1 text-sm text-slate-400">
              This QR may have expired. Please go back to the kiosk and open the payment screen again.
            </p>
          </div>
        ) : state === 'done' ? (
          /* ---------- 3. confirmed: token + wait time ---------- */
          <div className="p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <CheckCircle2 size={36} />
            </div>
            <p className="mt-4 text-xl font-extrabold text-navy">Order Confirmed</p>
            <p className="mt-1 text-sm text-slate-500">Your order has been sent to the kitchen</p>

            <div className="mx-auto mt-5 w-fit rounded-xl bg-navy px-10 py-5 text-white shadow-lg shadow-navy/20">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent-300">Your token</p>
              <p className="mt-0.5 text-5xl font-black tabular-nums tracking-tight">{token ? formatToken(token) : '—'}</p>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-slate-700">
              <Clock size={16} className="text-brand-600" /> Maximum wait time: {waitMins} minutes
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <Flame size={13} /> Order status: Preparing
            </p>
            <p className="mt-4 text-xs text-slate-400">
              Paid {inr(order?.amount ?? 0)} · Watch the pickup screen for your token number.
            </p>
          </div>
        ) : state === 'confirming' ? (
          /* ---------- waiting for the kiosk to allocate the token ---------- */
          <div className="p-8 text-center">
            <RefreshCw size={36} className="mx-auto animate-spin text-brand-600" />
            <p className="mt-4 text-base font-extrabold text-navy">Confirming your order…</p>
            <p className="mt-1 text-sm text-slate-400">Generating your token number</p>
          </div>
        ) : (
          /* ---------- 1–2. review + confirm ---------- */
          <>
            <div className="border-b border-sand bg-white px-5 py-4">
              <p className="text-sm font-bold text-slate-400">Review your order</p>
              <p className="text-lg font-extrabold capitalize text-navy">{order?.orderType ?? '…'}</p>
            </div>
            <ul className="max-h-56 space-y-2.5 overflow-y-auto px-5 py-4 text-sm">
              {!order ? (
                <li className="py-4 text-center text-slate-400">Loading order…</li>
              ) : (
                order.lines.map((l, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <span className="text-slate-600">
                      <span className="font-bold text-navy">{l.qty}×</span> {l.name}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-700">{inr(l.price)}</span>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-dashed border-sand px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">Total (incl. GST)</span>
                <span className="text-2xl font-black tabular-nums text-navy">{inr(order?.amount ?? 0)}</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Clock size={13} className="text-brand-600" /> Estimated maximum wait: {waitMins} minutes
              </p>
            </div>
            <div className="p-4 pt-1">
              <button onClick={confirm} disabled={!order} className="btn-cta h-14 w-full text-lg disabled:opacity-60">
                <Lock size={18} /> Confirm Order · {inr(order?.amount ?? 0)}
              </button>
              {state === 'error' && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-600">
                  Could not reach the kiosk — check you're on the same Wi-Fi and try again.
                </p>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck size={13} className="text-brand-600" /> Demo flow — replaced by UPI / Razorpay / PhonePe in production
              </p>
            </div>
          </>
        )}
      </div>

      <p className="mt-auto pt-8 text-center text-[11px] text-slate-400">Scran POS · customer order confirmation · no real money moves here</p>
    </div>
  );
}
