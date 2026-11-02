import { useState } from 'react';
import { MessageCircle, Loader2, CheckCircle2, MapPin, Phone } from '../lib/icons';

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', details: '' });
  const [errors, setErrors] = useState<{ phone?: string; details?: string }>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const validate = () => {
    const next: { phone?: string; details?: string } = {};
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    else if (!/^[+\d][\d\s-]{6,}$/.test(form.phone.trim()))
      next.phone = 'Enter a valid phone number.';
    if (!form.details.trim()) next.details = 'Please tell us what you need.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not send your order. Please try again.');
      }
      setStatus('success');
      setForm({ name: '', phone: '', details: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const field = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as 'phone' | 'details']) setErrors((e) => ({ ...e, [key]: undefined }));
    if (status === 'error') setStatus('idle');
  };

  return (
    <section id="contact" className="border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-[2px] bg-blush-deep" />
            <p className="text-[11px] uppercase tracking-[0.22em] text-blush-ink font-bold">
              Instant Order
            </p>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-wood-dark tracking-tight">
            Get in Touch
          </h2>
          <p className="mt-3 text-lg text-wood leading-relaxed max-w-md">
            Questions or orders? Reach us at our Lagos store or via WhatsApp anytime.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-blush flex items-center justify-center text-blush-ink shrink-0">
                <MapPin size={18} />
              </span>
              <div>
                <p className="font-bold text-wood-dark">31b Lateef Salami, Ajao Estate</p>
                <p className="text-sm text-wood">Lagos, Nigeria · Mon–Sat 9am–6pm</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-mint flex items-center justify-center text-mint-ink shrink-0">
                <Phone size={18} />
              </span>
              <div>
                <p className="font-bold text-wood-dark">+234 809 876 5432</p>
                <p className="text-sm text-wood">Calls &amp; WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-line shadow-sm p-6 sm:p-8">
          {status === 'success' ? (
            <div className="text-center py-10">
              <span className="inline-flex w-14 h-14 rounded-full bg-mint items-center justify-center text-mint-ink mb-4">
                <CheckCircle2 size={26} />
              </span>
              <h3 className="font-display text-2xl font-semibold text-wood-dark">Order received!</h3>
              <p className="mt-2 text-wood">
                We'll reach out on WhatsApp or by phone shortly to confirm.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-6 px-6 py-2.5 rounded-full bg-wood-dark text-cream text-sm font-bold"
              >
                Send another order
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-bold text-wood-dark mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => field('name', e.target.value)}
                  placeholder="e.g. Adaeze Okafor"
                  className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 focus:ring-blush-deep/40"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-wood-dark mb-1.5">
                  Phone Number <span className="text-blush-ink">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => field('phone', e.target.value)}
                  placeholder="+234 800 000 0000"
                  className={`w-full rounded-xl border bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-blush-deep focus:ring-blush-deep/50'
                      : 'border-line focus:ring-blush-deep/40'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs font-semibold text-blush-ink">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-wood-dark mb-1.5">
                  Order Details <span className="text-blush-ink">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.details}
                  onChange={(e) => field('details', e.target.value)}
                  placeholder="e.g. 2x Silicone Rolling Pin, 1x Digital Kitchen Scale — pickup on Saturday"
                  className={`w-full rounded-xl border bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 resize-none ${
                    errors.details
                      ? 'border-blush-deep focus:ring-blush-deep/50'
                      : 'border-line focus:ring-blush-deep/40'
                  }`}
                />
                {errors.details && (
                  <p className="mt-1.5 text-xs font-semibold text-blush-ink">{errors.details}</p>
                )}
              </div>
              {status === 'error' && (
                <p className="text-sm font-semibold text-blush-ink">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-blush-deep text-white font-bold text-base hover:bg-blush-ink transition-colors disabled:opacity-60 shadow-lg shadow-blush-deep/25"
              >
                {status === 'loading' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MessageCircle size={18} />
                )}
                Send Order
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
