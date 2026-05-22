// api/delete-account.js
// Deletes the authenticated user's account using the service role key

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const SUPABASE_URL = 'https://olhpiqxxofcwlkpvimug.supabase.co';
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // First verify the token and get the user
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await userRes.json();
    const userId = user.id;

    if (!userId) {
      return res.status(401).json({ error: 'Could not identify user' });
    }

    // Delete all user data in order (most will cascade but let's be explicit)
    // Delete notifications
    await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });

    // Delete comments
    await fetch(`${SUPABASE_URL}/rest/v1/comments?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });

    // Delete written prayers
    await fetch(`${SUPABASE_URL}/rest/v1/prayers?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });

    // Delete selahs
    await fetch(`${SUPABASE_URL}/rest/v1/selahs?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });

    // Delete follows
    await fetch(`${SUPABASE_URL}/rest/v1/follows?follower_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });
    await fetch(`${SUPABASE_URL}/rest/v1/follows?following_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });

    // Delete posts (selahs/comments on their posts cascade)
    await fetch(`${SUPABASE_URL}/rest/v1/posts?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });

    // Delete profile
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' }
    });

    // Finally delete the auth user (requires service role)
    const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (!deleteRes.ok) {
      const err = await deleteRes.text();
      console.error('Auth delete failed:', err);
      return res.status(500).json({ error: 'Failed to delete auth user' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
