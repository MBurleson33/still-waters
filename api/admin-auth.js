export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://by-still-waters.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) return res.status(500).json({ error: 'Not configured' });
  if (password === adminPassword) return res.status(200).json({ ok: true });
  return res.status(401).json({ error: 'Incorrect password' });
}
