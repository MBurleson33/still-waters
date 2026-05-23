export default async function handler(req, res) {
  // Allow GET for testing
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'admin-data endpoint is live' });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = 'https://olhpiqxxofcwlkpvimug.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
  }

  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Accept-Profile': 'stillwaters'
  };

  const fetchSafe = async (url) => {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) { console.warn('Failed:', url, r.status, await r.text()); return []; }
      return await r.json();
    } catch(e) { console.warn('Error:', url, e.message); return []; }
  };

  const [users, posts, prayers, selahs, comments, prays, follows, pushSubs] = await Promise.all([
    fetchSafe(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,username,avatar_url,created_at,onboarded&order=created_at.desc`),
    fetchSafe(`${SUPABASE_URL}/rest/v1/posts?select=id,type,created_at,answered,user_id&order=created_at.desc`),
    fetchSafe(`${SUPABASE_URL}/rest/v1/prayers?select=id,created_at`),
    fetchSafe(`${SUPABASE_URL}/rest/v1/selahs?select=id,created_at`),
    fetchSafe(`${SUPABASE_URL}/rest/v1/comments?select=id,created_at`),
    fetchSafe(`${SUPABASE_URL}/rest/v1/prays?select=id,created_at`),
    fetchSafe(`${SUPABASE_URL}/rest/v1/follows?select=id,created_at`),
    fetchSafe(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=id,user_id`),
  ]);

  return res.status(200).json({ users, posts, prayers, selahs, comments, prays, follows, pushSubs });
}
