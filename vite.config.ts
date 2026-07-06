import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';

function lanIPv4(): string | null {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) return ni.address;
    }
  }
  return null;
}

/**
 * In-memory payment-session API for the demo "scan & pay from your phone" flow.
 * The kiosk creates a session, renders a QR that points the phone at /pay,
 * the phone confirms, and the kiosk polls the status until it flips to paid.
 * Works on both the dev server and `vite preview` (same Wi-Fi network).
 */
function payApiPlugin(): Plugin {
  type SessionLine = { name: string; qty: number; price: number };
  type Session = {
    /** pending → customer reviews on phone; paid → phone confirmed; done → kiosk placed order & attached token */
    status: 'pending' | 'paid' | 'done';
    amount: number;
    orderType: string;
    lines: SessionLine[];
    waitMins: number;
    token?: number;
    at: number;
  };
  const sessions = new Map<string, Session>();
  let lastSid: string | null = null;

  const handler = (req: any, res: any, next: () => void) => {
    if (!req.url || !req.url.startsWith('/api/pay/')) return next();
    const url = new URL(req.url, 'http://internal');
    const sid = url.searchParams.get('sid') ?? '';
    const now = Date.now();
    for (const [k, v] of sessions) if (now - v.at > 30 * 60_000) sessions.delete(k);

    const send = (obj: unknown, code = 200) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(obj));
    };

    // kiosk registers the order for phone review (JSON body with lines & totals)
    if (url.pathname === '/api/pay/create' && req.method === 'POST') {
      let body = '';
      req.on('data', (c: any) => (body += c));
      req.on('end', () => {
        try {
          const d = JSON.parse(body || '{}');
          if (!d.sid) return send({ ok: false, error: 'missing sid' }, 400);
          sessions.set(d.sid, {
            status: 'pending',
            amount: Number(d.amount) || 0,
            orderType: String(d.orderType ?? 'dine-in'),
            lines: Array.isArray(d.lines) ? d.lines.slice(0, 50) : [],
            waitMins: Number(d.waitMins) || 15,
            at: Date.now(),
          });
          lastSid = d.sid;
          const host: string = req.headers.host ?? 'localhost:5173';
          const port = host.includes(':') ? host.split(':').pop() : '80';
          const ip = lanIPv4();
          send({ ok: true, lanUrl: ip ? `http://${ip}:${port}` : `http://${host}` });
        } catch {
          send({ ok: false, error: 'bad json' }, 400);
        }
      });
      return;
    }

    if (url.pathname === '/api/pay/order') {
      // phone fetches the order for the review screen
      const s = sessions.get(sid);
      if (!s) return send({ status: 'unknown' }, 404);
      send({ status: s.status, amount: s.amount, orderType: s.orderType, lines: s.lines, waitMins: s.waitMins, token: s.token ?? null });
    } else if (url.pathname === '/api/pay/status') {
      const s = sessions.get(sid);
      send({ status: s?.status ?? 'unknown', amount: s?.amount ?? 0, token: s?.token ?? null, waitMins: s?.waitMins ?? null });
    } else if (url.pathname === '/api/pay/confirm') {
      // phone taps "Confirm Order"
      const s = sessions.get(sid);
      if (s) {
        if (s.status === 'pending') s.status = 'paid';
        send({ ok: true, amount: s.amount });
      } else {
        send({ ok: false, error: 'unknown session' }, 404);
      }
    } else if (url.pathname === '/api/pay/complete') {
      // kiosk pushes the generated token back so the phone can display it
      const s = sessions.get(sid);
      if (s) {
        s.token = parseInt(url.searchParams.get('token') ?? '0', 10) || undefined;
        s.waitMins = parseInt(url.searchParams.get('eta') ?? '', 10) || s.waitMins;
        s.status = 'done';
        send({ ok: true });
      } else {
        send({ ok: false, error: 'unknown session' }, 404);
      }
    } else if (url.pathname === '/api/pay/last') {
      // demo/testing helper: most recently created session id
      send({ sid: lastSid });
    } else {
      next();
    }
  };

  return {
    name: 'scran-pay-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), payApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
