import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from '../lib/icons';

export default function Newsletter() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus('error');
      setErrorMsg('Please enter your name.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setStatus('success');
      setName('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <section className="border-b border-line bg-mint/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-16 text-center">
        <span className="inline-flex w-12 h-12 rounded-full bg-white border border-line items-center justify-center text-mint-ink mb-5 shadow-sm">
          <Mail size={20} />
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-wood-dark tracking-tight">
          Join Our Club
        </h2>
        <p className="mt-2 text-wood text-lg">Get fresh baking tips and exclusive deals</p>

        {status === 'success' ? (
          <div className="mt-8 inline-flex items-center gap-2 bg-white border border-mint-deep/40 rounded-full px-6 py-3.5 text-mint-ink font-bold shadow-sm">
            <CheckCircle2 size={19} />
            Welcome to the club! Fresh tips are on the way.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder="Your Name"
              className="flex-1 rounded-full border border-line bg-white px-5 py-3 text-wood-dark placeholder:text-wood/50 focus:outline-none focus:ring-2 focus:ring-mint-deep/50 shadow-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-mint-ink text-white font-bold hover:bg-wood-dark transition-colors disabled:opacity-60 shadow-md"
            >
              {status === 'loading' && <Loader2 size={17} className="animate-spin" />}
              Send Message
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-3 text-sm font-semibold text-blush-ink">{errorMsg}</p>
        )}
      </div>
    </section>
  );
}
