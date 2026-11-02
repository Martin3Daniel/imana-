import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Product id is required' });

    const [pRes, iRes, mRes] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase
        .from('product_images')
        .select('url, position')
        .eq('product_id', id)
        .order('position', { ascending: true }),
      supabase.from('product_meta').select('*').eq('product_id', id).maybeSingle(),
    ]);
    if (pRes.error || !pRes.data) return res.status(404).json({ error: 'Product not found' });

    const images =
      iRes.data && iRes.data.length > 0
        ? iRes.data.map((r) => r.url)
        : [pRes.data.image].filter(Boolean);

    return res.status(200).json({
      ...pRes.data,
      images,
      description: mRes.data?.description || '',
      tags: mRes.data?.tags || [],
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
