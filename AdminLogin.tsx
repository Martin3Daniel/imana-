import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Loader2, Lock } from '../lib/icons';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLogin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError('Invalid email or password.');
      return;
    }
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <img
            src="/uploads/image-removebg-preview.png"
            alt="Manna Confectionaries & Patisseries logo"
            className="w-24 h-24 object-contain"
          />
          <span className="font-display text-xl font-semibold text-wood-dark">
            Manna <span className="italic font-normal text-blush-ink">Admin</span>
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-line shadow-sm p-7 sm:p-8">
          <div className="flex items-center gap-2 text-wood-dark mb-1">
            <Lock size={17} className="text-blush-ink" />
            <h1 className="font-display text-2xl font-semibold">Staff Sign In</h1>
          </div>
          <p className="text-sm text-wood mb-6">Manage the product catalog and orders.</p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-bold text-wood-dark mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mannaaccessories.com"
                className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 focus:ring-blush-deep/40"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-wood-dark mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-wood-dark placeholder:text-wood/40 focus:outline-none focus:ring-2 focus:ring-blush-deep/40"
              />
            </div>
            {error && <p className="text-sm font-semibold text-blush-ink">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-wood-dark text-cream font-bold hover:bg-wood transition-colors disabled:opacity-60"
            >
              {busy && <Loader2 size={17} className="animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="mt-6 text-xs text-wood/70 text-center">
            Demo access: admin@mannaaccessories.com / manna2024
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <a href="/" className="text-wood hover:text-blush-ink font-semibold transition-colors">
            ← Back to the store
          </a>
        </p>
      </div>
    </div>
  );
}
