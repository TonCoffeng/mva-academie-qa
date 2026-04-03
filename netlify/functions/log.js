exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: '{}' };
  }

  const jotformKey = process.env.JOTFORM_API_KEY;
  if (!jotformKey) return { statusCode: 200, body: JSON.stringify({ error: 'geen key' }) };

  try {
    const { type, vraag, antwoord, tijdstip, naam } = JSON.parse(event.body || '{}');

    // Use numeric field IDs (confirmed working from existing submission)
    const params = new URLSearchParams();
    params.append('submission[7]', type || 'Vraag');
    params.append('submission[9]', naam || '');
    params.append('submission[makelaar]', naam || '');
    params.append('submission[2]', (vraag || '').substring(0, 500));
    params.append('submission[3]', (antwoord || '').substring(0, 1000));
    params.append('submission[5]', tijdstip || new Date().toLocaleString('nl-NL'));

    const res = await fetch(
      'https://eu-api.jotform.com/form/260907604034048/submissions?apiKey=' + jotformKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }
    );

    const responseText = await res.text();
    console.log('Jotform:', res.status, responseText.substring(0, 100));

    return {
      statusCode: 200,
      body: JSON.stringify({ jotformStatus: res.status, jotformResponse: responseText.substring(0, 200) })
    };
  } catch(e) {
    console.error('Log fout:', e.message);
    return { statusCode: 200, body: JSON.stringify({ error: e.message }) };
  }
};
