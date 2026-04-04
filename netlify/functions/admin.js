const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (Date.now() - payload.ts > 8 * 60 * 60 * 1000) return null;
    if (payload.level !== 'directie') return null;
    return payload;
  } catch { return null; }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return { salt, hash };
}

async function supabase(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

exports.handler = async function(event, context) {
  const body = JSON.parse(event.body || '{}');
  const { token, action, gebruiker, id } = body;

  // Verify directie token
  const payload = verifyToken(token);
  if (!payload) return { statusCode: 401, body: JSON.stringify({ error: 'Geen toegang' }) };

  if (action === 'list') {
    const data = await supabase('GET', 'gebruikers?select=id,naam,email,level,actief,aangemaakt&order=naam.asc');
    return { statusCode: 200, body: JSON.stringify({ gebruikers: data }) };
  }

  if (action === 'add') {
    const { naam, email, level, wachtwoord } = gebruiker;
    if (!naam || !email || !wachtwoord) return { statusCode: 400, body: JSON.stringify({ error: 'Naam, email en wachtwoord verplicht' }) };
    const { salt, hash } = hashPassword(wachtwoord);
    const data = await supabase('POST', 'gebruikers', {
      naam, email: email.toLowerCase(), level: level || 'makelaar',
      actief: true, wachtwoord_hash: hash, salt
    });
    return { statusCode: 200, body: JSON.stringify({ success: true, gebruiker: data?.[0] }) };
  }

  if (action === 'toggle') {
    const current = await supabase('GET', `gebruikers?id=eq.${id}&select=actief`);
    const newActief = !current?.[0]?.actief;
    await supabase('PATCH', `gebruikers?id=eq.${id}`, { actief: newActief });
    return { statusCode: 200, body: JSON.stringify({ success: true, actief: newActief }) };
  }

  if (action === 'delete') {
    await supabase('DELETE', `gebruikers?id=eq.${id}`);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (action === 'resetPassword') {
    const { wachtwoord } = gebruiker;
    const { salt, hash } = hashPassword(wachtwoord);
    await supabase('PATCH', `gebruikers?id=eq.${id}`, { wachtwoord_hash: hash, salt });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};
