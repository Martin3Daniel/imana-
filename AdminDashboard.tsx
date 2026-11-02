import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  UploadCloud,
  Package,
  ClipboardList,
  Users,
  ExternalLink,
  CreditCard,
  Search,
  Copy,
  Check,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from '../lib/icons';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Product, Category } from '../lib/types';
import { DEFAULT_CATEGORIES, formatNaira } from '../lib/types';
import { compressImage } from '../lib/compressImage';

const TAGS = ['New', 'Best Seller', 'Popular', 'Special Edition'];

interface OrderRow {
  id: number;
  name: string;
  phone: string;
  details: string;
  created_at: string;
}
interface SignupRow {
  id: number;
  name: string;
  created_at: string;
}
interface TxnRow {
  id: number;
  reference: string;
  product_name: string;
  quantity: number;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  created_at: string;
}

interface FormState {
  id: number | null;
  name: string;
  price: string;
  tag: string;
  category: string;
  images: string[];
  description: string;
  searchTags: string[];
}

const emptyForm: FormState = {
  id: null,
  name: '',
  price: '',
  tag: 'New',
  category: 'Baking Tools',
  images: [],
  description: '',
  searchTags: [],
};

export default function AdminDashboard() {
  const { session, user } = useAuth();
  const [tab, setTab] = useState<'products' | 'orders' | 'payments' | 'club'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Category creation state
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const uploading = uploadingCount > 0;
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Product table quick controls
  const [search, setSearch] = useState('');
  const [quickEditId, setQuickEditId] = useState<number | null>(null);
  const [quickPrice, setQuickPrice] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const quickPriceRef = useRef<HTMLInputElement>(null);

  const token = session?.access_token ?? '';

  const authHeaders = useCallback(
    (): Record<string, string> => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const fetchAll = useCallback(async () => {
    try {
      setError('');
      const [pRes, aRes, cRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/admin-data', { headers: authHeaders() }),
        fetch('/api/categories'),
      ]);
      if (!pRes.ok) throw new Error('Failed to load products');
      setProducts(await pRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (aRes.ok) {
        const data = await aRes.json();
        setOrders(data.orders ?? []);
        setSignups(data.signups ?? []);
        setTxns(data.transactions ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (token) fetchAll();
  }, [token, fetchAll]);

  /* ---------- Modal open helpers ---------- */

  const openAdd = useCallback(() => {
    setForm(emptyForm);
    setFormErrors({});
    setAiError('');
    setModalOpen(true);
  }, []);

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      price: String(p.price),
      tag: p.tag,
      category: p.category,
      images: p.images?.length ? [...p.images] : [p.image].filter(Boolean),
      description: p.description || '',
      searchTags: p.tags || [],
    });
    setFormErrors({});
    setAiError('');
    setModalOpen(true);
  };

  /* ---------- AI auto-fill from image ---------- */

  const aiAutofill = async () => {
    const image = form.images.find((i) => /^https?:\/\//.test(i));
    if (!image) {
      setAiError('Upload a product image first — the AI analyses the photo.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai-product', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ imageUrl: image }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'AI analysis failed');
      setForm((f) => ({
        ...f,
        name: f.name.trim() ? f.name : data.productName || f.name,
        category: data.category || f.category,
        description: data.description || f.description,
        searchTags: data.tags?.length ? data.tags : f.searchTags,
      }));
      showToast('AI filled in the product details — review and publish.');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Autofocus name field when the modal opens
  useEffect(() => {
    if (modalOpen) setTimeout(() => nameInputRef.current?.focus(), 60);
  }, [modalOpen]);

  // Keyboard shortcuts: N = new product, Esc = close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      } else if (!typing && !modalOpen && (e.key === 'n' || e.key === 'N') && tab === 'products') {
        e.preventDefault();
        openAdd();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, tab, openAdd]);

  /* ---------- Image upload (multi-file, compressed, drag & drop, paste) ---------- */

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setFormErrors((e) => ({ ...e, image: 'Please choose image files only.' }));
        return;
      }
      setUploadingCount((c) => c + 1);
      setFormErrors((e) => ({ ...e, image: '' }));

      // Instant local preview while uploading
      const localPreview = URL.createObjectURL(file);
      setForm((f) => ({ ...f, images: [...f.images, localPreview] }));

      try {
        const compressed = await compressImage(file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            fileName: compressed.fileName,
            fileBase64: compressed.base64,
            contentType: compressed.contentType,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Upload failed');
        }
        const { url } = await res.json();
        // Swap the local preview for the real URL, keeping position
        setForm((f) => ({
          ...f,
          images: f.images.map((img) => (img === localPreview ? url : img)),
        }));
      } catch (err) {
        setForm((f) => ({ ...f, images: f.images.filter((img) => img !== localPreview) }));
        setFormErrors((e) => ({
          ...e,
          image: err instanceof Error ? err.message : 'Upload failed',
        }));
      } finally {
        URL.revokeObjectURL(localPreview);
        setUploadingCount((c) => c - 1);
      }
    },
    [authHeaders]
  );

  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((f) => uploadFile(f));
    },
    [uploadFile]
  );

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((img) => img !== url) }));
  };

  const makeCover = (url: string) => {
    setForm((f) => ({ ...f, images: [url, ...f.images.filter((img) => img !== url)] }));
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setForm((f) => {
      const next = [...f.images];
      const target = index + dir;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, images: next };
    });
  };

  // Paste an image anywhere while the modal is open
  useEffect(() => {
    if (!modalOpen) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.type.startsWith('image/'))
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);
      if (files.length) {
        e.preventDefault();
        uploadFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [modalOpen, uploadFiles]);

  /* ---------- Save / duplicate / delete (optimistic) ---------- */

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Product name is required.';
    const price = Number(form.price);
    if (!form.price.trim() || isNaN(price) || price <= 0)
      next.price = 'Enter a valid price greater than 0.';
    const readyImages = form.images.filter((i) => !i.startsWith('blob:'));
    if (readyImages.length === 0) next.image = 'Upload at least one product image.';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      setFormErrors((fe) => ({ ...fe, submit: 'Wait for the image to finish uploading.' }));
      return;
    }
    if (!validate()) return;
    setSaving(true);
    try {
      const readyImages = form.images.filter((i) => !i.startsWith('blob:'));
      const payload = {
        id: form.id,
        name: form.name.trim(),
        price: Number(form.price),
        tag: form.tag,
        category: form.category,
        image: readyImages[0],
        images: readyImages,
        description: form.description.trim(),
        tags: form.searchTags,
      };
      const res = await fetch('/api/products', {
        method: form.id ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save product');

      // Optimistic local update — no full re-fetch needed
      if (form.id) {
        setProducts((ps) => ps.map((p) => (p.id === form.id ? data : p)));
        showToast('Product updated — live on the site.');
      } else {
        setProducts((ps) => [...ps, data]);
        showToast('Product published — live on the site.');
      }
      setModalOpen(false);
    } catch (err) {
      setFormErrors((fe) => ({
        ...fe,
        submit: err instanceof Error ? err.message : 'Could not save product',
      }));
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (p: Product) => {
    setDuplicatingId(p.id);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: `${p.name} (Copy)`,
          price: p.price,
          tag: p.tag,
          category: p.category,
          image: p.image,
          images: p.images?.length ? p.images : [p.image].filter(Boolean),
          description: p.description || '',
          tags: p.tags || [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not duplicate');
      setProducts((ps) => [...ps, data]);
      showToast('Product duplicated — edit the copy to customise it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not duplicate product');
    } finally {
      setDuplicatingId(null);
    }
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete “${p.name}”? It will disappear from the website.`)) return;
    setDeletingId(p.id);
    const prev = products;
    setProducts((ps) => ps.filter((x) => x.id !== p.id)); // optimistic
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ id: p.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not delete product');
      }
      showToast('Product deleted.');
    } catch (err) {
      setProducts(prev); // rollback
      setError(err instanceof Error ? err.message : 'Could not delete product');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Inline quick edits (price + tag) ---------- */

  const startQuickPrice = (p: Product) => {
    setQuickEditId(p.id);
    setQuickPrice(String(p.price));
    setTimeout(() => quickPriceRef.current?.select(), 50);
  };

  const commitQuickPrice = async (p: Product) => {
    const price = Number(quickPrice);
    setQuickEditId(null);
    if (!price || price <= 0 || price === Number(p.price)) return;
    setQuickSaving(true);
    const prev = products;
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, price } : x))); // optimistic
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...p, price }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not update price');
      }
      showToast(`Price updated to ${formatNaira(price)}.`);
    } catch (err) {
      setProducts(prev);
      setError(err instanceof Error ? err.message : 'Could not update price');
    } finally {
      setQuickSaving(false);
    }
  };

  const quickTag = async (p: Product, tag: string) => {
    if (tag === p.tag) return;
    const prev = products;
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, tag } : x))); // optimistic
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...p, tag }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not update tag');
      }
      showToast('Tag updated.');
    } catch (err) {
      setProducts(prev);
      setError(err instanceof Error ? err.message : 'Could not update tag');
    }
  };

  /* ---------- Category management ---------- */

  const categoryNames = useMemo(
    () => (categories.length ? categories.map((c) => c.name) : DEFAULT_CATEGORIES),
    [categories]
  );

  const createCategory = async () => {
    const clean = newCategory.trim().replace(/\s+/g, ' ');
    if (!clean) {
      setCategoryError('Enter a category name.');
      return;
    }
    setCategorySaving(true);
    setCategoryError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create category');
      setCategories((cs) => [...cs, data].sort((a, b) => a.name.localeCompare(b.name)));
      // Select the new category in the product form and close the inline input
      setForm((f) => ({ ...f, category: data.name }));
      setNewCategory('');
      setAddingCategory(false);
      showToast(`Category “${data.name}” created.`);
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Could not create category');
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (cat: Category) => {
    const inUse = products.filter((p) => p.category === cat.name).length;
    if (inUse > 0) {
      setError(`Cannot delete “${cat.name}” — ${inUse} product${inUse === 1 ? '' : 's'} still use it.`);
      return;
    }
    if (!window.confirm(`Delete the category “${cat.name}”?`)) return;
    setCategoryDeletingId(cat.id);
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ id: cat.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete category');
      setCategories((cs) => cs.filter((c) => c.id !== cat.id));
      showToast('Category deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category');
    } finally {
      setCategoryDeletingId(null);
    }
  };

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [products, search]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/uploads/image-removebg-preview.png"
              alt="Manna logo"
              className="w-10 h-10 object-contain"
            />
            <span className="font-display text-lg font-semibold text-wood-dark">
              Manna <span className="italic font-normal text-blush-ink">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-wood hover:text-blush-ink transition-colors"
            >
              View site <ExternalLink size={14} />
            </a>
            <span className="hidden md:block text-xs text-wood/70 max-w-[180px] truncate">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-line bg-white text-sm font-bold text-wood-dark hover:bg-blush hover:border-blush-deep/30 transition-colors"
            >
              <LogOut size={15} /> <span className="hidden xs:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Products live', value: products.length, icon: Package, tint: 'bg-mint text-mint-ink' },
            { label: 'Orders received', value: orders.length, icon: ClipboardList, tint: 'bg-blush text-blush-ink' },
            { label: 'Paid checkouts', value: txns.filter((t) => t.status === 'success').length, icon: CreditCard, tint: 'bg-wood-dark text-blush-deep' },
            { label: 'Club members', value: signups.length, icon: Users, tint: 'bg-blush-deep text-wood-dark' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-line p-5 flex items-center gap-4">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.tint}`}>
                <s.icon size={20} />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold text-wood-dark leading-none">
                  {loading ? '—' : s.value}
                </p>
                <p className="text-sm text-wood mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white border border-line rounded-full p-1 w-fit max-w-full overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none]">
          {(
            [
              ['products', 'Products'],
              ['orders', 'Orders'],
              ['payments', 'Payments'],
              ['club', 'Club Signups'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
                tab === key ? 'bg-wood-dark text-cream' : 'text-wood-dark hover:bg-paper'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-blush-deep/40 bg-blush/40 px-5 py-4 text-sm font-semibold text-blush-ink flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Dismiss" className="shrink-0">
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-wood">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading data…
          </div>
        ) : (
          <>
            {/* PRODUCTS TAB */}
            {tab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-wood-dark mr-auto">
                    Product Catalog
                  </h2>
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-wood/50" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products…"
                      className="w-full sm:w-60 rounded-full border border-line bg-white pl-10 pr-4 py-2.5 text-sm text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 focus:ring-blush-deep/40"
                    />
                  </div>
                  <button
                    onClick={() => setCategoryManagerOpen((v) => !v)}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-colors ${
                      categoryManagerOpen
                        ? 'bg-wood-dark text-cream border-wood-dark'
                        : 'bg-white text-wood-dark border-line hover:bg-mint'
                    }`}
                  >
                    <ClipboardList size={16} /> Categories
                  </button>
                  <button
                    onClick={openAdd}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blush-deep text-wood-dark text-sm font-bold hover:bg-blush-ink hover:text-white transition-colors shadow-md shadow-blush-deep/25"
                  >
                    <Plus size={17} /> Add Product
                    <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.5 rounded bg-wood-dark/10 text-[10px] font-mono">
                      N
                    </kbd>
                  </button>
                </div>

                {/* Category manager panel */}
                {categoryManagerOpen && (
                  <div className="mb-5 bg-white rounded-2xl border border-line p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display text-lg font-semibold text-wood-dark">
                        Store Categories
                      </h3>
                      <span className="text-xs text-wood/70">
                        {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {categories.map((cat) => {
                        const inUse = products.filter((p) => p.category === cat.name).length;
                        return (
                          <span
                            key={cat.id}
                            className="inline-flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-paper border border-line text-sm font-bold text-wood-dark"
                          >
                            {cat.name}
                            <span className="text-[10px] font-bold text-wood/60">{inUse}</span>
                            <button
                              onClick={() => deleteCategory(cat)}
                              disabled={categoryDeletingId === cat.id || inUse > 0}
                              className="p-1 rounded-full text-wood/50 hover:bg-blush hover:text-blush-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                inUse > 0
                                  ? `${inUse} product${inUse === 1 ? '' : 's'} use this category`
                                  : 'Delete category'
                              }
                              aria-label={`Delete ${cat.name}`}
                            >
                              {categoryDeletingId === cat.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <X size={12} />
                              )}
                            </button>
                          </span>
                        );
                      })}
                      {categories.length === 0 && (
                        <p className="text-sm text-wood">No categories yet.</p>
                      )}
                    </div>
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value);
                          if (categoryError) setCategoryError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') createCategory();
                        }}
                        placeholder="New category name…"
                        maxLength={40}
                        className="flex-1 rounded-full border border-line bg-cream px-4 py-2.5 text-sm text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 focus:ring-mint-deep/40"
                      />
                      <button
                        onClick={createCategory}
                        disabled={categorySaving}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-mint-ink text-white text-sm font-bold hover:bg-wood-dark transition-colors disabled:opacity-60 shrink-0"
                      >
                        {categorySaving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        Add
                      </button>
                    </div>
                    {categoryError && (
                      <p className="mt-2 text-xs font-semibold text-blush-ink">{categoryError}</p>
                    )}
                    <p className="mt-3 text-xs text-wood/60">
                      New categories appear instantly in the storefront's "Browse by" bar. Categories
                      with products can't be deleted — reassign the products first.
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-line overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                      <thead>
                        <tr className="border-b border-line bg-paper/60 text-left">
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Product</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Category</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Tag</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Price</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleProducts.map((p) => (
                          <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper/40">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-11 h-11 rounded-lg object-cover border border-line"
                                  />
                                  {(p.images?.length ?? 0) > 1 && (
                                    <span className="absolute -bottom-1 -right-1 bg-wood-dark text-blush-deep text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                      {p.images!.length}
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-wood-dark">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-wood">{p.category}</td>
                            <td className="px-5 py-3">
                              <select
                                value={p.tag}
                                onChange={(e) => quickTag(p, e.target.value)}
                                className="rounded-full bg-mint text-mint-ink text-[11px] font-bold uppercase tracking-wide border-0 px-2.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-deep/40"
                                title="Change tag"
                              >
                                {TAGS.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              {quickEditId === p.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    ref={quickPriceRef}
                                    type="number"
                                    min="0"
                                    value={quickPrice}
                                    onChange={(e) => setQuickPrice(e.target.value)}
                                    onBlur={() => commitQuickPrice(p)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitQuickPrice(p);
                                      if (e.key === 'Escape') setQuickEditId(null);
                                    }}
                                    className="w-24 rounded-lg border border-blush-deep bg-cream px-2 py-1.5 text-sm font-bold text-wood-dark focus:outline-none focus:ring-2 focus:ring-blush-deep/50"
                                  />
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      commitQuickPrice(p);
                                    }}
                                    className="p-1.5 rounded-lg bg-mint text-mint-ink"
                                    aria-label="Save price"
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startQuickPrice(p)}
                                  className="group/price inline-flex items-center gap-1.5 font-display font-semibold text-blush-ink hover:text-wood-dark transition-colors"
                                  title="Click to edit price"
                                >
                                  {quickSaving && quickEditId === p.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : null}
                                  {formatNaira(Number(p.price))}
                                  <Pencil size={11} className="opacity-0 group-hover/price:opacity-60" />
                                </button>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEdit(p)}
                                  className="p-2 rounded-lg text-wood hover:bg-mint hover:text-mint-ink transition-colors"
                                  aria-label={`Edit ${p.name}`}
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => duplicate(p)}
                                  disabled={duplicatingId === p.id}
                                  className="p-2 rounded-lg text-wood hover:bg-blush hover:text-blush-ink transition-colors disabled:opacity-50"
                                  aria-label={`Duplicate ${p.name}`}
                                  title="Duplicate"
                                >
                                  {duplicatingId === p.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => remove(p)}
                                  disabled={deletingId === p.id}
                                  className="p-2 rounded-lg text-wood hover:bg-blush hover:text-blush-ink transition-colors disabled:opacity-50"
                                  aria-label={`Delete ${p.name}`}
                                  title="Delete"
                                >
                                  {deletingId === p.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {visibleProducts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-wood">
                              {search
                                ? `No products match “${search}”.`
                                : 'No products yet. Click “Add Product” to publish your first item.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-3 text-xs text-wood/70">
                  Tip: click a price to edit it inline · change tags directly from the table ·
                  press <kbd className="px-1 py-0.5 rounded bg-white border border-line font-mono text-[10px]">N</kbd> to add a product.
                </p>
              </div>
            )}

            {/* ORDERS TAB */}
            {tab === 'orders' && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-wood-dark mb-5">
                  Customer Orders
                </h2>
                <div className="bg-white rounded-2xl border border-line overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b border-line bg-paper/60 text-left">
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Name</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Phone</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Order Details</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-b border-line last:border-0 hover:bg-paper/40 align-top">
                            <td className="px-5 py-3 font-bold text-wood-dark">{o.name || '—'}</td>
                            <td className="px-5 py-3">
                              <a href={`tel:${o.phone}`} className="text-blush-ink font-semibold hover:underline">
                                {o.phone}
                              </a>
                            </td>
                            <td className="px-5 py-3 text-wood max-w-md">{o.details}</td>
                            <td className="px-5 py-3 text-wood whitespace-nowrap">
                              {new Date(o.created_at).toLocaleString('en-NG', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-wood">
                              No orders yet — they'll appear here as customers submit the Get in Touch form.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {tab === 'payments' && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-wood-dark mb-5">
                  Korapay Checkouts
                </h2>
                <div className="bg-white rounded-2xl border border-line overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[760px]">
                      <thead>
                        <tr className="border-b border-line bg-paper/60 text-left">
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Reference</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Product</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Customer</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Amount</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Status</th>
                          <th className="px-5 py-3.5 font-bold text-wood-dark">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txns.map((t) => (
                          <tr key={t.id} className="border-b border-line last:border-0 hover:bg-paper/40 align-top">
                            <td className="px-5 py-3 font-mono text-xs text-wood">{t.reference}</td>
                            <td className="px-5 py-3 text-wood-dark font-bold">
                              {t.product_name} <span className="text-wood font-normal">× {t.quantity}</span>
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-bold text-wood-dark">{t.customer_name}</p>
                              <p className="text-xs text-wood">{t.customer_email}</p>
                              <a href={`tel:${t.customer_phone}`} className="text-xs text-blush-ink font-semibold hover:underline">
                                {t.customer_phone}
                              </a>
                            </td>
                            <td className="px-5 py-3 font-display font-semibold text-blush-ink whitespace-nowrap">
                              {formatNaira(Number(t.amount))}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                                  t.status === 'success'
                                    ? 'bg-mint text-mint-ink'
                                    : t.status === 'failed'
                                    ? 'bg-blush text-blush-ink'
                                    : 'bg-blush text-blush-ink'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-wood whitespace-nowrap">
                              {new Date(t.created_at).toLocaleString('en-NG', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </td>
                          </tr>
                        ))}
                        {txns.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-wood">
                              No checkout payments yet — they'll appear here when customers pay via Korapay.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CLUB TAB */}
            {tab === 'club' && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-wood-dark mb-5">
                  Join Our Club Signups
                </h2>
                <div className="bg-white rounded-2xl border border-line overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-paper/60 text-left">
                        <th className="px-5 py-3.5 font-bold text-wood-dark">Name</th>
                        <th className="px-5 py-3.5 font-bold text-wood-dark">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signups.map((s) => (
                        <tr key={s.id} className="border-b border-line last:border-0 hover:bg-paper/40">
                          <td className="px-5 py-3 font-bold text-wood-dark">{s.name}</td>
                          <td className="px-5 py-3 text-wood">
                            {new Date(s.created_at).toLocaleString('en-NG', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                        </tr>
                      ))}
                      {signups.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-5 py-12 text-center text-wood">
                            No club members yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-wood-dark text-cream px-5 sm:px-6 py-3 rounded-full text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 w-max max-w-[92vw] text-center">
          <Check size={15} className="text-blush-deep" />
          {toast}
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-wood-dark/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl border border-line shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 sm:px-7 pt-6">
              <h3 className="font-display text-2xl font-semibold text-wood-dark">
                {form.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-wood hover:bg-paper"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={save} className="px-6 sm:px-7 pb-7 pt-4 space-y-4" noValidate>
              {/* Image upload — multiple images, drag & drop, click, or paste */}
              <div>
                <label className="block text-sm font-bold text-wood-dark mb-1.5">
                  Product Images <span className="text-blush-ink">*</span>
                  <span className="ml-2 font-normal text-xs text-wood/60">
                    first image is the cover · {form.images.length} added
                  </span>
                </label>

                {/* Thumbnails grid */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2.5">
                    {form.images.map((img, i) => (
                      <div
                        key={img}
                        className={`group/thumb relative rounded-xl overflow-hidden border-2 aspect-square ${
                          i === 0 ? 'border-blush-deep' : 'border-line'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Product image ${i + 1}`}
                          className={`w-full h-full object-cover ${
                            img.startsWith('blob:') ? 'opacity-50' : ''
                          }`}
                        />
                        {img.startsWith('blob:') && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Loader2 size={18} className="animate-spin text-wood-dark" />
                          </span>
                        )}
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-blush-deep text-wood-dark text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                            Cover
                          </span>
                        )}
                        {/* Hover controls */}
                        {!img.startsWith('blob:') && (
                          <div className="absolute inset-0 bg-wood-dark/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {i !== 0 && (
                              <button
                                type="button"
                                onClick={() => makeCover(img)}
                                className="p-1.5 rounded-lg bg-blush-deep text-wood-dark"
                                title="Make cover image"
                              >
                                <ImagePlus size={13} />
                              </button>
                            )}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(i, -1)}
                                className="p-1.5 rounded-lg bg-white/90 text-wood-dark"
                                title="Move earlier"
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}
                            {i < form.images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(i, 1)}
                                className="p-1.5 rounded-lg bg-white/90 text-wood-dark"
                                title="Move later"
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(img)}
                              className="p-1.5 rounded-lg bg-blush text-blush-ink"
                              title="Remove image"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed cursor-pointer transition-all h-24 ${
                    dragOver
                      ? 'border-mint-deep bg-mint/40 scale-[1.01]'
                      : formErrors.image
                      ? 'border-blush-deep bg-blush/20'
                      : 'border-line bg-cream hover:border-mint-deep/60 hover:bg-mint/20'
                  }`}
                >
                  {uploading ? (
                    <span className="flex items-center gap-2 text-wood text-sm font-semibold">
                      <Loader2 size={16} className="animate-spin" /> Uploading {uploadingCount} image
                      {uploadingCount > 1 ? 's' : ''}…
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-2 text-sm font-semibold text-wood">
                        <UploadCloud size={18} className="text-mint-ink" />
                        {form.images.length > 0 ? 'Add more images' : 'Drop images here, click to browse, or paste'}
                      </span>
                      <span className="text-xs text-wood/60">
                        Select multiple at once · auto-compressed for fast upload
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files?.length) uploadFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
                {formErrors.image && (
                  <p className="mt-1.5 text-xs font-semibold text-blush-ink">{formErrors.image}</p>
                )}
              </div>

              {/* AI auto-fill */}
              <div className="rounded-2xl border border-mint-deep/30 bg-mint/30 p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles size={17} className="text-mint-ink" />
                    <div>
                      <p className="text-sm font-bold text-wood-dark leading-tight">
                        AI Auto-fill <span className="font-normal text-wood/60">· Kilocode</span>
                      </p>
                      <p className="text-xs text-wood">
                        Analyses your photo & writes the name, description, category and tags
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={aiAutofill}
                    disabled={aiLoading || uploading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-mint-ink text-white text-sm font-bold hover:bg-wood-dark transition-colors disabled:opacity-60"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Analysing…
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Generate details
                      </>
                    )}
                  </button>
                </div>
                {aiError && (
                  <p className="mt-2 text-xs font-semibold text-blush-ink">{aiError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-wood-dark mb-1.5">
                  Product Name <span className="text-blush-ink">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Stainless Steel Piping Nozzle Set"
                  className={`w-full rounded-xl border bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? 'border-blush-deep focus:ring-blush-deep/50'
                      : 'border-line focus:ring-blush-deep/40'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1.5 text-xs font-semibold text-blush-ink">{formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-wood-dark mb-1.5">
                    Price (₦) <span className="text-blush-ink">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="2500"
                    className={`w-full rounded-xl border bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 ${
                      formErrors.price
                        ? 'border-blush-deep focus:ring-blush-deep/50'
                        : 'border-line focus:ring-blush-deep/40'
                    }`}
                  />
                  {formErrors.price && (
                    <p className="mt-1.5 text-xs font-semibold text-blush-ink">{formErrors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-wood-dark mb-1.5">Tag</label>
                  <select
                    value={form.tag}
                    onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-wood-dark focus:outline-none focus:ring-2 focus:ring-blush-deep/40"
                  >
                    {TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-wood-dark">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCategory((v) => !v);
                      setCategoryError('');
                      setNewCategory('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-mint-ink hover:text-wood-dark transition-colors"
                  >
                    {addingCategory ? (
                      <>
                        <X size={12} /> Cancel
                      </>
                    ) : (
                      <>
                        <Plus size={12} /> New category
                      </>
                    )}
                  </button>
                </div>

                {addingCategory ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => {
                          setNewCategory(e.target.value);
                          if (categoryError) setCategoryError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            createCategory();
                          }
                        }}
                        placeholder="e.g. Cake Toppers"
                        maxLength={40}
                        autoFocus
                        className={`flex-1 rounded-xl border bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 ${
                          categoryError
                            ? 'border-blush-deep focus:ring-blush-deep/50'
                            : 'border-line focus:ring-mint-deep/40'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={createCategory}
                        disabled={categorySaving}
                        className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-mint-ink text-white text-sm font-bold hover:bg-wood-dark transition-colors disabled:opacity-60 shrink-0"
                      >
                        {categorySaving ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Check size={15} />
                        )}
                        Create
                      </button>
                    </div>
                    {categoryError && (
                      <p className="mt-1.5 text-xs font-semibold text-blush-ink">{categoryError}</p>
                    )}
                  </div>
                ) : (
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-wood-dark focus:outline-none focus:ring-2 focus:ring-blush-deep/40"
                  >
                    {categoryNames.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {/* Keep the current value selectable even if its category was removed */}
                    {!categoryNames.includes(form.category) && form.category && (
                      <option value={form.category}>{form.category}</option>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-wood-dark mb-1.5">
                  Description{' '}
                  <span className="font-normal text-xs text-wood/60">
                    shown on the product page
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Premium description — or let the AI write it for you"
                  className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 focus:ring-blush-deep/40 resize-none"
                />
              </div>

              {form.searchTags.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-wood-dark mb-1.5">
                    Search Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {form.searchTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper border border-line text-xs font-bold text-wood-dark"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              searchTags: f.searchTags.filter((x) => x !== t),
                            }))
                          }
                          className="text-wood/60 hover:text-blush-ink"
                          aria-label={`Remove tag ${t}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formErrors.submit && (
                <p className="text-sm font-semibold text-blush-ink">{formErrors.submit}</p>
              )}

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1 -mb-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-full border border-line bg-white text-wood-dark font-bold hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blush-deep text-wood-dark font-bold hover:bg-blush-ink hover:text-white transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {uploading ? 'Uploading image…' : form.id ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
