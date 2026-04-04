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
  const secret = 'mva-reset-2026-mva';
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 uur
  const data = `${email}:${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
  return Buffer.from(`${data}:${sig}`).toString('base64url');
}

function verifyResetToken(token) {
  try {
    const secret = 'mva-reset-2026-mva';
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

async function sendResetEmail(email, naam, link) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`
    },
    body: JSON.stringify({
      from: 'MVA Academie <noreply@makelaarsvan.nl>',
      to: [email],
      subject: 'Stel je wachtwoord in voor de MVA Academie',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: #1A2B5F; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">MVA <span style="color: #E8500A;">Academie</span></h1>
          </div>
          <div style="padding: 32px; background: #f9f9f9;">
            <p style="font-size: 16px;">Hallo <strong>${naam}</strong>,</p>
            <p>Je hebt toegang gekregen tot de MVA Academie. Klik op de knop hieronder om je wachtwoord in te stellen:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: #E8500A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Wachtwoord instellen →
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">Deze link is 24 uur geldig. Als je geen account hebt aangevraagd, kun je deze e-mail negeren.</p>
          </div>
          <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
            Makelaars van Amsterdam · Valkenburgerstraat 67A/B · Amsterdam
          </div>
        </div>
      `
    })
  });
  return res.ok;
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
    
    // Try to send email (optional - link is still returned)
    const naam = body.naam || email.split('@')[0];
    let emailSent = false;
    try {
      emailSent = await sendResetEmail(email.toLowerCase(), naam, link);
    } catch(e) {
      console.error('Email send error:', e.message);
    }
    
    return { statusCode: 200, body: JSON.stringify({ link, emailSent }) };
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
    if (!wachtwoord || wachtwoord.length < 6) return { statusCode: 400, body: JSON.stringify({ error: 'Wachtwoord moet minimaal 6 tekens zijn' }) };
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(wachtwoord).digest('hex');
    await supabasePatch(`gebruikers?email=eq.${encodeURIComponent(emailFromToken)}`, {
      wachtwoord_hash: hash, salt, actief: true
    });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Onbekende actie' }) };
};
