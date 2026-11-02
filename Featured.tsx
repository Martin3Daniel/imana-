import { Sparkles, Award } from '../lib/icons';

export default function Featured() {
  return (
    <section id="featured" className="border-b border-line bg-paper/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-8 h-[2px] bg-blush-deep" />
          <p className="text-[11px] uppercase tracking-[0.22em] text-blush-ink font-bold">
            Featured Spotlight
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Decorating Kits */}
          <div className="group relative rounded-3xl overflow-hidden bg-white border border-line shadow-sm hover:shadow-xl transition-shadow">
            <img
              src="/images/featured-kits.jpg"
              alt="Cake decorating kit with spatulas, scrapers and brushes"
              className="w-full h-56 sm:h-64 object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-2 text-mint-ink mb-2">
                <Sparkles size={17} />
                <span className="text-xs uppercase tracking-widest font-bold">Category Spotlight</span>
              </div>
              <h3 className="font-display text-2xl font-semibold text-wood-dark">Decorating Kits</h3>
              <p className="mt-2 text-wood leading-relaxed">
                Spatulas, scrapers, brushes and turntables — everything you need to finish every
                cake with a professional touch.
              </p>
              <a
                href="#catalog"
                className="mt-4 inline-flex text-sm font-bold text-blush-ink hover:text-wood-dark transition-colors"
              >
                Explore the collection →
              </a>
            </div>
          </div>

          {/* Wilton Products */}
          <div className="group relative rounded-3xl overflow-hidden bg-wood-dark text-cream shadow-sm hover:shadow-xl transition-shadow">
            <img
              src="/images/featured-wilton.jpg"
              alt="Premium baking tools and supplies arranged neatly"
              className="w-full h-56 sm:h-64 object-cover opacity-90 group-hover:scale-[1.03] transition-transform duration-500"
            />
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-2 text-blush mb-2">
                <Award size={17} />
                <span className="text-xs uppercase tracking-widest font-bold">Trusted Brand</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">Wilton Products</h3>
              <p className="mt-2 text-cream/80 leading-relaxed">
                Wilton Products – A Leading Brand in the Baking Industry Offering a Wide Range of
                Quality Tools and Supplies for All Your Baking Needs.
              </p>
              <a
                href="#catalog"
                className="mt-4 inline-flex text-sm font-bold text-mint hover:text-white transition-colors"
              >
                Shop Wilton favourites →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
