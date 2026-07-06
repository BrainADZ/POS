import { useMemo, useState } from 'react';
import {
  BarChart3, ChefHat, ClipboardList, Clock, CreditCard, History, IndianRupee, LayoutDashboard,
  Lock, LogOut, Megaphone, MonitorCheck, MonitorPlay, Package, ReceiptText, RotateCcw, Settings, ShieldCheck,
  ShoppingBag, Store, TrendingUp, Trophy, UtensilsCrossed, Wifi,
} from 'lucide-react';
import { ADMIN_EMAIL, usePosStore } from '../store/posStore';
import type { MealSlot, Order } from '../types';
import { ALL_SLOTS, formatHM, formatToken, getActiveSlot, inr, isToday, lineTotal, round2, SLOT_LABELS, timeHM } from '../utils';
import { EmptyState, ScranLogo, StatusPill } from '../components/Shared';
import MenuManager from '../components/admin/MenuManager';
import PromotionsManager from '../components/admin/PromotionsManager';

type Tab = 'dashboard' | 'menu' | 'promotions' | 'orders' | 'reports' | 'devices' | 'settings';

const STATUS_TONE: Record<Order['status'], { label: string; tone: 'blue' | 'amber' | 'green' | 'slate' | 'red' }> = {
  new: { label: 'New', tone: 'blue' },
  accepted: { label: 'Accepted', tone: 'blue' },
  preparing: { label: 'Preparing', tone: 'amber' },
  ready: { label: 'Ready', tone: 'green' },
  collected: { label: 'Collected', tone: 'slate' },
};

export default function AdminView() {
  const adminLoggedIn = usePosStore((s) => s.adminLoggedIn);
  return adminLoggedIn ? <AdminShell /> : <LoginScreen />;
}

/* ---------------------------------- Login ---------------------------------- */

function LoginScreen() {
  const login = usePosStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email, password)) setError(true);
  };

  return (
    <div className="flex h-full items-center justify-center bg-ivory p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <ScranLogo size="lg" className="mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Cloud POS for Restaurants, Cafés, Hotels &amp; QSR Brands</p>
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-sm font-bold text-slate-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@scran.app"
            autoComplete="username"
            className="h-13 min-h-[52px] w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none focus:border-brand-500"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-bold text-slate-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-13 min-h-[52px] w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none focus:border-brand-500"
          />
        </label>

        {error && (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600">
            Invalid credentials — use the demo login below.
          </p>
        )}

        <button type="submit" className="btn-primary h-13 min-h-[52px] w-full">
          <Lock size={18} /> Sign in
        </button>

        <div className="mt-5 rounded-xl bg-slate-50 p-3.5 text-center text-sm text-slate-500">
          <p className="font-bold text-slate-600">Demo credentials</p>
          <p className="mt-0.5 font-mono text-[13px]">{ADMIN_EMAIL} · admin123</p>
        </div>
      </form>
    </div>
  );
}

