// api/auth.js
// Handles the Google OAuth callback and redirects to the feed

const SUPABASE_URL = 'https://olhpiqxxofcwlkpvimug.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const { code, error } = req.query;

  // OAuth error from Google
  if (error) {
    return res.redirect('/?error=' + encodeURIComponent(error));
  }

  // Exchange code for session
  if (code) {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ auth_code: code }),
      }
    );

    if (response.ok) {
      // Redirect to feed on success
      return res.redirect('/feed');
    } else {
      return res.redirect('/auth?error=auth_failed');
    }
  }

  // No code — redirect back to auth
  return res.redirect('/auth');
}
