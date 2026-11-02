import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secretKey = process.env.KORAPAY_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({
        error:
          'Payments are not configured yet. Add KORAPAY_SECRET_KEY in the Secrets tab to enable checkout.',
      });
    }

    const { productId, quantity, name, email, phone } = req.body;

    const qty = Math.max(1, Math.min(50, parseInt(quantity, 10) || 1));
    if (!productId) return res.status(400).json({ error: 'Product is required' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim()))
      return res.status(400).json({ error: 'A valid email is required' });
    if (!phone || !phone.trim()) return res.status(400).json({ error: 'Phone number is required' });

    // Always price from the database — never trust the client
    const { data: product, error: pErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    if (pErr || !product) return res.status(404).json({ error: 'Product not found' });

    const amount = Number(product.price) * qty;
    const reference = `MANNA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Record the pending transaction first
    const { error: tErr } = await supabase.from('transactions').insert({
      reference,
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      amount,
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim(),
      status: 'pending',
    });
    if (tErr) throw tErr;

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const koraRes = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'NGN',
        reference,
        narration: `Manna Accessories — ${qty} x ${product.name}`,
        customer: { name: name.trim(), email: email.trim() },
        redirect_url: `${origin}/payment/status?reference=${encodeURIComponent(reference)}`,
        merchant_bears_cost: true,
      }),
    });

    const koraData = await koraRes.json().catch(() => ({}));
    if (!koraRes.ok || !koraData?.status || !koraData?.data?.checkout_url) {
      console.error('Korapay init failed:', koraData);
      await supabase.from('transactions').update({ status: 'failed' }).eq('reference', reference);
      return res.status(502).json({
        error: koraData?.message || 'Could not start payment. Please try again.',
      });
    }

    return res.status(200).json({
      checkoutUrl: koraData.data.checkout_url,
      reference,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
}
