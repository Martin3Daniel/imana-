import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { reference } = req.query;
    if (!reference) return res.status(400).json({ error: 'Reference is required' });

    const { data: txn, error: tErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single();
    if (tErr || !txn) return res.status(404).json({ error: 'Transaction not found' });

    // Already settled — return stored state
    if (txn.status === 'success') {
      return res.status(200).json({ status: 'success', transaction: txn });
    }

    const secretKey = process.env.KORAPAY_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({ error: 'Payments are not configured on the server.' });
    }

    const koraRes = await fetch(
      `https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const koraData = await koraRes.json().catch(() => ({}));

    const koraStatus = koraData?.data?.status; // success | failed | pending | processing
    let newStatus = txn.status;
    if (koraStatus === 'success') newStatus = 'success';
    else if (koraStatus === 'failed' || koraStatus === 'expired') newStatus = 'failed';
    else newStatus = 'pending';

    if (newStatus !== txn.status) {
      await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('reference', reference);
    }

    return res
      .status(200)
      .json({ status: newStatus, transaction: { ...txn, status: newStatus } });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: err.message });
  }
}
