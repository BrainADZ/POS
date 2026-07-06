import { useState } from 'react';
import { Camera, Clock, Flame, Plus, Trash2, X } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { ALL_SLOTS, SLOT_LABELS } from '../../utils';
import type { Addon, FoodType, MealSlot, MenuItem, Variant } from '../../types';
import { VegDot } from '../Shared';
import { readImageFile } from './imageUpload';

const FOOD_TYPES: { id: FoodType; label: string }[] = [
  { id: 'veg', label: 'Veg' },
  { id: 'nonveg', label: 'Non-veg' },
  { id: 'egg', label: 'Egg' },
];
const SPICY = ['None', 'Mild', 'Medium', 'Hot'];

/** Add or edit a menu item. Pass `item` to edit, or nothing to create a new one. */
export default function ItemEditor({ item, onClose }: { item?: MenuItem | null; onClose: () => void }) {
  const categories = usePosStore((s) => s.categories);
  const cuisines = usePosStore((s) => s.cuisines);
  const { addMenuItem, updateMenuItem, showToast } = usePosStore.getState();

  const editing = !!item;
  const firstCat = categories[0]?.name ?? 'Sides';

  const [name, setName] = useState(item?.name ?? '');
  const [desc, setDesc] = useState(item?.desc ?? '');
  const [price, setPrice] = useState(item ? String(item.price) : '');
  const [category, setCategory] = useState(item?.category ?? firstCat);
  const [cuisine, setCuisine] = useState(item?.cuisine ?? (cuisines[0] ?? ''));
  const [photo, setPhoto] = useState(item?.image ?? '');
  const [prep, setPrep] = useState(item ? String(item.prepMins) : '10');
  const [foodType, setFoodType] = useState<FoodType>(item?.foodType ?? 'veg');
  const [spicyLevel, setSpicyLevel] = useState(item?.spicyLevel ?? 0);
  const [available, setAvailable] = useState(item?.available ?? true);
  const [bestseller, setBestseller] = useState(item?.bestseller ?? false);
  const [discountPct, setDiscountPct] = useState(item ? String(item.discountPct) : '0');
  const [slots, setSlots] = useState<MealSlot[]>(item?.slots ?? [...ALL_SLOTS]);
  const [showOnKiosk, setShowOnKiosk] = useState(item?.showOnKiosk ?? true);
  const [showOnPos, setShowOnPos] = useState(item?.showOnPos ?? true);
  const [allergens, setAllergens] = useState((item?.allergens ?? []).join(', '));
  const [addons, setAddons] = useState<Addon[]>(item?.addons ?? []);
  const [variants, setVariants] = useState<Variant[]>(item?.variants ?? []);

  const toggleSlot = (s: MealSlot) => setSlots((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const save = () => {
    const p = parseFloat(price);
    const prepMins = parseInt(prep, 10);
    const disc = Math.min(90, Math.max(0, parseFloat(discountPct) || 0));
    if (!name.trim()) return showToast('Enter a dish name');
    if (isNaN(p) || p <= 0) return showToast('Enter a valid price');
    if (slots.length === 0) return showToast('Select at least one meal slot');

    const payload = {
      name: name.trim(),
      category,
      cuisine,
      price: p,
      foodType,
      veg: foodType === 'veg',
      bestseller,
      available,
      image: photo || undefined,
      emoji: item?.emoji ?? '🍽️',
      gradient: item?.gradient ?? 'from-[#FBFAF8] to-[#F0EDE5]',
      desc: desc.trim() || 'Freshly prepared',
      addons: addons.filter((a) => a.name.trim()),
      variants: variants.filter((v) => v.name.trim()),
      spice: spicyLevel > 0,
      spicyLevel,
      allergens: allergens.split(',').map((a) => a.trim()).filter(Boolean),
      slots,
      prepMins: isNaN(prepMins) || prepMins <= 0 ? 10 : prepMins,
      discountPct: disc,
      showOnKiosk,
      showOnPos,
    };

    if (editing && item) {
      updateMenuItem(item.id, payload);
      showToast(`${payload.name} updated`);
    } else {
      addMenuItem(payload);
      showToast(`${payload.name} added to the menu`);
    }
    onClose();
  };

  const field = 'h-11 w-full rounded-lg border border-sand px-3 text-sm font-semibold text-navy outline-none focus:border-brand-500';
  const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/50 sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-sand px-5 py-4">
          <h2 className="text-lg font-extrabold text-navy">{editing ? 'Edit Dish' : 'Add New Dish'}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 active:bg-ivory">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {/* photo + basics */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-sand bg-ivory">
              {photo ? (
                <img src={photo} alt="Dish" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-slate-400">
                  <Camera size={22} className="text-brand-600" />
                  <span className="text-[11px] font-bold">Add photo</span>
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 hidden bg-navy/70 py-1 text-center text-[10px] font-bold text-white group-active:block">
                Change
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    try {
                      setPhoto(await readImageFile(f));
                    } catch {
                      showToast('Could not read that image');
                    }
                  }
                  e.target.value = '';
                }}
              />
            </label>
            <div className="flex-1 space-y-3">
              <div>
                <span className={label}>Dish name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Butter Chicken" className={field} />
              </div>
              <div>
                <span className={label}>Description</span>
                <input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={90} placeholder="Short description shown on the card" className={field} />
              </div>
            </div>
          </div>

          {/* category / cuisine / price / prep */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className={label}>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} bg-white`}>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={label}>Cuisine</span>
              <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={`${field} bg-white`}>
                <option value="">— None —</option>
                {cuisines.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={label}>Price ₹</span>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0" className={field} />
            </div>
            <div>
              <span className={label}>Prep time</span>
              <div className="flex items-center gap-2 rounded-lg border border-sand px-3">
                <Clock size={15} className="shrink-0 text-slate-400" />
                <input value={prep} onChange={(e) => setPrep(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="h-11 w-full text-sm font-semibold outline-none" />
                <span className="shrink-0 text-xs font-bold text-slate-400">min</span>
              </div>
            </div>
          </div>

          {/* food type / spicy / discount */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <span className={label}>Food type</span>
              <div className="flex gap-1.5">
                {FOOD_TYPES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFoodType(f.id)}
                    className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold ${
                      foodType === f.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-sand bg-white text-slate-500'
                    }`}
                  >
                    <VegDot foodType={f.id} size={13} /> {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={label}>Spice level</span>
              <div className="flex gap-1.5">
                {SPICY.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setSpicyLevel(i)}
                    className={`flex h-11 flex-1 items-center justify-center gap-0.5 rounded-lg border text-[11px] font-bold ${
                      spicyLevel === i ? 'border-red-500 bg-red-50 text-red-600' : 'border-sand bg-white text-slate-500'
                    }`}
                    title={s}
                  >
                    {i === 0 ? 'None' : Array.from({ length: i }).map((_, j) => <Flame key={j} size={12} fill="currentColor" />)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={label}>Discount %</span>
              <input value={discountPct} onChange={(e) => setDiscountPct(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" className={field} />
            </div>
          </div>

          {/* meal slots */}
          <div>
            <span className={label}>Meal availability</span>
            <div className="flex flex-wrap gap-2">
              {ALL_SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSlot(s)}
                  className={`chip min-h-[44px] ${slots.includes(s) ? 'border-brand-600 bg-brand-100 text-brand-800' : 'border-sand bg-white text-slate-500'}`}
                >
                  {SLOT_LABELS[s]}
                </button>
              ))}
              <button
                onClick={() => setSlots((cur) => (cur.length === ALL_SLOTS.length ? [] : [...ALL_SLOTS]))}
                className={`chip min-h-[44px] ${slots.length === ALL_SLOTS.length ? 'border-accent-500 bg-accent-50 text-accent-600' : 'border-sand bg-white text-slate-500'}`}
              >
                All Day
              </button>
            </div>
          </div>

          {/* add-ons */}
          <EditableRows
            title="Add-ons"
            rows={addons}
            onChange={setAddons}
            namePlaceholder="Add-on name (e.g. Extra Cheese)"
          />

          {/* variants */}
          <EditableRows
            title="Variants (each overrides the base price)"
            rows={variants}
            onChange={setVariants}
            namePlaceholder="Variant name (e.g. Large)"
          />

          {/* allergens */}
          <div>
            <span className={label}>Allergy caution (comma separated)</span>
            <input value={allergens} onChange={(e) => setAllergens(e.target.value)} placeholder="gluten, dairy, egg, nuts" className={field} />
          </div>

          {/* toggles */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <EditorToggle label="Available" on={available} set={setAvailable} />
            <EditorToggle label="Bestseller" on={bestseller} set={setBestseller} />
            <EditorToggle label="Show on Kiosk" on={showOnKiosk} set={setShowOnKiosk} />
            <EditorToggle label="Show on POS" on={showOnPos} set={setShowOnPos} />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-sand p-4">
          <button onClick={onClose} className="btn-outline h-12 px-5">
            Cancel
          </button>
          <button onClick={save} className="btn-primary h-12 px-6">
            {editing ? 'Save Changes' : 'Add Dish'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableRows({
  title,
  rows,
  onChange,
  namePlaceholder,
}: {
  title: string;
  rows: { name: string; price: number }[];
  onChange: (rows: { name: string; price: number }[]) => void;
  namePlaceholder: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</span>
        <button onClick={() => onChange([...rows, { name: '', price: 0 }])} className="flex min-h-[36px] items-center gap-1 rounded-lg border border-sand px-2.5 text-xs font-bold text-brand-700 active:bg-ivory">
          <Plus size={14} /> Add
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">None</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r.name}
                onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder={namePlaceholder}
                className="h-11 min-w-0 flex-1 rounded-lg border border-sand px-3 text-sm outline-none focus:border-brand-500"
              />
              <div className="flex items-center gap-1 rounded-lg border border-sand px-2">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  value={String(r.price)}
                  onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, price: parseFloat(e.target.value) || 0 } : x)))}
                  inputMode="decimal"
                  className="h-11 w-16 text-sm font-semibold outline-none"
                />
              </div>
              <button onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 active:bg-red-50 active:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditorToggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      onClick={() => set(!on)}
      role="switch"
      aria-checked={on}
      className={`flex h-12 items-center justify-between gap-2 rounded-lg border px-3 text-sm font-bold ${
        on ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-sand bg-white text-slate-400'
      }`}
    >
      {label}
      <span className={`flex h-6 w-10 items-center rounded-full px-0.5 ${on ? 'justify-end bg-brand-600' : 'justify-start bg-slate-200'}`}>
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
