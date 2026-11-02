import { useState } from 'react';
import { Menu, X } from '../lib/icons';

interface NavbarProps {
  active: string;
  onSelect: (category: string) => void;
  counts: Record<string, number>;
  categories: string[];
}

export default function Navbar({ active, onSelect, counts, categories }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (cat: string) => {
    onSelect(cat);
    setOpen(false);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-line">
      {/* Tier 1 — brand row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          <a href="#top" className="flex items-center gap-2.5 lg:gap-3 group">
            <img
              src="/uploads/image-removebg-preview.png"
              alt="Manna Confectionaries & Patisseries logo"
              className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-base xs:text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-wood-dark whitespace-nowrap">
                Manna <span className="italic font-normal text-blush-ink">Accessories</span>
              </span>
              <span className="hidden lg:block mt-1 text-[10px] uppercase tracking-[0.28em] text-wood font-bold">
                Premium Baking Essentials
              </span>
            </span>
          </a>

          <div className="flex items-center gap-3 lg:gap-5">
            <div className="hidden lg:flex flex-col items-end leading-tight text-right">
              <span className="text-xs font-bold text-wood-dark">Mon–Sat · 9am–6pm</span>
              <a
                href="tel:+2348098765432"
                className="text-xs font-semibold text-wood hover:text-blush-ink transition-colors"
              >
                +234 809 876 5432
              </a>
            </div>
            <span className="hidden lg:block w-px h-8 bg-line" />
            <a
              href="#contact"
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-full bg-blush-deep text-wood-dark text-sm font-bold hover:bg-blush-ink hover:text-white transition-colors shadow-sm"
            >
              Order Now
            </a>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-md text-wood-dark hover:bg-paper"
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2 — category bar (desktop) */}
      <div className="hidden lg:block border-t border-line/70 bg-paper/50">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-center gap-1.5 h-12">
            <span className="text-[10px] uppercase tracking-[0.22em] text-wood/70 mr-4 font-bold whitespace-nowrap">
              Browse by
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelect(cat)}
                className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  active === cat
                    ? 'bg-wood-dark text-cream shadow-sm'
                    : 'text-wood-dark hover:bg-white hover:shadow-sm'
                }`}
              >
                {cat}
                {counts[cat] !== undefined && (
                  <span
                    className={`ml-1.5 text-[11px] ${
                      active === cat ? 'text-blush-deep' : 'text-blush-ink'
                    }`}
                  >
                    {counts[cat]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-line bg-cream px-4 py-4 max-h-[70dvh] overflow-y-auto overscroll-contain">
          <p className="text-[11px] uppercase tracking-[0.18em] text-wood font-bold mb-3">
            Browse by
          </p>
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelect(cat)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active === cat ? 'bg-wood-dark text-cream' : 'text-wood-dark hover:bg-paper'
                }`}
              >
                {cat}
                {counts[cat] !== undefined && (
                  <span className={`ml-2 text-xs ${active === cat ? 'text-blush' : 'text-blush-ink'}`}>
                    ({counts[cat]})
                  </span>
                )}
              </button>
            ))}
          </div>
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex w-full justify-center items-center px-4 py-2.5 rounded-full bg-blush-deep text-wood-dark text-sm font-bold"
          >
            Order Now
          </a>
        </div>
      )}
    </header>
  );
}
