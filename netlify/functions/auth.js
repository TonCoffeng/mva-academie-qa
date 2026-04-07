const crypto = require('crypto');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { action, email, password } = body;

  if (action === 'login') {
    const users = {
      'toncoffeng@makelaarsvan.nl': { name: 'Ton Coffeng', level: 'directie' },
      'hanskoppes@makelaarsvan.nl': { name: 'Hans Koppes', level: 'directie' },
      'moniqueklaver@makelaarsvan.nl': { name: 'Monique Klaver', level: 'makelaar' }
    };

    const emailLower = (email || '').toLowerCase().trim();
    const user = users[emailLower];

    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Gebruiker niet gevonden.' }) };
    }

    if (password !== 'MVA2026!') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Onjuist wachtwoord.' }) };
    }

    const token = Buffer.from(emailLower + ':' + user.level + ':' + Date.now()).toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, level: user.level, name: user.name })
    };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};