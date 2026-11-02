import supabase from './db-client.js';

async function requireUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // Mutations are admin-only
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { name } = req.body;
      const clean = (name || '').trim().replace(/\s+/g, ' ');
      if (!clean) return res.status(400).json({ error: 'Category name is required' });
      if (clean.length > 40)
        return res.status(400).json({ error: 'Category name must be 40 characters or less' });
      if (/^all products$/i.test(clean))
        return res.status(400).json({ error: '"All Products" is reserved' });

      // Case-insensitive duplicate check
      const { data: existing } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', clean)
        .maybeSingle();
      if (existing) return res.status(409).json({ error: `"${existing.name}" already exists` });

      const { data, error } = await supabase
        .from('categories')
        .insert({ name: clean })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Category id is required' });

      const { data: cat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', id)
        .single();
      if (!cat) return res.status(404).json({ error: 'Category not found' });

      // Block deletion if products still use it
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category', cat.name);
      if (count && count > 0) {
        return res.status(409).json({
          error: `Cannot delete — ${count} product${count === 1 ? '' : 's'} still use "${cat.name}". Reassign them first.`,
        });
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
