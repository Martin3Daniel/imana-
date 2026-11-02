import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Featured from './components/Featured';
import Catalog from './components/Catalog';
import Newsletter from './components/Newsletter';
import Contact from './components/Contact';
import Footer from './components/Footer';
import type { Product } from './lib/types';
import { DEFAULT_CATEGORIES } from './lib/types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('All Products');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);
        if (!pRes.ok) throw new Error('Failed to load products');
        setProducts(await pRes.json());
        if (cRes.ok) {
          const cats = await cRes.json();
          if (Array.isArray(cats) && cats.length) {
            setCategories(cats.map((c: { name: string }) => c.name));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const navCategories = useMemo(() => ['All Products', ...categories], [categories]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { 'All Products': products.length };
    for (const cat of categories) {
      map[cat] = products.filter((p) => p.category === cat).length;
    }
    return map;
  }, [products, categories]);

  return (
    <div className="min-h-screen">
      <Navbar active={category} onSelect={setCategory} counts={counts} categories={navCategories} />
      <main>
        <Hero />
        <Featured />
        <Catalog products={products} loading={loading} error={error} category={category} />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
