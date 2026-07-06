import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Utensils } from 'lucide-react';
import QRCode from 'qrcode';
import { usePosStore } from '../store/posStore';
import type { FoodType } from '../types';

/** Scran wordmark — elegant serif with a copper utensil detail. */
export function ScranLogo({ size = 'md', className = '', light = false }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; light?: boolean }) {
  const text = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl', xl: 'text-6xl' }[size];
  const icon = { sm: 14, md: 17, lg: 26, xl: 40 }[size];
  return (
    <span className={`inline-flex items-end gap-1 leading-none ${className}`}>
      <span className={`font-display font-bold tracking-tight ${light ? 'text-white' : 'text-navy'} ${text}`}>Scran</span>
      <Utensils size={icon} className={`mb-0.5 shrink-0 ${light ? 'text-accent-300' : 'text-accent-500'}`} strokeWidth={2.2} />
    </span>
  );
}

/**
 * Realistic food photo with graceful fallback.
 * Renders the /food/*.png asset (object-contain, photo carries its own soft
 * shadow); only if the asset is missing does it fall back to the emoji glyph.
 */
export function FoodImage({
  image,
  emoji,
  name,
  className = '',
  emojiClassName = 'text-5xl',
}: {
  image?: string;
  emoji: string;
  name: string;
  className?: string;
  emojiClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) {
    return (
      <span className={emojiClassName} role="img" aria-label={name}>
        {emoji}
      </span>
    );
  }
  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={`h-full w-full select-none object-contain ${className}`}
    />
  );
}

/** Real scannable QR code rendered to canvas (offline, via the qrcode package). */
export function QRCanvas({ value, size = 200 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) {
      QRCode.toCanvas(ref.current, value, {
        width: size,
        margin: 1,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      }).catch(() => {});
    }
  }, [value, size]);
  return <canvas ref={ref} className="rounded-lg" style={{ width: size, height: size }} />;
}

/** FSSAI-style veg / non-veg indicator. */
export function VegDot({ veg, foodType, size = 18 }: { veg?: boolean; foodType?: FoodType; size?: number }) {
  const type: FoodType = foodType ?? (veg ? 'veg' : 'nonveg');
  const color = type === 'veg' ? '#16a34a' : type === 'egg' ? '#d97706' : '#dc2626';
  const title = type === 'veg' ? 'Veg' : type === 'egg' ? 'Contains egg' : 'Non-veg';
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[4px] border-2 bg-white"
      style={{ width: size, height: size, borderColor: color }}
      title={title}
    >
      {/* triangle for egg, circle for veg/non-veg */}
      {type === 'egg' ? (
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.26}px solid transparent`,
            borderRight: `${size * 0.26}px solid transparent`,
            borderBottom: `${size * 0.45}px solid ${color}`,
          }}
        />
      ) : (
        <span className="rounded-full" style={{ width: size * 0.45, height: size * 0.45, background: color }} />
      )}
    </span>
  );
}

/** Deterministic mock QR code (pure SVG, works offline — demo only). */
export function MockQR({ seed, size = 208 }: { seed: string; size?: number }) {
  const cells = useMemo(() => {
    const n = 21;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rand = () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
    const grid: boolean[][] = [];
    for (let y = 0; y < n; y++) {
      grid.push([]);
      for (let x = 0; x < n; x++) grid[y].push(rand() > 0.52);
    }
    // finder patterns
    const finder = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y++)
        for (let x = 0; x < 7; x++) {
          const border = x === 0 || y === 0 || x === 6 || y === 6;
          const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[oy + y][ox + x] = border || core;
        }
      for (let i = -1; i < 8; i++) {
        const gx = ox + i, gy1 = oy - 1, gy2 = oy + 7;
        if (grid[gy1]?.[gx] !== undefined) grid[gy1][gx] = false;
        if (grid[gy2]?.[gx] !== undefined) grid[gy2][gx] = false;
        const gy = oy + i, gx1 = ox - 1, gx2 = ox + 7;
        if (grid[gy]?.[gx1] !== undefined) grid[gy][gx1] = false;
        if (grid[gy]?.[gx2] !== undefined) grid[gy][gx2] = false;
      }
    };
    finder(0, 0);
    finder(14, 0);
    finder(0, 14);
    return grid;
  }, [seed]);

  const n = cells.length;
  const cell = size / (n + 4);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-white" aria-label="Mock UPI QR code">
      <rect width={size} height={size} fill="#fff" rx={8} />
      {cells.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect key={`${x}-${y}`} x={(x + 2) * cell} y={(y + 2) * cell} width={cell} height={cell} fill="#0f172a" />
          ) : null
        )
      )}
    </svg>
  );
}

/** Global toast, bottom-centre, driven by the store. */
export function Toast() {
  const toast = usePosStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full bg-slate-900/95 px-5 py-3 text-sm font-semibold text-white shadow-xl">
        <CheckCircle2 size={18} className="text-emerald-400" />
        {toast}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">{icon}</div>
      <p className="text-base font-semibold text-slate-600">{title}</p>
      {sub && <p className="max-w-xs text-sm text-slate-400">{sub}</p>}
    </div>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: 'blue' | 'amber' | 'green' | 'slate' | 'red' }) {
  const tones: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-700 border-brand-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${tones[tone]}`}>{label}</span>;
}
