import { useState } from 'react';
import { BadgePercent, IdCard, KeyRound, Send, Tag, X } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { COUPONS, EMPLOYEE_DISCOUNT_RATE } from '../utils';

/**
 * Discount options for the current order:
 *  - coupon code (SCRAN10 / WELCOME5)
 *  - employee ID verified with a 4-digit OTP sent to the employee's
 *    registered phone/email (simulated in the demo — the OTP is shown on screen).
 */
export default function DiscountModal({ onClose }: { onClose: () => void }) {
  const { setCoupon, showToast } = usePosStore.getState();
  const [tab, setTab] = useState<'coupon' | 'employee'>('coupon');

  const [couponInput, setCouponInput] = useState('');
  const [empId, setEmpId] = useState('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      setCoupon(code);
      showToast(`Coupon ${code} applied — ${COUPONS[code] * 100}% off`);
      onClose();
    } else {
      showToast('Invalid coupon code');
    }
  };

  const sendOtp = () => {
    const id = empId.trim().toUpperCase();
    if (id.length < 4) {
      showToast('Enter a valid Employee ID (min 4 characters)');
      return;
    }
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setSentOtp(otp);
    setOtpInput('');
    setOtpError(false);
    showToast(`OTP sent to the registered phone & email for ${id}`);
  };

  const verifyOtp = () => {
    if (otpInput.trim() === sentOtp) {
      const id = empId.trim().toUpperCase();
      setCoupon(`EMP:${id}`);
      showToast(`Employee verified — ${EMPLOYEE_DISCOUNT_RATE * 100}% discount applied`);
      onClose();
    } else {
      setOtpError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/50 sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy">
            <BadgePercent size={20} className="text-brand-600" /> Apply Discount
          </h2>
          <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 active:bg-ivory">
            <X size={20} />
          </button>
        </div>

        {/* tabs */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-ivory p-1">
          {(
            [
              { id: 'coupon', label: 'Coupon Code', icon: <Tag size={15} /> },
              { id: 'employee', label: 'Employee ID', icon: <IdCard size={15} /> },
            ] as const
          ).map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-md text-sm font-bold transition-colors ${
                tab === tb.id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'
              }`}
            >
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {tab === 'coupon' && (
          <div>
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon code"
                className="h-12 min-w-0 flex-1 rounded-lg border border-sand px-3.5 text-sm font-bold uppercase outline-none placeholder:normal-case placeholder:font-normal focus:border-brand-500"
              />
              <button onClick={applyCoupon} className="btn-primary h-12 shrink-0 px-5 text-sm">
                Apply
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Demo codes: <span className="font-bold text-slate-500">SCRAN10</span> (10% off) ·{' '}
              <span className="font-bold text-slate-500">WELCOME5</span> (5% off)
            </p>
          </div>
        )}

        {tab === 'employee' && (
          <div>
            <div className="flex gap-2">
              <input
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="Employee ID (e.g. EMP1024)"
                disabled={!!sentOtp}
                className="h-12 min-w-0 flex-1 rounded-lg border border-sand px-3.5 text-sm font-bold uppercase outline-none placeholder:normal-case placeholder:font-normal focus:border-brand-500 disabled:bg-ivory disabled:text-slate-400"
              />
              <button onClick={sendOtp} className={`h-12 shrink-0 px-4 text-sm ${sentOtp ? 'btn-outline' : 'btn-primary'}`}>
                <Send size={15} /> {sentOtp ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>

            {sentOtp && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                  <KeyRound size={16} className="text-brand-600" />
                  Enter the 4-digit OTP sent to the registered phone / email
                </p>
                <div className="flex gap-2">
                  <input
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setOtpError(false);
                    }}
                    inputMode="numeric"
                    placeholder="• • • •"
                    className={`h-12 w-36 rounded-lg border px-3.5 text-center text-xl font-extrabold tracking-[0.4em] outline-none focus:border-brand-500 ${
                      otpError ? 'border-red-400 bg-red-50' : 'border-sand'
                    }`}
                  />
                  <button onClick={verifyOtp} disabled={otpInput.length !== 4} className="btn-cta h-12 flex-1 text-sm disabled:opacity-50">
                    Verify & Apply {EMPLOYEE_DISCOUNT_RATE * 100}% Off
                  </button>
                </div>
                {otpError && <p className="mt-2 text-xs font-bold text-red-600">Incorrect OTP — please check and try again.</p>}
                <p className="mt-3 rounded-lg bg-ivory px-3 py-2 text-xs text-slate-500">
                  Demo mode: no real SMS/email is sent. Your OTP is <span className="font-extrabold text-navy tracking-widest">{sentOtp}</span>.
                  In production this is delivered via the SMS/email gateway linked to the employee wallet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
