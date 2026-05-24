export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Not configured' });

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Still Waters <noreply@by-still-waters.com>',
        to: 'burleson.matthew@gmail.com',
        subject: `Bug Report from ${name || 'A user'}`,
        text: `From: ${name || 'Unknown'}\n\n${message}`
      })
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Email failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Bug report error:', err);
    return res.status(500).json({ error: err.message });
  }
}
