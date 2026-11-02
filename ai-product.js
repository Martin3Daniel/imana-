import supabase from './db-client.js';

/**
 * AI product analysis — Manna Accessories storefront copywriter.
 * Powered by the Kilo AI Gateway (OpenAI-compatible, kilo.ai).
 * Takes an uploaded product image URL, sends it to a vision model via
 * Kilocode, and returns { productName, description, category, tags }.
 */

const KILO_BASE = 'https://api.kilo.ai/api/gateway';

// Vision-capable models, tried in order (fallback for availability/limits)
const MODELS = [
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
];

const MASTER_PROMPT = `
You are an expert e-commerce copywriter and inventory manager for 'Manna Accessories', a premium baking supply store.
Analyze the attached product image and provide the following:

1. "productName": A clear, professional name for the item.
2. "description": A premium, 2-3 sentence description emphasizing durability, craft, and style.
3. "category": Sort it into one of these exactly: ["Baking Tools", "Craft Supplies", "Kitchen Scale", "Kitchen Tools"].
4. "tags": An array of 4 search-friendly tags (lowercase strings).

Return the response ONLY as a valid JSON object. Do not include markdown blocks.
`;

async function callKilo(apiKey, model, imageDataUrl) {
  const res = await fetch(`${KILO_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: MASTER_PROMPT },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `Kilo request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data?.choices?.[0]?.message?.content ?? '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.STOREFRONT_AI_API_KEY || process.env.STOREFRONT_AI_;
    if (!apiKey) {
      return res.status(503).json({
        error:
          'AI is not configured yet. Add STOREFRONT_AI_API_KEY (a Kilocode API key from kilo.ai) in the Secrets tab.',
      });
    }

    // Admin-only
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) return res.status(401).json({ error: 'Invalid token' });

    const { imageUrl } = req.body;
    if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
      return res.status(400).json({ error: 'A valid uploaded image URL is required' });
    }

    // Fetch the image server-side and convert to a data URL
    // (works even if the storage URL isn't reachable by the AI provider)
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return res.status(400).json({ error: 'Could not fetch the image' });
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large for analysis' });
    }
    const imageDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Try models in order (fallback on rate limits / unavailability)
    let rawText = '';
    let lastErr = null;
    for (const model of MODELS) {
      try {
        rawText = await callKilo(apiKey, model, imageDataUrl);
        if (rawText) break;
      } catch (err) {
        lastErr = err;
        if (err.status === 401 || err.status === 403) throw err; // bad key — no point retrying
        continue; // try next model on 429/404/5xx
      }
    }
    if (!rawText) throw lastErr || new Error('AI returned an empty response');

    // Parse — strip accidental markdown fences just in case
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    let productData;
    try {
      productData = JSON.parse(cleaned);
    } catch {
      // Some models wrap JSON in prose; try to extract the first {...} block
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          productData = JSON.parse(match[0]);
        } catch {
          return res.status(502).json({ error: 'AI returned an unreadable response. Try again.' });
        }
      } else {
        return res.status(502).json({ error: 'AI returned an unreadable response. Try again.' });
      }
    }

    const VALID_CATEGORIES = ['Baking Tools', 'Craft Supplies', 'Kitchen Scale', 'Kitchen Tools'];
    const result = {
      productName: String(productData.productName || '').slice(0, 120),
      description: String(productData.description || '').slice(0, 600),
      category: VALID_CATEGORIES.includes(productData.category)
        ? productData.category
        : 'Baking Tools',
      tags: Array.isArray(productData.tags)
        ? productData.tags.slice(0, 4).map((t) => String(t).toLowerCase().slice(0, 40))
        : [],
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error('AI product analysis failed:', err);
    const status = err.status === 401 || err.status === 403 ? 502 : 500;
    const msg =
      err.status === 401 || err.status === 403
        ? 'The Kilocode API key was rejected. Check the STOREFRONT_AI_API_KEY secret.'
        : err.message || 'Could not process product image.';
    res.status(status).json({ error: msg });
  }
}
