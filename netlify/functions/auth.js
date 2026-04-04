const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function getGebruiker(email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gebruikers?email=eq.${encodeURIComponent(email)}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  return data?.[0] || null;
}

function hashPassword(password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateToken(email, level) {
  const payload = { email, level, ts: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (Date.now() - payload.ts > 8 * 60 * 60 * 1000) return null; // 8 uur
    return payload;
  } catch { return null; }
}

exports.handler = async function(event, context) {
  const body = JSON.parse(event.body || '{}');
  const { action, email, password, token } = body;

  if (action === 'verify') {
    const payload = verifyToken(token);
    if (!payload) return { statusCode: 401, body: JSON.stringify({ error: 'Token verlopen' }) };
    return { statusCode: 200, body: JSON.stringify({ valid: true, email: payload.email, level: payload.level }) };
  }

  if (action === 'login') {
    if (!email || !password) return { statusCode: 400, body: JSON.stringify({ error: 'Email en wachtwoord verplicht' }) };

    try {
      const gebruiker = await getGebruiker(email.toLowerCase());
      if (!gebruiker) return { statusCode: 401, body: JSON.stringify({ error: 'Onbekend e-mailadres' }) };
      if (!gebruiker.actief) return { statusCode: 401, body: JSON.stringify({ error: 'Account is gedeactiveerd' }) };

      const hash = hashPassword(password, gebruiker.salt);
      if (hash !== gebruiker.wachtwoord_hash) return { statusCode: 401, body: JSON.stringify({ error: 'Onjuist wachtwoord' }) };

      const tokenLevel = gebruiker.level === 'directie' ? 'directie' : 'makelaar';
      const newToken = generateToken(email.toLowerCase(), tokenLevel);
      return {
        statusCode: 200,
        body: JSON.stringify({ token: newToken, level: tokenLevel, name: gebruiker.naam })
      };
    } catch(e) {
      console.error('Auth error:', e.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Inloggen mislukt' }) };
    }
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};
