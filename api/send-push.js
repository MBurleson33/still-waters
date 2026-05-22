// api/send-push.js
// Sends a push notification to a user's subscribed devices

import webpush from 'web-push';

const SUPABASE_URL = 'https://olhpiqxxofcwlkpvimug.supabase.co';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.replace('Bearer ', '');
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Verify the calling user
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' });

    const { userId, title, body, url, tag } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Get all subscriptions for this user
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=*`,
      { headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Accept-Profile': 'stillwaters' } }
    );
    if (!subRes.ok) return res.status(500).json({ error: 'Could not fetch subscriptions' });

    const subscriptions = await subRes.json();
    if (!subscriptions.length) return res.status(200).json({ sent: 0 });

    const payload = JSON.stringify({ title, body, url: url || '/feed', tag: tag || 'still-waters' });

    // Send to all devices
    const results = await Promise.allSettled(
      subscriptions.map(async sub => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        };
        try {
          await webpush.sendNotification(pushSub, payload);
        } catch (err) {
          // Subscription expired — remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await fetch(
              `${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${sub.id}`,
              { method: 'DELETE', headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Profile': 'stillwaters' } }
            );
          }
          throw err;
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return res.status(200).json({ sent });

  } catch (err) {
    console.error('Push error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
