import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Store,
  CreditCard,
} from '../lib/icons';
import type { Product } from '../lib/types';
import { formatNaira } from '../lib/types';
import SmartImage from '../components/SmartImage';

const TAG_STYLES: Record<string, string> = {
  'Best Seller': 'bg-blush-deep text-wood-dark border-blush-ink/30',
  New: 'bg-mint text-mint-ink border-mint-deep/30',
  Popular: 'bg-blush text-blush-ink border-blush-deep/30',
  'Special Edition': 'bg-wood-dark text-blush-deep border-wood-dark',
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        const res = await fetch(`/api/product?id=${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setProduct(await res.json());
        setActiveImage(0);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Your name is required.';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = 'Enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    else if (!/^[+\d][\d\s-]{6,}$/.test(form.phone.trim()))
      next.phone = 'Enter a valid phone number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !validate()) return;
    setPaying(true);
    setPayError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: qty,
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Could not start payment. Please try again.');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not start payment.');
      setPaying(false);
    }
  };

  const field = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
    if (payError) setPayError('');
  };

  const total = product ? Number(product.price) * qty : 0;

  return (
    <div className="min-h-screen bg-cream">
      {/* Simple header */}
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/uploads/image-removebg-preview.png"
              alt="Manna logo"
              className="w-10 h-10 object-contain"
            />
            <span className="font-display text-lg font-semibold text-wood-dark">
              Manna <span className="italic font-normal text-blush-ink">Accessories</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-wood hover:text-blush-ink transition-colors shrink-0"
          >
            <ArrowLeft size={16} /> <span className="hidden xs:inline">Back to shop</span><span className="xs:hidden">Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {loading && (
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="rounded-3xl bg-paper animate-pulse h-[420px]" />
            <div className="space-y-4">
              <div className="h-8 bg-paper rounded animate-pulse w-3/4" />
              <div className="h-6 bg-paper rounded animate-pulse w-1/3" />
              <div className="h-40 bg-paper rounded-2xl animate-pulse" />
            </div>
          </div>
        )}

        {notFound && !loading && (
          <div className="text-center py-24">
            <h1 className="font-display text-3xl font-semibold text-wood-dark">
              Product not found
            </h1>
            <p className="mt-2 text-wood">This item may have been removed from the catalog.</p>
            <Link
              to="/"
              className="mt-6 inline-flex px-6 py-3 rounded-full bg-wood-dark text-cream font-bold"
            >
              Browse the catalog
            </Link>
          </div>
        )}

        {product && !loading && (
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Image gallery */}
            <div className="lg:sticky lg:top-24">
              {(() => {
                const gallery = product.images?.length ? product.images : [product.image];
                const current = gallery[Math.min(activeImage, gallery.length - 1)];
                return (
                  <>
                    <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-wood-dark/10">
                      <SmartImage
                        src={current}
                        alt={`${product.name} — photo ${activeImage + 1}`}
                        className="w-full h-[260px] xs:h-[340px] sm:h-[460px] object-cover"
                      />
                      <span
                        className={`absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                          TAG_STYLES[product.tag] ?? 'bg-paper text-wood border-line'
                        }`}
                      >
                        {product.tag}
                      </span>
                      {gallery.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setActiveImage((i) => (i - 1 + gallery.length) % gallery.length)
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-wood-dark flex items-center justify-center shadow-md hover:bg-blush-deep transition-colors"
                            aria-label="Previous photo"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={() => setActiveImage((i) => (i + 1) % gallery.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-wood-dark flex items-center justify-center shadow-md hover:bg-blush-deep transition-colors"
                            aria-label="Next photo"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <span className="absolute bottom-3 right-3 bg-wood-dark/70 text-cream text-xs font-bold px-2.5 py-1 rounded-full">
                            {activeImage + 1} / {gallery.length}
                          </span>
                        </>
                      )}
                    </div>

                    {gallery.length > 1 && (
                      <div className="mt-3 grid grid-cols-5 gap-2.5">
                        {gallery.map((img, i) => (
                          <button
                            key={img + i}
                            onClick={() => setActiveImage(i)}
                            className={`rounded-xl overflow-hidden border-2 aspect-square transition-all ${
                              i === activeImage
                                ? 'border-blush-deep shadow-md'
                                : 'border-line opacity-70 hover:opacity-100'
                            }`}
                            aria-label={`View photo ${i + 1}`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                {[
                  { icon: ShieldCheck, label: 'Secure payment' },
                  { icon: Store, label: 'Lagos pickup' },
                  { icon: Truck, label: 'Nationwide delivery' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="bg-white border border-line rounded-2xl px-2 sm:px-3 py-3 sm:py-4"
                  >
                    <b.icon size={19} className="mx-auto text-mint-ink" />
                    <p className="mt-1.5 text-[10px] sm:text-xs font-bold text-wood-dark leading-tight">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Details + checkout */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-mint-ink font-bold">
                {product.category}
              </p>
              <h1 className="mt-2 font-display text-2xl xs:text-3xl sm:text-4xl font-semibold text-wood-dark tracking-tight">
                {product.name}
              </h1>
              <p className="mt-3 font-display text-3xl font-semibold text-blush-ink">
                {formatNaira(Number(product.price))}
              </p>
              <p className="mt-4 text-wood leading-relaxed">
                {product.description?.trim()
                  ? product.description
                  : `Premium quality ${product.category.toLowerCase()} from the Manna Accessories collection — durable, stylish, and made to elevate your baking. Pay securely online and pick up in-store or arrange delivery.`}
              </p>

              {(product.tags?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags!.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-paper border border-line text-xs font-bold text-wood"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div className="mt-7 flex items-center gap-5">
                <span className="text-sm font-bold text-wood-dark">Quantity</span>
                <div className="inline-flex items-center bg-white border border-line rounded-full">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="p-3 text-wood-dark hover:text-blush-ink disabled:opacity-40"
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-wood-dark">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(50, q + 1))}
                    className="p-3 text-wood-dark hover:text-blush-ink disabled:opacity-40"
                    disabled={qty >= 50}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Checkout card */}
              <div className="mt-8 bg-white rounded-3xl border border-line shadow-sm p-6 sm:p-7">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={18} className="text-blush-ink" />
                  <h2 className="font-display text-xl font-semibold text-wood-dark">Checkout</h2>
                </div>
                <p className="text-sm text-wood mb-5">
                  Pay with card, bank transfer or mobile money via Korapay.
                </p>

                <form onSubmit={checkout} className="space-y-4" noValidate>
                  <div>
                    <label className="block text-sm font-bold text-wood-dark mb-1.5">
                      Full Name <span className="text-blush-ink">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => field('name', e.target.value)}
                      placeholder="e.g. Adaeze Okafor"
                      className={`w-full rounded-xl border bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 ${
                        errors.name
                          ? 'border-blush-deep focus:ring-blush-deep/50'
                          : 'border-line focus:ring-blush-deep/40'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs font-semibold text-blush-ink">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-wood-dark mb-1.5">
                        Email <span className="text-blush-ink">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => field('email', e.target.value)}
                        placeholder="you@email.com"
                        className={`w-full rounded-xl border bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 ${
                          errors.email
                            ? 'border-blush-deep focus:ring-blush-deep/50'
                            : 'border-line focus:ring-blush-deep/40'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs font-semibold text-blush-ink">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-wood-dark mb-1.5">
                        Phone <span className="text-blush-ink">*</span>
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
                        <p className="mt-1.5 text-xs font-semibold text-blush-ink">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="rounded-2xl bg-paper/70 border border-line px-5 py-4 space-y-2 text-sm">
                    <div className="flex justify-between text-wood">
                      <span>
                        {product.name} × {qty}
                      </span>
                      <span>{formatNaira(Number(product.price) * qty)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-wood-dark border-t border-line pt-2">
                      <span>Total</span>
                      <span className="font-display text-lg text-blush-ink">
                        {formatNaira(total)}
                      </span>
                    </div>
                  </div>

                  {payError && (
                    <p className="text-sm font-semibold text-blush-ink">{payError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-wood-dark text-cream font-bold text-base hover:bg-wood transition-colors disabled:opacity-60 shadow-lg shadow-wood-dark/20"
                  >
                    {paying ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Redirecting to Korapay…
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Pay {formatNaira(total)} Securely
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-wood/70">
                    Secured by <span className="font-bold">Korapay</span> — cards, bank
                    transfer &amp; mobile money accepted.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
