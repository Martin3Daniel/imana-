import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { name, phone, details } = req.body;
      if (!phone || !phone.trim()) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      if (!details || !details.trim()) {
        return res.status(400).json({ error: 'Order details are required' });
      }
      const { data, error } = await supabase
        .from('orders')
        .insert({
          name: (name || '').trim(),
          phone: phone.trim(),
          details: details.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
