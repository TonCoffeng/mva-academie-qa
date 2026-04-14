// MVA Q&A — Authentication (tijdelijk: plain vergelijking voor reset)
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Genereer hashes bij eerste aanroep
const SALT_TON = 'mva_ton_2026_x9k';
const SALT_HANS = 'mva_hans_2026_x9k';
const SALT_MON = 'mva_mon_2026_x9k';

const SALT_ROEMER = 'mva_roemer_2026_x9k';

const USERS = {
  'toncoffeng@makelaarsvan.nl': {
    name: 'Ton Coffeng', level: 'directie', active: true,
    salt: SALT_TON,
    passwordHash: hashPassword('Level2!', SALT_TON)
  },
  'hanskoppes@makelaarsvan.nl': {
    name: 'Hans Koppes', level: 'directie', active: true,
    salt: SALT_HANS,
    passwordHash: hashPassword('Level2!', SALT_HANS)
  },
  'roemerkoppes@makelaarsvan.nl': {
    name: 'Roemer Koppes', level: 'directie', active: true,
    salt: SALT_ROEMER,
    passwordHash: hashPassword('Level2!', SALT_ROEMER)
  },
  'moniqueklaver@makelaarsvan.nl': {
    name: 'Monique Klaver', level: 'makelaar', active: true,
    salt: SALT_MON,
    passwordHash: hashPassword('MVA2026!', SALT_MON)
  }
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { action, email, password } = body;

  if (action === 'login') {
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'E-mail en wachtwoord verplicht' }) };
    }
    const user = USERS[email.toLowerCase().trim()];
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Onbekend e-mailadres. Neem contact op met Ton Coffeng.' }) };
    if (!user.active) return { statusCode: 401, body: JSON.stringify({ error: 'Account niet actief.' }) };
    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return { statusCode: 401, body: JSON.stringify({ error: 'Onjuist wachtwoord.' }) };
    const sessionToken = Buffer.from(email.toLowerCase() + ':' + user.level + ':' + Date.now()).toString('base64');
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, token: sessionToken, level: user.level, name: user.name }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};