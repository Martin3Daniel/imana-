import supabase from './db-client.js';

async function requireUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function syncImages(productId, images) {
  // Replace the image set for this product with the given ordered list
  await supabase.from('product_images').delete().eq('product_id', productId);
  if (images.length > 0) {
    const rows = images.map((url, i) => ({ product_id: productId, url, position: i }));
    const { error } = await supabase.from('product_images').insert(rows);
    if (error) throw error;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const [pRes, iRes, mRes] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: true }),
        supabase.from('product_images').select('*').order('position', { ascending: true }),
        supabase.from('product_meta').select('*'),
      ]);
      if (pRes.error) throw pRes.error;
      if (iRes.error) throw iRes.error;

      const imagesByProduct = {};
      for (const img of iRes.data) {
        (imagesByProduct[img.product_id] ||= []).push(img.url);
      }
      const metaByProduct = {};
      for (const m of mRes.data ?? []) metaByProduct[m.product_id] = m;

      const data = pRes.data.map((p) => ({
        ...p,
        images: imagesByProduct[p.id]?.length ? imagesByProduct[p.id] : [p.image].filter(Boolean),
        description: metaByProduct[p.id]?.description || '',
        tags: metaByProduct[p.id]?.tags || [],
      }));
      return res.status(200).json(data);
    }

    // All mutations require an authenticated admin user
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { name, price, tag, category, image, images, description, tags } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      const numPrice = Number(price);
      if (!numPrice || numPrice <= 0)
        return res.status(400).json({ error: 'Valid price is required' });

      const imageList = Array.isArray(images) && images.length > 0 ? images : [image].filter(Boolean);
      if (imageList.length === 0)
        return res.status(400).json({ error: 'At least one product image is required' });

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: name.trim(),
          price: numPrice,
          tag: tag || 'New',
          category: category || 'Baking Tools',
          image: imageList[0], // cover image
        })
        .select()
        .single();
      if (error) throw error;

      await syncImages(data.id, imageList);
      if (description || (Array.isArray(tags) && tags.length)) {
        await supabase.from('product_meta').insert({
          product_id: data.id,
          description: description || '',
          tags: Array.isArray(tags) ? tags : [],
        });
      }
      return res
        .status(201)
        .json({ ...data, images: imageList, description: description || '', tags: tags || [] });
    }

    if (req.method === 'PUT') {
      const { id, name, price, tag, category, image, images, description, tags } = req.body;
      if (!id) return res.status(400).json({ error: 'Product id is required' });
      const numPrice = Number(price);
      if (!numPrice || numPrice <= 0)
        return res.status(400).json({ error: 'Valid price is required' });

      const imageList = Array.isArray(images) && images.length > 0 ? images : [image].filter(Boolean);

      const { data, error } = await supabase
        .from('products')
        .update({
          name: (name || '').trim(),
          price: numPrice,
          tag,
          category,
          image: imageList[0] || image,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (Array.isArray(images)) {
        await syncImages(id, imageList);
      }
      if (description !== undefined || tags !== undefined) {
        await supabase.from('product_meta').delete().eq('product_id', id);
        await supabase.from('product_meta').insert({
          product_id: id,
          description: description || '',
          tags: Array.isArray(tags) ? tags : [],
        });
      }
      return res
        .status(200)
        .json({ ...data, images: imageList, description: description || '', tags: tags || [] });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Product id is required' });
      await supabase.from('product_images').delete().eq('product_id', id);
      await supabase.from('product_meta').delete().eq('product_id', id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
