// MVA Q&A — Authentication
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

const FALLBACK_USERS = {
  'toncoffeng@makelaarsvan.nl': { name: 'Ton Coffeng', level: 'directie', salt: 'b17f604d745f6406aaf44e511a3e887d', passwordHash: 'b75a65bd5b6ebc5cadca29e2a7eeb18266c6c57af0516c0fa6577134241bec57', active: true },
  'hanskoppes@makelaarsvan.nl': { name: 'Hans Koppes', level: 'directie', salt: 'mva2026hans', passwordHash: '7b4112306949b4a780c11ff11c2756f00dadee72e87c3dd5b3655b3a39764e05', active: true },
  'moniqueklaver@makelaarsvan.nl': { name: 'Monique Klaver', level: 'makelaar', salt: 'd9f0ac00c2fa7b9dd0d7863b28837b64', passwordHash: '15513e09665a2eda79c802cb05b4e3912942975a50c3ce8c097bf1d8857d04ed', active: true }
};

function getUsers() {
  try {
    const envUsers = JSON.parse(process.env.MVA_USERS || '{}');
    // Gebruik env var als die geldig is, anders fallback
    if (Object.keys(envUsers).length > 0) return envUsers;
    return FALLBACK_USERS;
  } catch {
    return FALLBACK_USERS;
  }
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { action, email, password } = body;

  if (action === 'login') {
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'E-mail en wachtwoord verplicht' }) };
    }
    const users = getUsers();
    const user = users[email.toLowerCase().trim()];
    if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Onbekend e-mailadres. Neem contact op met Ton Coffeng.' }) };
    if (!user.active) return { statusCode: 401, body: JSON.stringify({ error: 'Account niet actief.' }) };
    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return { statusCode: 401, body: JSON.stringify({ error: 'Onjuist wachtwoord.' }) };
    const sessionToken = Buffer.from(email.toLowerCase() + ':' + user.level + ':' + Date.now()).toString('base64');
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, token: sessionToken, level: user.level, name: user.name }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};