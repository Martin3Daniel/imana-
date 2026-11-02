import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from '../lib/icons';
import SmartImage from './SmartImage';
import type { Product, SortOption } from '../lib/types';
import { formatNaira } from '../lib/types';

interface CatalogProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  category: string;
}

const TAG_STYLES: Record<string, string> = {
  'Best Seller': 'bg-blush-deep text-wood-dark border-blush-ink/30',
  New: 'bg-mint text-mint-ink border-mint-deep/30',
  Popular: 'bg-blush text-blush-ink border-blush-deep/30',
  'Special Edition': 'bg-wood-dark text-blush-deep border-wood-dark',
};

export default function Catalog({ products, loading, error, category }: CatalogProps) {
  const [sort, setSort] = useState<SortOption>('default');

  const visible = useMemo(() => {
    let list =
      category === 'All Products'
        ? [...products]
        : products.filter((p) => p.category === category);

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'recent':
        list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      default:
        list.sort((a, b) => a.id - b.id);
    }
    return list;
  }, [products, category, sort]);

  return (
    <section id="catalog" className="border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-[2px] bg-mint-deep" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-mint-ink font-bold">
                The Catalog
              </p>
            </div>
            <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl font-semibold text-wood-dark tracking-tight">
              {category}
              <span className="ml-3 text-sm sm:text-base font-body font-semibold text-wood align-middle">
                {loading ? '' : `${visible.length} item${visible.length === 1 ? '' : 's'}`}
              </span>
            </h2>
          </div>

          {/* Sort dropdown */}
          <label className="relative inline-flex items-center w-full sm:w-auto">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none w-full sm:w-auto bg-white border border-line rounded-full pl-5 pr-10 py-2.5 text-sm font-semibold text-wood-dark shadow-sm cursor-pointer hover:border-wood/40 focus:outline-none focus:ring-2 focus:ring-blush-deep/40"
            >
              <option value="default">Sort by: Default</option>
              <option value="price-asc">Price (low to high)</option>
              <option value="price-desc">Price (high to low)</option>
              <option value="recent">Most recent</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 text-wood pointer-events-none"
            />
          </label>
        </div>

        {loading && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-line bg-white overflow-hidden">
                <div className="h-52 bg-paper animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-paper rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-paper rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-blush-deep/40 bg-blush/40 p-8 text-center">
            <p className="font-bold text-blush-ink">Couldn't load products</p>
            <p className="text-sm text-wood mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2 rounded-full bg-wood-dark text-cream text-sm font-bold"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {visible.map((product, i) => (
              <article
                key={product.id}
                style={{ animationDelay: `${(i % 4) * 60}ms` }}
                className="group animate-rise rounded-2xl border border-line bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <Link to={`/product/${product.id}`} className="block relative h-44 sm:h-52 overflow-hidden bg-paper">
                  <SmartImage
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                      TAG_STYLES[product.tag] ?? 'bg-paper text-wood border-line'
                    }`}
                  >
                    {product.tag}
                  </span>
                </Link>
                <div className="p-4 sm:p-5">
                  <p className="text-[11px] uppercase tracking-widest text-wood/70 font-bold mb-1">
                    {product.category}
                  </p>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-bold text-wood-dark leading-snug min-h-[2.6em] hover:text-blush-ink transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-display text-lg font-semibold text-blush-ink">
                      {formatNaira(product.price)}
                    </p>
                    <Link
                      to={`/product/${product.id}`}
                      className="text-xs font-bold px-3.5 py-2 rounded-full bg-wood-dark text-cream hover:bg-blush-deep transition-colors"
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
