// MVA Q&A — Admin function
// Ton can manage users via this endpoint
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function getUsers() {
  try {
    const usersJson = process.env.MVA_USERS;
    if (!usersJson) return {};
    return JSON.parse(usersJson);
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

  const { action, adminToken, email, name, password, level, active } = body;
  const adminKey = process.env.ADMIN_TOKEN;

  // Verify admin token
  if (adminToken !== adminKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Geen toegang' }) };
  }

  const users = getUsers();

  // === LIST USERS ===
  if (action === 'list') {
    const safeUsers = Object.entries(users).map(([email, u]) => ({
      email,
      name: u.name,
      level: u.level,
      active: u.active,
      created: u.created
    }));
    return {
      statusCode: 200,
      body: JSON.stringify({ users: safeUsers })
    };
  }

  // === ADD USER ===
  if (action === 'add') {
    if (!email || !password || !name || !level) {
      return { statusCode: 400, body: JSON.stringify({ error: 'email, naam, wachtwoord en level zijn verplicht' }) };
    }

    const salt = generateSalt();
    users[email.toLowerCase()] = {
      name,
      level: level || 'makelaar',
      active: true,
      salt,
      passwordHash: hashPassword(password, salt),
      created: new Date().toISOString()
    };

    // Save back to env — return new users JSON for Ton to update in Netlify
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Gebruiker ${name} aangemaakt`,
        newUsersJson: JSON.stringify(users),
        instruction: 'Kopieer de waarde van newUsersJson en plak die in Netlify → Environment variables → MVA_USERS'
      })
    };
  }

  // === DEACTIVATE USER ===
  if (action === 'deactivate') {
    if (!email || !users[email.toLowerCase()]) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Gebruiker niet gevonden' }) };
    }
    users[email.toLowerCase()].active = false;
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `${email} gedeactiveerd`,
        newUsersJson: JSON.stringify(users)
      })
    };
  }

  // === ACTIVATE USER ===
  if (action === 'activate') {
    if (!email || !users[email.toLowerCase()]) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Gebruiker niet gevonden' }) };
    }
    users[email.toLowerCase()].active = true;
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `${email} geactiveerd`,
        newUsersJson: JSON.stringify(users)
      })
    };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};
