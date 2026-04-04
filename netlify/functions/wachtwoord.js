const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  return res.json();
}

async function supabasePatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

function generateResetToken(email) {
  const secret = process.env.ANTHROPIC_API_KEY?.substring(0, 16) || 'mva-secret-2026';
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 uur
  const data = `${email}:${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
  return Buffer.from(`${data}:${sig}`).toString('base64url');
}

function verifyResetToken(token) {
  try {
    const secret = process.env.ANTHROPIC_API_KEY?.substring(0, 16) || 'mva-secret-2026';
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [email, expires, sig] = parts;
    if (Date.now() > parseInt(expires)) return null;
    const data = `${email}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
    if (sig !== expectedSig) return null;
    return email;
  } catch { return null; }
}

exports.handler = async function(event, context) {
  const body = JSON.parse(event.body || '{}');
  const { action, email, token, wachtwoord } = body;

  // Genereer reset link (voor admin bij toevoegen gebruiker)
  if (action === 'generateLink') {
    if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'Email verplicht' }) };
    const resetToken = generateResetToken(email.toLowerCase());
    const host = event.headers.host || 'q-and-a-mva.netlify.app';
    const link = `https://${host}/wachtwoord.html?token=${resetToken}`;
    return { statusCode: 200, body: JSON.stringify({ link }) };
  }

  // Verifieer token (voor wachtwoord instelpagina)
  if (action === 'verifyToken') {
    const emailFromToken = verifyResetToken(token);
    if (!emailFromToken) return { statusCode: 400, body: JSON.stringify({ error: 'Link is verlopen of ongeldig' }) };
    const gebruikers = await supabaseGet(`gebruikers?email=eq.${encodeURIComponent(emailFromToken)}&select=naam,email`);
    const gebruiker = gebruikers?.[0];
    if (!gebruiker) return { statusCode: 404, body: JSON.stringify({ error: 'Gebruiker niet gevonden' }) };
    return { statusCode: 200, body: JSON.stringify({ email: emailFromToken, naam: gebruiker.naam }) };
  }

  // Stel wachtwoord in
  if (action === 'setWachtwoord') {
    const emailFromToken = verifyResetToken(token);
    if (!emailFromToken) return { statusCode: 400, body: JSON.stringify({ error: 'Link is verlopen of ongeldig' }) };
    if (!wachtwoord || wachtwoord.length < 8) return { statusCode: 400, body: JSON.stringify({ error: 'Wachtwoord moet minimaal 8 tekens zijn' }) };
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(wachtwoord).digest('hex');
    await supabasePatch(`gebruikers?email=eq.${encodeURIComponent(emailFromToken)}`, {
      wachtwoord_hash: hash, salt, actief: true
    });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};
