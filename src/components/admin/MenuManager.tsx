import { useMemo, useState } from 'react';
import {
  Camera, ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, LayoutGrid, List, Pencil, Plus, Search,
  Star, Trash2, UtensilsCrossed, X,
} from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import type { MenuItem } from '../../types';
import { effectivePrice, inr, SLOT_LABELS } from '../../utils';
import { FoodImage, VegDot } from '../Shared';
import { readImageFile } from './imageUpload';
import ItemEditor from './ItemEditor';

type Sub = 'items' | 'categories' | 'cuisines' | 'display';

const SUBS: { id: Sub; label: string }[] = [
  { id: 'items', label: 'Items' },
  { id: 'categories', label: 'Categories' },
  { id: 'cuisines', label: 'Cuisines' },
  { id: 'display', label: 'Display' },
];

export default function MenuManager() {
  const [sub, setSub] = useState<Sub>('items');
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Food &amp; Menu Management</h1>
          <p className="text-sm text-slate-400">Control everything the kiosk and POS show — items, categories, cuisines and layout.</p>
        </div>
      </div>

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg bg-ivory p-1">
        {SUBS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`min-h-[44px] rounded-md px-4 text-sm font-bold transition-colors ${sub === s.id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sub === 'items' && <ItemsPanel />}
      {sub === 'categories' && <CategoriesPanel />}
      {sub === 'cuisines' && <CuisinesPanel />}
      {sub === 'display' && <DisplayPanel />}
    </div>
  );
}

/* ---------------------------------- Items ---------------------------------- */

function ItemsPanel() {
  const menu = usePosStore((s) => s.menu);
  const categories = usePosStore((s) => s.categories);
  const { toggleAvailability, updateMenuItem, deleteMenuItem, showToast } = usePosStore.getState();

  const [editing, setEditing] = useState<MenuItem | null | undefined>(undefined); // undefined = closed, null = add
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter((m) => {
      if (catFilter !== 'All' && m.category !== catFilter) return false;
      if (q && !(m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.cuisine.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [menu, search, catFilter]);

  const quickPhoto = async (id: string, file?: File) => {
    if (!file) return;
    try {
      updateMenuItem(id, { image: await readImageFile(file) });
      showToast('Dish photo updated');
    } catch {
      showToast('Could not read that image');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="h-11 w-full rounded-lg border border-sand bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-11 rounded-lg border border-sand bg-white px-3 text-sm font-semibold outline-none focus:border-brand-500">
          <option>All</option>
          {categories.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={() => setEditing(null)} className="btn-primary h-11 px-5 text-sm">
          <Plus size={17} /> Add Dish
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_1.3fr_110px_150px_150px] gap-3 border-b border-sand bg-ivory px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-400 lg:grid">
          <span>Item</span>
          <span>Category / Cuisine</span>
          <span>Price</span>
          <span>Visibility</span>
          <span className="text-right">Actions</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">No dishes match. Try a different search or add a new dish.</p>
        ) : (
          <ul className="divide-y divide-sand">
            {rows.map((m) => (
              <li key={m.id} className="grid grid-cols-1 items-center gap-3 px-4 py-3 lg:grid-cols-[minmax(0,2.2fr)_1.3fr_110px_150px_150px]">
                <div className="flex min-w-0 items-center gap-3">
                  <label className="group relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-sand bg-white p-0.5" title="Change photo">
                    <FoodImage image={m.image} emoji={m.emoji} name={m.name} emojiClassName="text-2xl" />
                    <span className="absolute inset-0 hidden items-center justify-center bg-navy/50 text-white group-active:flex">
                      <Camera size={14} />
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { quickPhoto(m.id, e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-navy">
                      <VegDot foodType={m.foodType} size={13} /> {m.name}
                      {m.bestseller && <Star size={12} className="text-accent-500" fill="currentColor" />}
                      {m.discountPct > 0 && <span className="rounded bg-brand-100 px-1.5 text-[10px] font-bold text-brand-800">{m.discountPct}%</span>}
                    </p>
                    <p className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                      {m.slots.length === 4 ? (
                        <span className="rounded bg-accent-50 px-1.5 py-0.5 font-bold uppercase text-accent-600">All Day</span>
                      ) : (
                        m.slots.map((s) => (
                          <span key={s} className="rounded bg-brand-100 px-1.5 py-0.5 font-bold uppercase text-brand-800">
                            {SLOT_LABELS[s].slice(0, 3)}
                          </span>
                        ))
                      )}
                      <span>· {m.prepMins}m</span>
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-slate-600">{m.category}</span>
                  {m.cuisine && <span className="text-slate-400"> · {m.cuisine}</span>}
                </div>
                <div className="text-sm font-extrabold text-navy">
                  {inr(effectivePrice(m))}
                  {m.discountPct > 0 && <span className="block text-[11px] font-medium text-slate-400 line-through">{inr(m.price)}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleAvailability(m.id)}
                    className={`flex h-9 items-center gap-1 rounded-lg border px-2 text-[11px] font-bold ${m.available ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
                    title="Availability"
                  >
                    {m.available ? 'In stock' : 'Sold out'}
                  </button>
                  <button
                    onClick={() => updateMenuItem(m.id, { showOnKiosk: !m.showOnKiosk })}
                    aria-label="Kiosk visibility"
                    title={m.showOnKiosk ? 'Visible on kiosk' : 'Hidden from kiosk'}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${m.showOnKiosk ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-300'}`}
                  >
                    {m.showOnKiosk ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => setEditing(m)} className="flex h-9 items-center gap-1 rounded-lg border border-sand px-3 text-xs font-bold text-slate-600 active:bg-ivory">
                    <Pencil size={14} /> Edit
                  </button>
                  {confirmDelete === m.id ? (
                    <>
                      <button onClick={() => { deleteMenuItem(m.id); setConfirmDelete(null); showToast(`${m.name} deleted`); }} className="btn-danger h-9 px-3 text-xs">
                        Confirm
                      </button>
                      <button onClick={() => setConfirmDelete(null)} aria-label="Cancel delete" className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-slate-500">
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDelete(m.id)} aria-label={`Delete ${m.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-slate-400 active:bg-red-50 active:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400">Changes apply to the kiosk and POS instantly (and to other open tabs via live sync).</p>

      {editing !== undefined && <ItemEditor item={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

/* ---------------------------------- Categories ---------------------------------- */

function CategoriesPanel() {
  const categories = usePosStore((s) => s.categories);
  const menu = usePosStore((s) => s.menu);
  const { addCategory, updateCategory, deleteCategory, moveCategory, showToast } = usePosStore.getState();
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🍽️');

  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const countFor = (name: string) => menu.filter((m) => m.category === name).length;

  return (
    <div className="max-w-3xl">
      {/* add */}
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Icon</span>
          <input value={newIcon} onChange={(e) => setNewIcon(e.target.value.slice(0, 2))} className="h-11 w-14 rounded-lg border border-sand text-center text-xl outline-none focus:border-brand-500" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">New category name</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                addCategory(newName, newIcon);
                showToast(`Category “${newName.trim()}” added`);
                setNewName('');
                setNewIcon('🍽️');
              }
            }}
            placeholder="e.g. Indian Food, Chinese, Rice & Biryani"
            className="h-11 w-full rounded-lg border border-sand px-3 text-sm font-semibold outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={() => {
            if (!newName.trim()) return showToast('Enter a category name');
            addCategory(newName, newIcon);
            showToast(`Category “${newName.trim()}” added`);
            setNewName('');
            setNewIcon('🍽️');
          }}
          className="btn-primary h-11 px-5 text-sm"
        >
          <Plus size={17} /> Add
        </button>
      </div>

      <div className="card divide-y divide-sand">
        {sorted.map((c, i) => (
          <CategoryRow
            key={c.id}
            id={c.id}
            name={c.name}
            icon={c.icon}
            image={c.image}
            visible={c.visible}
            count={countFor(c.name)}
            isFirst={i === 0}
            isLast={i === sorted.length - 1}
            onRename={(name) => updateCategory(c.id, { name })}
            onIcon={(icon) => updateCategory(c.id, { icon })}
            onImage={(image) => updateCategory(c.id, { image })}
            onToggle={() => updateCategory(c.id, { visible: !c.visible })}
            onMove={(dir) => moveCategory(c.id, dir)}
            onDelete={() => {
              if (!deleteCategory(c.id)) showToast('Move or delete its dishes first');
              else showToast(`Category “${c.name}” deleted`);
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">Reorder to change the kiosk sidebar order. Hidden categories stay off the kiosk. A category with dishes can't be deleted until it's empty.</p>
    </div>
  );
}

function CategoryRow(props: {
  id: string;
  name: string;
  icon: string;
  image?: string;
  visible: boolean;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => void;
  onIcon: (icon: string) => void;
  onImage: (image: string) => void;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(props.name);
  const showToast = usePosStore((s) => s.showToast);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <GripVertical size={16} className="hidden shrink-0 text-slate-300 sm:block" />
      {/* icon (emoji or uploaded image) */}
      <label className="group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-sand bg-white" title="Upload category image">
        {props.image ? <img src={props.image} alt="" className="h-full w-full object-cover" /> : <span className="text-xl">{props.icon}</span>}
        <span className="absolute inset-0 hidden items-center justify-center bg-navy/50 text-white group-active:flex">
          <Camera size={13} />
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              try {
                props.onImage(await readImageFile(f, 128));
                showToast('Category image set');
              } catch {
                showToast('Could not read that image');
              }
            }
            e.target.value = '';
          }}
        />
      </label>
      <input
        value={props.icon}
        onChange={(e) => props.onIcon(e.target.value.slice(0, 2))}
        aria-label="Category emoji"
        className="h-11 w-12 rounded-lg border border-sand text-center text-lg outline-none focus:border-brand-500"
        title="Emoji icon"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== props.name && props.onRename(name.trim())}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-11 min-w-0 flex-1 rounded-lg border border-sand px-3 text-sm font-bold text-navy outline-none focus:border-brand-500"
      />
      <span className="rounded-full bg-ivory px-2.5 py-1 text-xs font-bold text-slate-500">{props.count} items</span>
      <div className="flex items-center gap-1">
        <button onClick={() => props.onMove(-1)} disabled={props.isFirst} aria-label="Move up" className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-slate-500 disabled:opacity-30">
          <ChevronUp size={16} />
        </button>
        <button onClick={() => props.onMove(1)} disabled={props.isLast} aria-label="Move down" className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-slate-500 disabled:opacity-30">
          <ChevronDown size={16} />
        </button>
        <button
          onClick={props.onToggle}
          aria-label="Toggle visibility"
          title={props.visible ? 'Visible on kiosk' : 'Hidden'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${props.visible ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-300'}`}
        >
          {props.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button onClick={props.onDelete} aria-label="Delete category" className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-slate-400 active:bg-red-50 active:text-red-600">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- Cuisines ---------------------------------- */

function CuisinesPanel() {
  const cuisines = usePosStore((s) => s.cuisines);
  const menu = usePosStore((s) => s.menu);
  const { addCuisine, renameCuisine, deleteCuisine, showToast } = usePosStore.getState();
  const [newName, setNewName] = useState('');

  return (
    <div className="max-w-2xl">
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">New cuisine / food type</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                addCuisine(newName);
                showToast(`Cuisine “${newName.trim()}” added`);
                setNewName('');
              }
            }}
            placeholder="e.g. Indian, Chinese, Continental, Mexican, Thai"
            className="h-11 w-full rounded-lg border border-sand px-3 text-sm font-semibold outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={() => {
            if (!newName.trim()) return showToast('Enter a cuisine name');
            addCuisine(newName);
            showToast(`Cuisine “${newName.trim()}” added`);
            setNewName('');
          }}
          className="btn-primary h-11 px-5 text-sm"
        >
          <Plus size={17} /> Add
        </button>
      </div>

      <div className="card divide-y divide-sand">
        {cuisines.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No cuisines yet — add one above.</p>
        ) : (
          cuisines.map((c) => (
            <CuisineRow
              key={c}
              name={c}
              count={menu.filter((m) => m.cuisine === c).length}
              onRename={(to) => renameCuisine(c, to)}
              onDelete={() => {
                deleteCuisine(c);
                showToast(`Cuisine “${c}” removed`);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CuisineRow({ name, count, onRename, onDelete }: { name: string; count: number; onRename: (to: string) => void; onDelete: () => void }) {
  const [val, setVal] = useState(name);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <UtensilsCrossed size={16} className="shrink-0 text-slate-300" />
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => val.trim() && val !== name && onRename(val.trim())}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-11 min-w-0 flex-1 rounded-lg border border-sand px-3 text-sm font-bold text-navy outline-none focus:border-brand-500"
      />
      <span className="rounded-full bg-ivory px-2.5 py-1 text-xs font-bold text-slate-500">{count} items</span>
      <button onClick={onDelete} aria-label={`Delete ${name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-slate-400 active:bg-red-50 active:text-red-600">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

/* ---------------------------------- Display ---------------------------------- */

function DisplayPanel() {
  const display = usePosStore((s) => s.display);
  const setDisplay = usePosStore((s) => s.setDisplay);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card p-5">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-400">Default view</h3>
        <div className="mt-3 flex gap-2">
          {([
            { id: 'grid', label: 'Grid — large cards', icon: <LayoutGrid size={16} /> },
            { id: 'list', label: 'List — compact rows', icon: <List size={16} /> },
          ] as const).map((v) => (
            <button
              key={v.id}
              onClick={() => setDisplay({ defaultView: v.id })}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-bold ${display.defaultView === v.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-sand bg-white text-slate-500'}`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-400">Sidebar layout</h3>
        <p className="mt-1 text-xs text-slate-400">Show the kiosk sidebar grouped by food category or by cuisine.</p>
        <div className="mt-3 flex gap-2">
          {([
            { id: 'category', label: 'Category-first' },
            { id: 'cuisine', label: 'Cuisine-first' },
          ] as const).map((v) => (
            <button
              key={v.id}
              onClick={() => setDisplay({ layoutMode: v.id })}
              className={`h-12 flex-1 rounded-lg border text-sm font-bold ${display.layoutMode === v.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-sand bg-white text-slate-500'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-400">Sections</h3>
        <div className="mt-3 space-y-2">
          {([
            { key: 'showFeatured', label: 'Featured offers strip', desc: 'Show active promotions at the top of the menu' },
            { key: 'showBestsellers', label: 'Bestseller filter', desc: 'Show the “Bestseller” quick filter chip' },
            { key: 'showCombos', label: 'Combos filter', desc: 'Show the “Combos” quick filter chip' },
          ] as const).map((row) => (
            <button
              key={row.key}
              onClick={() => setDisplay({ [row.key]: !display[row.key] } as any)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-sand bg-white px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-bold text-navy">{row.label}</span>
                <span className="block text-xs text-slate-400">{row.desc}</span>
              </span>
              <span className={`flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ${display[row.key] ? 'justify-end bg-brand-600' : 'justify-start bg-slate-200'}`}>
                <span className="h-5 w-5 rounded-full bg-white shadow" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
