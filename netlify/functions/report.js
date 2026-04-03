exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let type, melding, antwoord, bijlageNaam = null;
  const contentType = event.headers['content-type'] || '';

  if (contentType.includes('application/json')) {
    try {
      const body = JSON.parse(event.body);
      type = body.type;
      melding = body.melding;
      antwoord = body.antwoord;
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
  } else if (contentType.includes('multipart/form-data')) {
    const body = event.body || '';
    const getField = (name) => {
      const match = body.match(new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n-]*)`));
      return match ? match[1].trim() : '';
    };
    type = getField('type');
    melding = getField('melding');
    antwoord = getField('antwoord');
    const filenameMatch = body.match(/name="bijlage";\s*filename="([^"]+)"/);
    bijlageNaam = filenameMatch ? filenameMatch[1] : null;
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported content type' }) };
  }

  if (!melding) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing melding' }) };
  }

  const typeLabel = type === 'fout' ? 'Foutmelding' : 'Aanvulling';
  const timestamp = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

  // Step 1: Ask Claude to evaluate and suggest a fix
  let claudeSuggestion = '';
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Je bent de kennisbeheerder van de MVA Academie Q&A tool voor Makelaarsvan.Amsterdam.

Een gebruiker heeft een melding ingediend:
Type: ${typeLabel}
Melding: ${melding}
Betreffend antwoord van de tool: ${antwoord || '(geen antwoord meegestuurd)'}
${bijlageNaam ? `Bijlage: ${bijlageNaam}` : ''}

Beoordeel kort:
1. Is de melding terecht? (ja/nee/onduidelijk)
2. Wat zou de correcte informatie zijn?
3. Stel een concrete tekst voor die aan de kennisbasis toegevoegd of gecorrigeerd kan worden.

Antwoord in maximaal 150 woorden, zakelijk en direct.`
          }]
        })
      });
      const claudeData = await claudeRes.json();
      claudeSuggestion = claudeData?.content?.[0]?.text || '';
    }
  } catch(e) {
    console.error('Claude evaluation error:', e.message);
  }

  // Step 2: Log to Jotform with Claude's suggestion
  try {
    const jotformKey = process.env.JOTFORM_API_KEY;
    if (jotformKey) {
      const formData = new URLSearchParams();
      formData.append('submission[type]', typeLabel);
      formData.append('submission[2]', melding.substring(0, 1000));
      formData.append('submission[3]', (antwoord || '').substring(0, 500));
      formData.append('submission[4]', claudeSuggestion ? `Claude: ${claudeSuggestion.substring(0, 300)}` : 'melding');
      formData.append('submission[5]', timestamp);

      await fetch('https://eu-api.jotform.com/form/260907604034048/submissions?apiKey=' + jotformKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      }).catch(e => console.error('Jotform error:', e.message));
    }
  } catch(e) {
    console.error('Log error:', e.message);
  }

  console.log('=== MVA MELDING ===');
  console.log('Type:', typeLabel, '| Tijd:', timestamp);
  console.log('Melding:', melding);
  console.log('Claude beoordeling:', claudeSuggestion);
  console.log('==================');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true })
  };
};
