import { useState } from 'react';
import { CalendarClock, Check, ImageUp, Megaphone, Pencil, Plus, Trash2, Video, X } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import type { Promotion, PromoPlacements } from '../../types';
import { isPromoActive } from '../../utils';
import { readImageFile, readVideoFile } from './imageUpload';

const PLACEMENT_LABELS: { key: keyof PromoPlacements; label: string }[] = [
  { key: 'kioskHome', label: 'Kiosk home screen' },
  { key: 'posIdle', label: 'POS idle screen' },
  { key: 'qrScreen', label: 'Customer QR screen' },
  { key: 'pickupDisplay', label: 'Pickup display' },
  { key: 'menuBoard', label: 'Digital menu board' },
];

const EMPTY: Omit<Promotion, 'id'> = {
  title: '',
  desc: '',
  discountPct: 0,
  banner: undefined,
  video: undefined,
  linkedItemIds: [],
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  enabled: true,
  placements: { kioskHome: true, posIdle: false, qrScreen: false, pickupDisplay: false, menuBoard: false },
};

export default function PromotionsManager() {
  const promotions = usePosStore((s) => s.promotions);
  const { deletePromotion, updatePromotion, showToast } = usePosStore.getState();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Ads &amp; Promotions</h1>
          <p className="text-sm text-slate-400">Control the kiosk home screen, idle ads and offers shown across every screen.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          className="btn-primary h-11 px-5 text-sm"
        >
          <Plus size={17} /> New Promotion
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ivory text-brand-600">
            <Megaphone size={26} />
          </div>
          <p className="text-base font-bold text-slate-600">No promotions yet</p>
          <p className="max-w-sm text-sm text-slate-400">Create a Breakfast Combo Offer, Lunch Special, Buy 1 Get 1, Weekend Offer and more — then choose where they show.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {promotions.map((p) => {
            const live = isPromoActive(p);
            return (
              <div key={p.id} className="card flex gap-3 overflow-hidden p-3">
                {p.banner ? (
                  <img src={p.banner} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-3xl">🎉</span>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-navy">{p.title || 'Untitled offer'}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {live ? '● Live' : p.enabled ? 'Scheduled' : 'Off'}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-500">{p.desc}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    {p.discountPct > 0 && <span className="rounded bg-accent-50 px-1.5 py-0.5 font-bold text-accent-600">{p.discountPct}% OFF</span>}
                    {p.video && <span className="inline-flex items-center gap-0.5"><Video size={11} /> video</span>}
                    {(p.startDate || p.startTime) && <span className="inline-flex items-center gap-0.5"><CalendarClock size={11} /> scheduled</span>}
                    <span>· {p.linkedItemIds.length} items</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => updatePromotion(p.id, { enabled: !p.enabled })}
                      className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold ${p.enabled ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400'}`}
                    >
                      {p.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditing(p); setEditorOpen(true); }} className="flex h-9 items-center gap-1 rounded-lg border border-sand px-3 text-xs font-bold text-slate-600 active:bg-ivory">
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => { deletePromotion(p.id); showToast('Promotion deleted'); }} aria-label="Delete" className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-slate-400 active:bg-red-50 active:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editorOpen && <PromoEditor promo={editing} onClose={() => setEditorOpen(false)} />}
    </div>
  );
}

function PromoEditor({ promo, onClose }: { promo: Promotion | null; onClose: () => void }) {
  const menu = usePosStore((s) => s.menu);
  const { addPromotion, updatePromotion, showToast } = usePosStore.getState();
  const [draft, setDraft] = useState<Omit<Promotion, 'id'>>(promo ? { ...promo } : { ...EMPTY });

  const set = <K extends keyof Omit<Promotion, 'id'>>(k: K, v: Omit<Promotion, 'id'>[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const toggleItem = (id: string) =>
    setDraft((d) => ({ ...d, linkedItemIds: d.linkedItemIds.includes(id) ? d.linkedItemIds.filter((x) => x !== id) : [...d.linkedItemIds, id] }));
  const togglePlacement = (k: keyof PromoPlacements) => setDraft((d) => ({ ...d, placements: { ...d.placements, [k]: !d.placements[k] } }));

  const save = () => {
    if (!draft.title.trim()) return showToast('Enter an offer title');
    const payload = { ...draft, title: draft.title.trim(), discountPct: Math.min(90, Math.max(0, draft.discountPct || 0)) };
    if (promo) {
      updatePromotion(promo.id, payload);
      showToast('Promotion updated');
    } else {
      addPromotion(payload);
      showToast('Promotion created');
    }
    onClose();
  };

  const field = 'h-11 w-full rounded-lg border border-sand px-3 text-sm font-semibold text-navy outline-none focus:border-brand-500';
  const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/50 sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-sand px-5 py-4">
          <h2 className="text-lg font-extrabold text-navy">{promo ? 'Edit Promotion' : 'New Promotion'}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 active:bg-ivory">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <span className={label}>Offer title</span>
            <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Weekend Combo Offer, Buy 1 Get 1" className={field} />
          </div>
          <div>
            <span className={label}>Description</span>
            <input value={draft.desc} onChange={(e) => set('desc', e.target.value)} maxLength={120} placeholder="Short line shown on the banner" className={field} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <span className={label}>Discount %</span>
              <input value={String(draft.discountPct)} onChange={(e) => set('discountPct', parseFloat(e.target.value.replace(/[^\d.]/g, '')) || 0)} inputMode="decimal" className={field} />
            </div>
            {/* banner upload */}
            <div>
              <span className={label}>Banner image</span>
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-sand px-3 text-xs font-bold text-slate-500 active:bg-ivory">
                {draft.banner ? <img src={draft.banner} alt="" className="h-8 w-8 rounded object-cover" /> : <ImageUp size={16} className="text-brand-600" />}
                {draft.banner ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { set('banner', await readImageFile(f, 640)); } catch { showToast('Bad image'); } } e.target.value = ''; }} />
              </label>
            </div>
            {/* video upload */}
            <div>
              <span className={label}>Promo video</span>
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-sand px-3 text-xs font-bold text-slate-500 active:bg-ivory">
                {draft.video ? <Check size={16} className="text-emerald-600" /> : <Video size={16} className="text-brand-600" />}
                {draft.video ? 'Replace' : 'Upload (≤8MB)'}
                <input type="file" accept="video/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { set('video', await readVideoFile(f)); showToast('Video attached'); } catch { showToast('Video too large (≤8MB)'); } } e.target.value = ''; }} />
              </label>
            </div>
          </div>

          {/* schedule */}
          <div>
            <span className={label}>Schedule (optional)</span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-[11px] font-bold text-slate-400">Start date<input type="date" value={draft.startDate} onChange={(e) => set('startDate', e.target.value)} className={`${field} mt-1`} /></label>
              <label className="text-[11px] font-bold text-slate-400">End date<input type="date" value={draft.endDate} onChange={(e) => set('endDate', e.target.value)} className={`${field} mt-1`} /></label>
              <label className="text-[11px] font-bold text-slate-400">Start time<input type="time" value={draft.startTime} onChange={(e) => set('startTime', e.target.value)} className={`${field} mt-1`} /></label>
              <label className="text-[11px] font-bold text-slate-400">End time<input type="time" value={draft.endTime} onChange={(e) => set('endTime', e.target.value)} className={`${field} mt-1`} /></label>
            </div>
          </div>

          {/* placements */}
          <div>
            <span className={label}>Show on</span>
            <div className="flex flex-wrap gap-2">
              {PLACEMENT_LABELS.map((pl) => (
                <button
                  key={pl.key}
                  onClick={() => togglePlacement(pl.key)}
                  className={`chip min-h-[44px] ${draft.placements[pl.key] ? 'border-brand-600 bg-brand-100 text-brand-800' : 'border-sand bg-white text-slate-500'}`}
                >
                  {pl.label}
                </button>
              ))}
            </div>
          </div>

          {/* linked items */}
          <div>
            <span className={label}>Linked menu items ({draft.linkedItemIds.length})</span>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-sand p-2">
              {menu.map((m) => {
                const on = draft.linkedItemIds.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleItem(m.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${on ? 'bg-brand-50' : 'active:bg-ivory'}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded border ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-sand'}`}>{on && <Check size={13} />}</span>
                    <span className="flex-1 truncate font-semibold text-slate-700">{m.name}</span>
                    <span className="text-xs text-slate-400">{m.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-sand px-4 py-3">
            <span className="text-sm font-bold text-navy">Enabled</span>
            <span onClick={() => set('enabled', !draft.enabled)} className={`flex h-6 w-11 items-center rounded-full px-0.5 ${draft.enabled ? 'justify-end bg-brand-600' : 'justify-start bg-slate-200'}`}>
              <span className="h-5 w-5 rounded-full bg-white shadow" />
            </span>
          </label>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-sand p-4">
          <button onClick={onClose} className="btn-outline h-12 px-5">Cancel</button>
          <button onClick={save} className="btn-primary h-12 px-6">{promo ? 'Save Changes' : 'Create Promotion'}</button>
        </div>
      </div>
    </div>
  );
}
