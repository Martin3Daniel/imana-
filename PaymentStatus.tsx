import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from '../lib/icons';
import { formatNaira } from '../lib/types';

interface Txn {
  reference: string;
  product_name: string;
  quantity: number;
  amount: number;
  customer_name: string;
  customer_email: string;
  status: string;
}

export default function PaymentStatus() {
  const [params] = useSearchParams();
  const reference = params.get('reference');
  const [state, setState] = useState<'loading' | 'success' | 'failed' | 'pending' | 'error'>(
    'loading'
  );
  const [txn, setTxn] = useState<Txn | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const verify = async () => {
    if (!reference) {
      setState('error');
      setErrorMsg('Missing payment reference.');
      return;
    }
    setState('loading');
    try {
      const res = await fetch(`/api/verify-payment?reference=${encodeURIComponent(reference)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not verify payment.');
      setTxn(data.transaction);
      if (data.status === 'success') setState('success');
      else if (data.status === 'failed') setState('failed');
      else setState('pending');
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not verify payment.');
    }
  };

  useEffect(() => {
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="bg-cream border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
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
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md bg-white rounded-3xl border border-line shadow-sm p-8 text-center">
          {state === 'loading' && (
            <>
              <Loader2 size={40} className="mx-auto animate-spin text-wood" />
              <h1 className="mt-5 font-display text-2xl font-semibold text-wood-dark">
                Verifying your payment…
              </h1>
              <p className="mt-2 text-wood text-sm">Hold on while we confirm with Korapay.</p>
            </>
          )}

          {state === 'success' && txn && (
            <>
              <span className="inline-flex w-16 h-16 rounded-full bg-mint items-center justify-center text-mint-ink">
                <CheckCircle2 size={32} />
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold text-wood-dark">
                Payment successful!
              </h1>
              <p className="mt-2 text-wood text-sm">
                Thank you, {txn.customer_name.split(' ')[0]}! Your order is confirmed and a
                receipt was sent to {txn.customer_email}.
              </p>
            </>
          )}

          {state === 'failed' && (
            <>
              <span className="inline-flex w-16 h-16 rounded-full bg-blush items-center justify-center text-blush-ink">
                <XCircle size={32} />
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold text-wood-dark">
                Payment failed
              </h1>
              <p className="mt-2 text-wood text-sm">
                Your payment didn't go through. No money left your account — please try again.
              </p>
            </>
          )}

          {state === 'pending' && (
            <>
              <span className="inline-flex w-16 h-16 rounded-full bg-blush items-center justify-center text-blush-ink">
                <Clock size={30} />
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold text-wood-dark">
                Payment pending
              </h1>
              <p className="mt-2 text-wood text-sm">
                We're still waiting for confirmation. If you completed payment, tap refresh in a
                moment.
              </p>
              <button
                onClick={verify}
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-line bg-cream text-sm font-bold text-wood-dark hover:bg-paper transition-colors"
              >
                <RefreshCw size={15} /> Refresh status
              </button>
            </>
          )}

          {state === 'error' && (
            <>
              <span className="inline-flex w-16 h-16 rounded-full bg-blush items-center justify-center text-blush-ink">
                <XCircle size={32} />
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold text-wood-dark">
                Something went wrong
              </h1>
              <p className="mt-2 text-wood text-sm">{errorMsg}</p>
            </>
          )}

          {/* Order summary */}
          {txn && state !== 'loading' && (
            <div className="mt-6 rounded-2xl bg-paper/70 border border-line px-5 py-4 text-left text-sm space-y-2">
              <div className="flex justify-between text-wood">
                <span>
                  {txn.product_name} × {txn.quantity}
                </span>
                <span className="font-bold text-wood-dark">{formatNaira(Number(txn.amount))}</span>
              </div>
              <div className="flex justify-between text-xs text-wood/70 border-t border-line pt-2">
                <span>Reference</span>
                <span className="font-mono">{txn.reference}</span>
              </div>
            </div>
          )}

          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-wood-dark text-cream font-bold hover:bg-wood transition-colors"
          >
            <ArrowLeft size={16} /> Continue shopping
          </Link>
        </div>
      </main>
    </div>
  );
}
