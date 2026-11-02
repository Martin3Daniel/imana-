import supabase from './db-client.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Require an authenticated admin user
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) return res.status(401).json({ error: 'Invalid token' });

    const { fileName, fileBase64, contentType } = req.body;
    if (!fileBase64 || !contentType) {
      return res.status(400).json({ error: 'Missing file data' });
    }
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image uploads are allowed' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 6 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be under 6MB' });
    }

    const ext = (fileName || 'image.jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000', // 1 year — filenames are unique, so cache forever
      });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    return res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
