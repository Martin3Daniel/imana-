import supabase from './db-client.js';
import { triggerRestore } from './db-wake.js';

/**
 * Keep-alive + wake endpoint.
 * 1. Called daily by Vercel Cron so the Supabase project never auto-pauses
 *    (paused projects take their Storage CDN down with them → broken images).
 * 2. Called by the frontend SmartImage component when an image fails to load,
 *    triggering an immediate restore of a paused project.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const result = { db: false, storage: false };

  // 1. Touch the database (also exercises db-client's auto-restore hook)
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    result.db = !error;
    if (error) triggerRestore();
  } catch {
    triggerRestore();
  }

  // 2. Touch the Storage CDN so it stays warm
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const ping = await fetch(`${base}/storage/v1/object/public/product-images/.keepalive`, {
      method: 'HEAD',
    });
    // 400/404 means storage is UP (object just doesn't exist) — 5xx means paused
    result.storage = ping.status < 500;
    if (ping.status >= 500) triggerRestore();
  } catch {
    triggerRestore();
  }

  return res.status(200).json({ ok: result.db && result.storage, ...result, at: new Date().toISOString() });
}
