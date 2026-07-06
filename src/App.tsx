import { useEffect, useState } from 'react';
import { ChefHat, MonitorPlay, Store } from 'lucide-react';
import KioskView from './views/KioskView';
import KitchenView from './views/KitchenView';
import PickupView from './views/PickupView';
import AdminView from './views/AdminView';
import PhonePayView from './views/PhonePayView';
import { ScranLogo, Toast } from './components/Shared';

type Route = 'kiosk' | 'kitchen' | 'pickup' | 'admin' | 'phonepay';
type AppRoute = Exclude<Route, 'phonepay'>;

const ROUTE_PATHS: Record<AppRoute, string> = {
  kiosk: '/kiosk',
  kitchen: '/kitchen',
  pickup: '/pickup',
  admin: '/admin',
};

function routeFromPath(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/pay') return 'phonepay';
  if (path === '/kitchen' || path === '/pickup' || path === '/admin') return path.slice(1) as AppRoute;
  return 'kiosk';
}

function legacyHashPath(): string | null {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return null;
  const [route, query = ''] = raw.split('?');
  if (route === 'pay') return `/pay${query ? `?${query}` : ''}`;
  if (route === 'kitchen' || route === 'pickup' || route === 'admin' || route === 'kiosk') return ROUTE_PATHS[route];
  return null;
}

function getRoute(): Route {
  return routeFromPath(window.location.pathname);
}

export function navigate(route: AppRoute) {
  const path = ROUTE_PATHS[route];
  if (window.location.pathname === path) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new Event('popstate'));
}

const NAV: { route: Exclude<AppRoute, 'admin'>; label: string; icon: React.ReactNode }[] = [
  { route: 'kiosk', label: 'Kiosk', icon: <Store size={18} /> },
  { route: 'kitchen', label: 'Kitchen', icon: <ChefHat size={18} /> },
  { route: 'pickup', label: 'Pickup Display', icon: <MonitorPlay size={18} /> },
];

export default function App() {
  const [route, setRoute] = useState<Route>(() => {
    const legacyPath = legacyHashPath();
    if (legacyPath) window.history.replaceState(null, '', legacyPath);
    return getRoute();
  });

  useEffect(() => {
    const onRouteChange = () => setRoute(getRoute());
    window.addEventListener('popstate', onRouteChange);
    return () => window.removeEventListener('popstate', onRouteChange);
  }, []);

  // customer's phone payment page — no POS chrome
  if (route === 'phonepay') {
    return (
      <div className="h-full overflow-y-auto">
        <PhonePayView />
      </div>
    );
  }

  if (route === 'admin') {
    return (
      <div className="h-full overflow-hidden">
        <AdminView />
        <Toast />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Demo route switcher — in production each screen runs on its own device */}
      <header className="z-40 flex h-14 shrink-0 items-center justify-between border-b border-sand bg-white px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <ScranLogo size="sm" />
          <p className="hidden truncate border-l border-sand pl-3 text-[11px] font-medium text-slate-400 md:block">
            Cloud POS for Restaurants, Cafés, Hotels &amp; QSR Brands
          </p>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.route}
              onClick={() => navigate(n.route)}
              className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors sm:px-4 ${
                route === n.route ? 'bg-brand-100 text-navy' : 'text-slate-500 active:bg-ivory'
              }`}
            >
              <span className={route === n.route ? 'text-brand-700' : ''}>{n.icon}</span>
              <span className="hidden sm:inline">{n.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        {route === 'kiosk' && <KioskView />}
        {route === 'kitchen' && <KitchenView />}
        {route === 'pickup' && <PickupView />}
      </main>

      <Toast />
    </div>
  );
}
