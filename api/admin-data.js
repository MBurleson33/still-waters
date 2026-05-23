export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = 'https://olhpiqxxofcwlkpvimug.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Accept-Profile': 'stillwaters'
  };

  const fetchSafe = async (url) => {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) { console.warn('Failed:', url, res.status); return []; }
      return await res.json();
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