/* ---------------------------------- Shell + tabs ---------------------------------- */

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'menu', label: 'Food & Menu', icon: <UtensilsCrossed size={18} /> },
  { id: 'promotions', label: 'Ads & Promotions', icon: <Megaphone size={18} /> },
  { id: 'orders', label: 'Order History', icon: <History size={18} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { id: 'devices', label: 'Devices', icon: <MonitorCheck size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

function AdminShell() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const logout = usePosStore((s) => s.logout);
  const resetDemoData = usePosStore((s) => s.resetDemoData);
  const showToast = usePosStore((s) => s.showToast);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex h-full flex-col bg-ivory lg:flex-row">
      {/* side nav */}
      <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2.5 lg:w-60 lg:flex-col lg:border-b-0 lg:border-r lg:p-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex min-h-[48px] shrink-0 items-center gap-2.5 rounded-xl px-4 text-sm font-bold transition-colors lg:w-full ${
              tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-600 active:bg-slate-100'
            }`}
          >
            {t.icon} <span className="whitespace-nowrap">{t.label}</span>
          </button>
        ))}
        <div className="lg:mt-auto lg:space-y-1.5">
          {confirmReset ? (
            <div className="flex shrink-0 gap-1.5 lg:flex-col">
              <button
                onClick={() => {
                  resetDemoData();
                  setConfirmReset(false);
                  showToast('Demo data reset');
                }}
                className="btn-danger min-h-[48px] px-4 text-sm lg:w-full"
              >
                Confirm reset
              </button>
              <button onClick={() => setConfirmReset(false)} className="btn-outline min-h-[48px] px-4 text-sm lg:w-full">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex min-h-[48px] shrink-0 items-center gap-2.5 rounded-xl px-4 text-sm font-bold text-slate-500 active:bg-slate-100 lg:w-full"
            >
              <RotateCcw size={18} /> <span className="whitespace-nowrap">Reset Demo Data</span>
            </button>
          )}
          <button
            onClick={logout}
            className="flex min-h-[48px] shrink-0 items-center gap-2.5 rounded-xl px-4 text-sm font-bold text-accent-600 active:bg-red-50 lg:w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'menu' && <MenuManager />}
        {tab === 'promotions' && <PromotionsManager />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'devices' && <DevicesTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

/* ---------------------------------- Dashboard ---------------------------------- */

function useTodayStats() {
  const orders = usePosStore((s) => s.orders);
  return useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt));
    const revenue = round2(today.reduce((s, o) => s + o.total, 0));
    const aov = today.length ? round2(revenue / today.length) : 0;
    const pending = today.filter((o) => o.status === 'new' || o.status === 'accepted' || o.status === 'preparing');
    const qtyByItem = new Map<string, number>();
    today.forEach((o) => o.lines.forEach((l) => qtyByItem.set(l.name, (qtyByItem.get(l.name) ?? 0) + l.qty)));
    const best = [...qtyByItem.entries()].sort((a, b) => b[1] - a[1])[0];
    return { today, revenue, aov, pending, best };
  }, [orders]);
}

function DashboardTab() {
  const { today, revenue, aov, pending, best } = useTodayStats();

  const cards = [
    { label: "Today's Orders", value: String(today.length), sub: `${today.filter((o) => o.status === 'collected').length} completed`, icon: <ShoppingBag size={22} />, cls: 'bg-brand-600' },
    { label: 'Revenue', value: inr(revenue), sub: 'incl. GST, after discounts', icon: <IndianRupee size={22} />, cls: 'bg-emerald-600' },
    { label: 'Average Order Value', value: today.length ? inr(aov) : '—', sub: `${today.length || 'no'} orders today`, icon: <TrendingUp size={22} />, cls: 'bg-amber-500' },
    { label: 'Best-Selling Item', value: best ? best[0] : '—', sub: best ? `${best[1]} sold today` : 'no sales yet', icon: <Trophy size={22} />, cls: 'bg-accent-600', small: true },
    { label: 'Pending Kitchen Orders', value: String(pending.length), sub: pending.length ? `oldest: ${formatToken(pending[pending.length - 1].token)}` : 'kitchen is clear', icon: <ChefHat size={22} />, cls: 'bg-slate-700' },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-extrabold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-start gap-3.5 p-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${c.cls}`}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{c.label}</p>
              <p className={`truncate font-black text-slate-900 ${c.small ? 'text-lg leading-snug' : 'text-2xl'}`}>{c.value}</p>
              <p className="truncate text-xs font-medium text-slate-400">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* recent orders + live devices */}
      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden">
          <h2 className="border-b border-slate-100 px-4 py-3 text-base font-extrabold text-slate-800">Recent Orders</h2>
          {today.length === 0 ? (
            <EmptyState icon={<ReceiptText size={26} />} title="No orders yet today" sub="Place an order from the Kiosk tab to see it here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {today.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-16 text-base font-black tabular-nums text-brand-700">{formatToken(o.token)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-700">
                      {o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {timeHM(o.createdAt)} · {o.paymentMode} · {o.orderType}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold tabular-nums text-slate-800">{inr(o.total)}</span>
                  <StatusPill label={STATUS_TONE[o.status].label} tone={STATUS_TONE[o.status].tone} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card h-fit p-4">
          <h2 className="mb-3 text-base font-extrabold text-slate-800">Device Health</h2>
          <DeviceList compact />
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ on, onToggle, labelOn, labelOff }: { on: boolean; onToggle: () => void; labelOn: string; labelOff: string }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={`flex h-11 min-w-[130px] items-center gap-2 rounded-full border-2 px-1.5 transition-colors ${
        on ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-100'
      }`}
    >
      <span className={`h-7 w-7 rounded-full shadow transition-transform ${on ? 'translate-x-0 bg-emerald-500' : 'bg-white'}`} />
      <span className={`text-xs font-bold ${on ? 'text-emerald-700' : 'text-slate-400'}`}>{on ? labelOn : labelOff}</span>
    </button>
  );
}

/* ---------------------------------- Order history ---------------------------------- */

function OrdersTab() {
  const orders = usePosStore((s) => s.orders);
  const [scope, setScope] = useState<'today' | 'all'>('today');
  const list = scope === 'today' ? orders.filter((o) => isToday(o.createdAt)) : orders;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-900">Order History</h1>
        <ScopeToggle scope={scope} setScope={setScope} />
      </div>
      <div className="card overflow-x-auto">
        {list.length === 0 ? (
          <EmptyState icon={<ClipboardList size={26} />} title="No orders in this period" sub="Orders placed on the kiosk appear here instantly." />
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5">Token</th>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Payment</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-black tabular-nums text-brand-700">{formatToken(o.token)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{o.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{timeHM(o.createdAt)}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 font-semibold text-slate-700">
                    {o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-500">
                    {o.orderType}
                    {(o.table || o.customerName) && (
                      <span className="block text-xs normal-case text-slate-400">
                        {[o.table, o.customerName?.split(' (')[0]].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{o.paymentMode}</td>
                  <td className="px-4 py-3 text-right font-extrabold tabular-nums text-slate-800">{inr(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusPill label={STATUS_TONE[o.status].label} tone={STATUS_TONE[o.status].tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ScopeToggle({ scope, setScope }: { scope: 'today' | 'all'; setScope: (s: 'today' | 'all') => void }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {(['today', 'all'] as const).map((s) => (
        <button
          key={s}
          onClick={() => setScope(s)}
          className={`min-h-[44px] rounded-lg px-4 text-sm font-bold capitalize ${scope === s ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
        >
          {s === 'today' ? 'Today' : 'All time'}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Reports ---------------------------------- */

function ReportsTab() {
  const orders = usePosStore((s) => s.orders);
  const menu = usePosStore((s) => s.menu);
  const [scope, setScope] = useState<'today' | 'all'>('today');

  const data = useMemo(() => {
    const list = scope === 'today' ? orders.filter((o) => isToday(o.createdAt)) : orders;
    const byItem = new Map<string, { qty: number; revenue: number }>();
    const byCategory = new Map<string, number>();
    const byPayment = new Map<string, { count: number; revenue: number }>();
    const byHour = Array.from({ length: 24 }, () => 0);

    list.forEach((o) => {
      o.lines.forEach((l) => {
        const cur = byItem.get(l.name) ?? { qty: 0, revenue: 0 };
        cur.qty += l.qty;
        cur.revenue = round2(cur.revenue + lineTotal(l));
        byItem.set(l.name, cur);
        const cat = menu.find((m) => m.id === l.itemId)?.category ?? 'Other';
        byCategory.set(cat, round2((byCategory.get(cat) ?? 0) + lineTotal(l)));
      });
      const mode = o.paymentMode.split(' (')[0];
      const p = byPayment.get(mode) ?? { count: 0, revenue: 0 };
      p.count += 1;
      p.revenue = round2(p.revenue + o.total);
      byPayment.set(mode, p);
      byHour[new Date(o.createdAt).getHours()] += 1;
    });

    return {
      count: list.length,
      items: [...byItem.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8),
      categories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
      payments: [...byPayment.entries()].sort((a, b) => b[1].count - a[1].count),
      byHour,
    };
  }, [orders, menu, scope]);

  const maxItemRev = Math.max(1, ...data.items.map(([, v]) => v.revenue));
  const maxCatRev = Math.max(1, ...data.categories.map(([, v]) => v));
  const maxHour = Math.max(1, ...data.byHour);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-900">Reports</h1>
        <ScopeToggle scope={scope} setScope={setScope} />
      </div>

      {data.count === 0 ? (
        <div className="card">
          <EmptyState icon={<BarChart3 size={26} />} title="No sales data in this period" sub="Reports build up as orders are placed on the kiosk." />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {/* sales by item */}
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-800">
              <Package size={18} className="text-brand-600" /> Sales by Item
            </h2>
            <ul className="space-y-2.5">
              {data.items.map(([name, v]) => (
                <li key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold text-slate-700">{name}</span>
                    <span className="font-semibold tabular-nums text-slate-500">
                      {v.qty} sold · {inr(v.revenue)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${(v.revenue / maxItemRev) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* sales by category */}
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-800">
              <UtensilsCrossed size={18} className="text-accent-600" /> Sales by Category
            </h2>
            <ul className="space-y-2.5">
              {data.categories.map(([cat, rev]) => (
                <li key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold text-slate-700">{cat}</span>
                    <span className="font-semibold tabular-nums text-slate-500">{inr(rev)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-accent-500" style={{ width: `${(rev / maxCatRev) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* payment split */}
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-800">
              <CreditCard size={18} className="text-emerald-600" /> Payment Mode Split
            </h2>
            <ul className="space-y-3">
              {data.payments.map(([mode, v]) => {
                const pct = Math.round((v.count / data.count) * 100);
                return (
                  <li key={mode}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-bold text-slate-700">{mode}</span>
                      <span className="font-semibold tabular-nums text-slate-500">
                        {v.count} orders · {pct}% · {inr(v.revenue)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* hourly volume */}
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-800">
              <BarChart3 size={18} className="text-amber-500" /> Hourly Order Volume
            </h2>
            <div className="flex h-40 items-end gap-1">
              {data.byHour.map((n, h) => (
                <div key={h} className="flex flex-1 flex-col items-center gap-1" title={`${h}:00 — ${n} orders`}>
                  <span className={`text-[10px] font-bold tabular-nums ${n > 0 ? 'text-slate-500' : 'text-transparent'}`}>{n}</span>
                  <div
                    className={`w-full rounded-t ${n > 0 ? 'bg-amber-400' : 'bg-slate-100'}`}
                    style={{ height: `${Math.max(4, (n / maxHour) * 100)}%` }}
                  />
                  <span className={`text-[9px] font-semibold text-slate-400 ${h % 3 === 0 ? '' : 'invisible'}`}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Devices ---------------------------------- */

const DEVICES = [
  { name: 'Kiosk 1', detail: 'Self-ordering kiosk · Android 11 · v1.0.0', icon: <Store size={22} />, uptime: '6h 24m' },
  { name: 'Kitchen Display', detail: 'KDS screen · Chrome kiosk mode · v1.0.0', icon: <ChefHat size={22} />, uptime: '6h 22m' },
  { name: 'Pickup Screen', detail: 'Token display · 43" FHD panel · v1.0.0', icon: <MonitorPlay size={22} />, uptime: '6h 21m' },
];

function DeviceList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? 'space-y-2.5' : 'grid gap-4 md:grid-cols-3'}>
      {DEVICES.map((d) => (
        <li key={d.name} className={compact ? 'flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3' : 'card flex items-start gap-4 p-5'}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{d.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
              {d.name}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Online
              </span>
            </p>
            {!compact && <p className="mt-0.5 text-xs text-slate-400">{d.detail}</p>}
            <p className="mt-0.5 text-xs font-medium text-slate-400">Uptime {d.uptime} · last heartbeat just now</p>
          </div>
          <Wifi size={18} className="shrink-0 text-emerald-500" />
        </li>
      ))}
    </ul>
  );
}

function DevicesTab() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold text-slate-900">Device Monitoring</h1>
      <p className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
        <ShieldCheck size={16} className="text-emerald-500" /> Mock monitoring — in production this reads device heartbeats via the Scran device agent.
      </p>
      <DeviceList />
    </div>
  );
}

/* ---------------------------------- Settings: meal slots, tax ---------------------------------- */

function SettingsTab() {
  const slotConfig = usePosStore((s) => s.slotConfig);
  const supperEnabled = usePosStore((s) => s.supperEnabled);
  const slotOverride = usePosStore((s) => s.slotOverride);
  const gstRate = usePosStore((s) => s.gstRate);
  const { updateSlotWindow, setSupperEnabled, setSlotOverride, setGstRate, showToast } = usePosStore.getState();
  const [gstInput, setGstInput] = useState(String(Math.round(gstRate * 1000) / 10));

  const activeSlot = getActiveSlot(slotConfig, supperEnabled, 'auto');

  return (
    <div>
      <h1 className="mb-4 text-xl font-extrabold text-slate-900">Settings</h1>
      <div className="grid gap-4 xl:grid-cols-2">
        {/* meal slot timings */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
            <Clock size={18} className="text-brand-600" /> Meal Slot Timings
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            The kiosk switches menus automatically inside these windows. Currently serving:{' '}
            <span className="font-bold text-brand-700">{activeSlot ? SLOT_LABELS[activeSlot] : 'nothing (outside service hours)'}</span>
          </p>
          <ul className="mt-4 space-y-3">
            {ALL_SLOTS.map((slot) => (
              <li key={slot} className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${activeSlot === slot ? 'border-brand-300 bg-brand-50' : 'border-sand'}`}>
                <span className="w-24 text-sm font-extrabold text-navy">{SLOT_LABELS[slot]}</span>
                <input
                  type="time"
                  value={slotConfig[slot].start}
                  onChange={(e) => e.target.value && updateSlotWindow(slot, { start: e.target.value })}
                  aria-label={`${SLOT_LABELS[slot]} start time`}
                  className="h-11 rounded-lg border border-sand px-2.5 text-sm font-bold tabular-nums outline-none focus:border-brand-500"
                />
                <span className="text-xs font-bold text-slate-400">to</span>
                <input
                  type="time"
                  value={slotConfig[slot].end}
                  onChange={(e) => e.target.value && updateSlotWindow(slot, { end: e.target.value })}
                  aria-label={`${SLOT_LABELS[slot]} end time`}
                  className="h-11 rounded-lg border border-sand px-2.5 text-sm font-bold tabular-nums outline-none focus:border-brand-500"
                />
                <span className="text-xs text-slate-400">
                  {formatHM(slotConfig[slot].start)} – {formatHM(slotConfig[slot].end)}
                </span>
                {slot === 'supper' && (
                  <span className="ml-auto">
                    <ToggleSwitch on={supperEnabled} onToggle={() => setSupperEnabled(!supperEnabled)} labelOn="Enabled" labelOff="Disabled" />
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Supper is an optional late menu — when disabled, the kiosk closes after dinner hours.</p>
        </div>

        <div className="space-y-4">
          {/* kiosk menu mode */}
          <div className="hidden">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
              <Store size={18} className="text-brand-600" /> Kiosk Menu Mode
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              “Auto” follows the clock. Force a slot to preview or demo that menu on the kiosk immediately.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['auto', ...ALL_SLOTS] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSlotOverride(v);
                    showToast(v === 'auto' ? 'Kiosk follows the clock' : `Kiosk forced to ${SLOT_LABELS[v as MealSlot]} menu`);
                  }}
                  className={`chip min-h-[46px] capitalize ${slotOverride === v ? 'border-brand-600 bg-brand-600 text-white' : 'border-sand bg-white text-slate-600'}`}
                >
                  {v === 'auto' ? 'Auto (by time)' : SLOT_LABELS[v as MealSlot]}
                </button>
              ))}
            </div>
          </div>

          {/* tax */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-800">
              <IndianRupee size={18} className="text-brand-600" /> Tax
            </h2>
            <p className="mt-1 text-xs text-slate-400">Applied to every order after discounts. Demo uses a single flat GST rate.</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={gstInput}
                onChange={(e) => setGstInput(e.target.value.replace(/[^\d.]/g, ''))}
                inputMode="decimal"
                aria-label="GST percentage"
                className="h-12 w-24 rounded-lg border border-sand px-3 text-center text-base font-extrabold tabular-nums outline-none focus:border-brand-500"
              />
              <span className="text-sm font-bold text-slate-500">% GST</span>
              <button
                onClick={() => {
                  const v = parseFloat(gstInput);
                  if (isNaN(v) || v < 0 || v > 28) {
                    showToast('Enter a GST rate between 0 and 28%');
                    return;
                  }
                  setGstRate(v / 100);
                  showToast(`GST set to ${v}%`);
                }}
                className="btn-primary h-12 px-5 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
