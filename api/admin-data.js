export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://by-still-waters.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const { password } = body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized', received: !!password });
  }

  const SUPABASE_URL = 'https://olhpiqxxofcwlkpvimug.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SERVICE_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
  }

  // Test with just one simple fetch first
  try {
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Accept-Profile': 'stillwaters'
      }
    });
    const testData = await testRes.json();
    
    if (!testRes.ok) {
      return res.status(500).json({ error: 'Supabase test failed', status: testRes.status, data: testData });
    }

    // Full fetch
    const headers = {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept-Profile': 'stillwaters'
    };

    const fetchSafe = async (url) => {
      try {
        const r = await fetch(url, { headers });
        if (!r.ok) return [];
        return await r.json();
      } catch(e) { return []; }
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

  } catch(e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
