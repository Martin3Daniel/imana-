import { Star, ArrowDown } from '../lib/icons';

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-line">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blush/50 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-mint/60 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="animate-rise">
          {/* Rating badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-line rounded-full px-4 py-2 shadow-sm mb-6">
            <span className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-blush-deep text-blush-deep" />
              ))}
            </span>
            <span className="text-sm font-bold text-wood-dark">Rated 4.9/5</span>
            <span className="text-xs text-wood">by home bakers</span>
          </div>

          <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] text-wood-dark tracking-tight">
            Premium Baking Essentials,{' '}
            <span className="italic text-blush-ink">Timeless Craft</span>
          </h1>

          <p className="mt-5 text-lg text-wood max-w-lg leading-relaxed">
            Durable tools crafted with style to elevate your baking experience.
          </p>

          <div className="mt-8 flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3 sm:gap-4">
            <a
              href="#catalog"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-wood-dark text-cream font-bold text-base hover:bg-wood transition-colors shadow-lg shadow-wood-dark/20"
            >
              Shop Now
              <ArrowDown size={17} />
            </a>
            <a
              href="#featured"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border-2 border-mint-deep/40 text-mint-ink font-bold text-base hover:bg-mint transition-colors"
            >
              Decorating Kits
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 sm:flex sm:gap-8 text-xs sm:text-sm">
            <div>
              <p className="font-display text-xl sm:text-2xl font-semibold text-wood-dark">17+</p>
              <p className="text-wood">Curated Products</p>
            </div>
            <div className="border-l border-line pl-4 sm:pl-8">
              <p className="font-display text-xl sm:text-2xl font-semibold text-wood-dark">Lagos</p>
              <p className="text-wood">Ajao Estate Store</p>
            </div>
            <div className="border-l border-line pl-4 sm:pl-8">
              <p className="font-display text-xl sm:text-2xl font-semibold text-wood-dark">Mon–Sat</p>
              <p className="text-wood">9am – 6pm</p>
            </div>
          </div>
        </div>

        <div className="relative animate-pop">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-wood-dark/15 border-4 border-white rotate-1">
            <img
              src="/images/hero.jpg"
              alt="Colorful baking mats and cake decorating tools on a pastel wooden countertop"
              className="w-full h-[240px] xs:h-[300px] sm:h-[420px] object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-3 sm:-left-6 bg-white rounded-2xl shadow-xl border border-line px-5 py-3 -rotate-2">
            <p className="text-xs uppercase tracking-widest text-blush-ink font-bold">Fresh Stock</p>
            <p className="font-display font-semibold text-wood-dark">Silicone Mats &amp; Kits</p>
          </div>
          <div className="absolute -top-4 -right-2 sm:-right-4 bg-mint rounded-2xl shadow-lg px-5 py-3 rotate-3">
            <p className="font-display font-semibold text-mint-ink text-sm">From ₦500</p>
          </div>
        </div>
      </div>
    </section>
  );
}
