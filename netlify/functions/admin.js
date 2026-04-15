const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

function decodeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    return { email: parts[0], level: parts[1], ts: parts[2] };
  } catch(e) { return null; }
}

function isDirectie(level) {
  if (!level) return false;
  const l = level.toLowerCase();
  return l === 'directie' || l === 'level2' || l === 'admin';
}

exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ongeldige JSON' }) }; }

  const { action, token, naam, email, level, wachtwoord, userId, nieuwWachtwoord, actief } = body;

  // Controleer token
  const user = decodeToken(token);
  if (!user || !isDirectie(user.level)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Geen toegang' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (action === 'list') {
    const { data, error } = await supabase.from('gebruikers').select('*').order('naam');
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify({ gebruikers: data }) };
  }

  if (action === 'add') {
    if (!naam || !email || !level || !wachtwoord) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Naam, email, level en wachtwoord zijn verplicht' }) };
    }
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHmac('sha256', salt).update(wachtwoord).digest('hex');
    const { data, error } = await supabase.from('gebruikers').insert([{
      naam, email: email.toLowerCase(), level: level.toLowerCase(), salt, password_hash: passwordHash, actief: true
    }]).select();
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, gebruiker: data[0], wachtwoord }) };
  }

  if (action === 'delete') {
    const { error } = await supabase.from('gebruikers').delete().eq('id', userId);
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  if (action === 'toggle') {
    const { error } = await supabase.from('gebruikers').update({ actief }).eq('id', userId);
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  if (action === 'resetPassword') {
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHmac('sha256', salt).update(nieuwWachtwoord).digest('hex');
    const { error } = await supabase.from('gebruikers').update({ salt, password_hash: passwordHash }).eq('id', userId);
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Onbekende actie: ' + action }) };
};