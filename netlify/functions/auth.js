// MVA Q&A — Authentication via MVA_USERS environment variable
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function getUsers() {
  try {
    return JSON.parse(process.env.MVA_USERS || '{}');
  } catch {
    return {};
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

  // Tijdelijk: genereer hash voor een gegeven wachtwoord + salt
  if (action === 'genhash') {
    const hash = hashPassword(password, body.salt);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) };
  }

  if (action === 'login') {
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'E-mail en wachtwoord verplicht' }) };
    }

    const users = getUsers();
    const user = users[email.toLowerCase().trim()];

    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Onbekend e-mailadres. Neem contact op met Ton Coffeng.' }) };
    }

    if (!user.active) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Account niet actief. Neem contact op met Ton Coffeng.' }) };
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Onjuist wachtwoord.' }) };
    }

    const sessionToken = Buffer.from(`${email.toLowerCase()}:${user.level}:${Date.now()}`).toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, token: sessionToken, level: user.level, name: user.name })
    };
  }

  // Debug: toon huidige user data (tijdelijk)
  if (action === 'debug') {
    const users = getUsers();
    const sanitized = {};
    Object.keys(users).forEach(email => {
      sanitized[email] = { salt: users[email].salt, hashStart: users[email].passwordHash ? users[email].passwordHash.slice(0,16) : 'leeg', active: users[email].active };
    });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitized) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};