// Tijdelijke setup functie - verwijder na gebruik
exports.handler = async function(event, context) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase env vars missing' }) };
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS gebruikers (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      naam text NOT NULL,
      email text UNIQUE NOT NULL,
      level text NOT NULL DEFAULT 'makelaar',
      actief boolean NOT NULL DEFAULT true,
      wachtwoord_hash text NOT NULL,
      salt text NOT NULL,
      aangemaakt timestamptz DEFAULT now()
    );
    ALTER TABLE gebruikers DISABLE ROW LEVEL SECURITY;
    INSERT INTO gebruikers (naam, email, level, actief, wachtwoord_hash, salt) 
    VALUES 
      ('Ton Coffeng', 'toncoffeng@makelaarsvan.nl', 'directie', true, '793f04a830fdeccb876fd9e12be4f28de868ea57ca72d146f1068e31335be6a8', '0b329a3184d05f9add2038f023e39236'),
      ('Monique Klaver', 'moniqueklaver@makelaarsvan.nl', 'makelaar', true, '15513e09665a2eda79c802cb05b4e3912942975a50c3ce8c097bf1d8857d04ed', 'd9f0ac00c2fa7b9dd0d7863b28837b64')
    ON CONFLICT (email) DO NOTHING;
  `;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  // Try direct SQL via pg endpoint
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      supabaseUrl: SUPABASE_URL,
      status: res.status,
      status2: res2.status
    })
  };
};
