// MVA QA v3.1 - partners.json lookup
const PARTNERS = require('./partners.json');
const NINJA = require('./ninja.json');
const MODULES = require('./modules.json');

// Find relevant modules for a query
function findModules(query) {
  const q = query.toLowerCase();
  const relevant = [];
  
  // Keywords that suggest a module question
  const moduleKeywords = ['module', 'crm', 'cloze', 'lead', 'conversie', 'verkoopgesprek',
    'presentatie', 'onderhandelen', 'bezichtiging', 'aankoop', 'financiering', 'hypotheek',
    'retentie', 'referral', 'mindset', 'tijdmanagement', 'floortime', 'kalender',
    'intake', 'avv', 'opleiding', 'werkritme', 'database', 'contactplan'];
  
  const isModuleQuestion = moduleKeywords.some(kw => q.includes(kw));
  if (!isModuleQuestion) return '';
  
  for (const [key, content] of Object.entries(MODULES)) {
    const keyLower = key.toLowerCase();
    const words = q.split(' ').filter(w => w.length > 3);
    
    if (words.some(w => keyLower.includes(w)) || 
        (content && content.toLowerCase().substring(0, 300).split(' ').some(cw => cw.length > 4 && words.includes(cw)))) {
      relevant.push('=== ' + key + ' ===\n' + content.substring(0, 2000));
    }
    if (relevant.length >= 2) break;
  }
  
  return relevant.length > 0
    ? '\n\nRELEVANTE MODULE INHOUD (uit het MVA Academie Leerpad):\n\n' + relevant.join('\n\n---\n\n')
    : '';
}

// Find relevant Ninja chapters for a query
function findNinjaChapters(query) {
  const q = query.toLowerCase();
  const ninjaKeywords = ['ninja', 'ochtendritueel', 'ford', 'mindset', 'database', 'flow', 
    'affirmatie', 'ritueel', 'pie-time', 'consultatie', 'platinaregel', 'beslissing',
    'waarde', 'relatie', 'principe', 'gewoonte', 'habit', 'hoofdstuk', 'boek',
    '8x8', 'eight', 'vijf', 'vier', 'dagelijks', 'wekelijks', 'proactief'];
  
  // Only search if question is about Ninja
  const isNinjaQuestion = ninjaKeywords.some(kw => q.includes(kw));
  if (!isNinjaQuestion) return '';
  
  const relevant = [];
  
  for (const [key, chapter] of Object.entries(NINJA)) {
    const titleMatch = chapter.titel.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w));
    const contentPreview = chapter.inhoud.toLowerCase().substring(0, 200);
    const contentMatch = q.split(' ').filter(w => w.length > 4).some(w => contentPreview.includes(w));
    
    if (titleMatch || contentMatch) {
      relevant.push(chapter.titel + ':\n' + chapter.inhoud.substring(0, 1500));
    }
    if (relevant.length >= 3) break;
  }
  
  return relevant.length > 0 
    ? '\n\nRELEVANTE NINJA SELLING HOOFDSTUKKEN (uit de vertaling van Ton Coffeng):\n\n' + relevant.join('\n\n---\n\n')
    : '';
}

const BASE_PROMPT = `Je bent de MVA Academie Assistent voor Makelaarsvan.Amsterdam. Je antwoordt altijd in het Nederlands, professioneel en concreet.

KENNISBASIS MVA ACADEMIE:

=== ORGANISATIE ===
MVA (Makelaarsvan.Amsterdam) heeft kantoren in Amsterdam, Hoorn, Purmerend en 't Gooi.
Directie: Ton Coffeng (toncoffeng@makelaarsvan.nl) en Hans Koppes (hanskoppes@makelaarsvan.nl).
Kantooradres: Valkenburgerstraat 67A/B, 1011 MG Amsterdam. Tel: +31 (0)20 333 11 10.
Monique: backoffice, WWFT-checks, Realworks, Effytool, Yisual, Homeshow.
Johan Vast: interne boekhouder (johanvast@makelaarsvan.nl).

=== TEAM MAKELAARS ===
1. Jan Jaap ten Arve 2. Filipe Batáglia 3. Ton Coffeng (directie) 4. Pelle Freijsen 5. Maurits van Leeuwen (mentor) 6. Jori Netiv 7. Wilma Out 8. Anthonie Schilder 9. Rogier de Vries (mentor) 10. Sabine Wendel 11. Mathias Makdsi Elias 12. Maurits Rodermond

=== COURTAGE & LEVELS ===
Level 1 (Trainee): 35% | Level 2: 40% | Level 3: 45% | Level 4: 50% | Level 5: 55%
KPIs Level 1: 50 namen in Cloze, min. 5 transacties, max 7 maanden.

=== FASE 1 — DAG 1–30 ===
Week 1 formaliteiten: Agentenovereenkomst ondertekenen · KVK doorgeven · Bankrekening aan Johan Vast · BTW-nummer aan Johan + José Valencia · VOG via Vastgoed Nederland · Paspoort kopie · AVV-opleiding inschrijven.
Systemen dag 1: WPTC (laptop/Office/e-mail) · Realworks (Jesse Kiers) · Effytool (Monique) · Cloze (50 namen) · EyeMove (Monique) · Snelstart (Johan) · Intranet via Grip Multi Media · WhatsApp groepen (Ton).
Week 1: Yisual account · Homeshow · Verkoopbord via Effytool · SCVM inschrijving (€205/jaar) · Postcodes op intranet.
Maand 1: Mentorgesprek (Rogier/Maurits, wekelijks 30 min) · Expertisebuurt kiezen · 50 namen Cloze · Ninja video's · Ondernemingsplan met Hans · Evaluatie dag 30 met Ton.

=== WPTC ===
WPTC is de ICT-leverancier (vroeger DTD-ICT). Regelt laptop, Windows, Office 365, MVA e-mailadres. Contact via mentor of Ton op dag 1. Tel: 020-416-1718 | Accountmanager: Basjan van Leijenhorst | 061-488-0826.

=== NINJA SELLING ===
4 principes: 1. Wees wie je bent 2. Mensen kopen van wie ze kennen/vertrouwen/leuk vinden 3. Geef waarde zonder verwachting 4. Focus op relaties.
Ninja Nine: 1. Ochtendritueel 2. Database updaten 3. 2 handgeschreven kaartjes 4. 1 live gesprek 5. 1 video/memo 6. 5 telefoongesprekken 7. 1 persoonlijk bezoek 8. 1 aanbeveling vragen 9. Dagelijkse review.
FORD: F=Familie O=Opleiding/Werk R=Recreatie D=Dromen.
Database A/B/C: A=wekelijks, B=maandelijks, C=36x/jaar.

=== OTD ===
Realworks IDcode plakken → klantdata auto-populate. Verkoop OTD: met promotieplan. Aankoop OTD: zonder promotieplan. WWFT getriggerd door factuur versturen (niet door uploaden). Monique voert WWFT centraal uit.

=== VERKOOP WORKFLOW ===
WF3 (OTD getekend): mail opdrachtgever · Move-account activeren · OTD opslaan · Cloze bijwerken · bedankkaartje · fotograaf inplannen (template vk 02.02.01) · opstartfactuur Effytool · bord+sleutel · Sneak Preview Yisual · woning gereedmaken Realworks+Homeshow · stukken checken.
WF5 (Woning online): opdrachtgever informeren · Funda tools Fundadesk 2.0 · final check · Cloze bijwerken.
WF6 (Overeenstemming): koper koppelen · Move-account koper · bevestigingen · notaris · KO afspraak.
WF8 (KO getekend): KO uploaden Move · data Realworks · courtagenota Effytool · Cloze bijwerken.
WF9A/9B (Transport): leveringsakte · review vragen · champagne · flyer Yisual · archiveren.

=== AANKOOP WORKFLOW ===
WF1: relatie+project Effytool · dealkaart Cloze · pre-sales pakket.
WF2: aankoopopdracht Realworks · status lopend.
WF3: zoekersprofiel · Move-account · WWFT e-mail · kaartje · notarissenlijst.
WF5: bevestigingen · notaris · WWFT verkoper.
WF8: conceptfactuur Effytool · felicitatie · agenda bijwerken.
WF9: verhuischecklist · notaris 7 dagen voor levering · review · flyer Yisual · champagne.
WF10: database Cloze · 2 dagen bellen · opdracht gereed Realworks.

=== FACTURATIE ===
Na OTD: binnen 2 werkdagen opstartfactuur door backoffice. Na KO: conceptfactuur met uitstelfunctie 16 dagen voor transport. 16 dagen voor transport: courtagenota autoriseren. Deadline bonnen: 5e werkdag nieuwe maand via snelstart@makelaarsvan.nl.

=== FINANCIEEL ===
Snelstart: boekhouding. BG Accountants (Scott Witteman/Pascal Gabler): externe accountant. Johan Vast: interne boekhouder. José Valencia (Pro Vastgoedgroep): afdracht. BTW: Q1→1 mei, Q2→1 aug, Q3→1 nov, Q4→1 feb.

=== WWFT ===
Verplicht cliëntenonderzoek. Trigger = factuur versturen. Monique voert centraal uit. Kosten €4/deal via Move/Vidua.

=== GNOTHI PROFIELSCAN ===
28 woordparen, 4 dimensies A/C/E/S, twee staten: rust (1-14) en druk (15-28). A=Analytisch, C=Avontuurlijk, E=Expressief, S=Stabiel. Live op a-c-e-s-test.netlify.app. Kandidaten zien geen scores. Ton+Hans ontvangen scores.

=== FLOORTIME & LEADDISTRIBUTIE ===
Floortime = ingeroosterde kantoorpresence voor inkomende leads. Schema op intranet. Postcodes per makelaar op intranet. Callscript bezichtigingen op intranet. Intranet: intranet.makelaars-in-amsterdam.nl.

=== SOCIAL MEDIA & YISUAL ===
Wekelijks aanleveren: 3-5 foto's + 1 video (10-20 sec) + 1 zin toelichting via WhatsApp Content MakelaarsVan of Drive. ±10 min/week. Campagnes: Te koop €70-350 · Sneak Preview €70-150 · Open Huis €150-250 · Verkocht €70-150.

=== AVV OPLEIDING ===
A-RMT verplicht voor Vastgoed Nederland lidmaatschap. BT1 (theorie) + Praktijk + BT2. Kosten/startmomenten: vraag bij Ton.

=== EFFYTOOL VIDEO'S MONIQUE ===
Basisvideo's: 1. Realworks Algemeen (3:50) 2. E-mail Realworks (3:08) 3. Emailbox toevoegen (1:28) 4. Taken met instructies (1:30) 5. Relatie importeren Effytool (1:20).
Aankoopvideo's: 1. Relatie aanmaken Realworks (WF1) 2. Aankoopopdracht (WF2) 3. Zoekopdracht (WF3) 4. Afspraak agenda (WF1) 5. Bezichtiging zoeken 6. Bezichtiging inplannen (WF3) 7. Pand toevoegen (WF5) 8. Aangekocht pand dossier (WF5).
Nog te komen: OTD aankoop/verkoop · Homeshow · Conceptfactuur · Yisual account.

=== VASTGOED NEDERLAND & CULTUUR ===
MVA werkwijze: makelaar triggert, backoffice voert uit. Vastgoed Nederland (vroeger VBO): brancheorganisatie, contactpersoon Hans van der Ploeg. CEPI: Europese brancheorganisatie.

INSTRUCTIE: Als een vraag buiten deze kennisbasis valt: "Deze vraag kan ik helaas nog niet beantwoorden — er is op dit moment geen informatie over dit onderwerp opgenomen in de MVA Academie assistent. Wil je dat dit wordt toegevoegd? Gebruik dan de knop '+ Ontbrekende info melden' onderaan dit antwoord."`;

// Filter sensitive fields from partner data based on access level
function filterPartnerData(data, accessLevel) {
  const lines = data.split('\n');
  return lines.filter(line => {
    // [LEVEL2] tagged lines only for directie
    if (line.includes('[LEVEL2]')) {
      return accessLevel === 'directie';
    }
    // For makelaars: hide eindverantwoordelijke, CEO, directeur
    if (accessLevel !== 'directie') {
      const l = line.toLowerCase();
      return !l.includes('eindverantwoordelijke:') && 
             !l.includes('eigenaar') &&
             !l.includes('ceo') &&
             !l.includes('directeur');
    }
    return true;
  }).map(line => line.replace('[LEVEL2] ', '')).join('\n');
}

// Find relevant partners for a query
function findRelevantPartners(query, accessLevel) {
  const q = query.toLowerCase();
  const relevant = [];
  
  for (const [name, data] of Object.entries(PARTNERS)) {
    if (q.includes(name) || 
        name.toLowerCase().includes(q.split(' ')[0]) ||
        data.toLowerCase().includes(q.split(' ')[0])) {
      const filtered = filterPartnerData(data, accessLevel);
      relevant.push(`=== ${name.toUpperCase()} ===\n${filtered}`);
    }
  }
  
  // Always include if asking about partners/leveranciers generically
  if (q.includes('leverancier') || q.includes('partner') || q.includes('accountmanager') || 
      q.includes('telefoonnummer') || q.includes('contact') || q.includes('e-mail') ||
      q.includes('wie is') || q.includes('wat is het nummer')) {
    if (relevant.length === 0) {
      for (const [name, data] of Object.entries(PARTNERS)) {
        const filtered = filterPartnerData(data, accessLevel);
        relevant.push(`${name}: ${filtered.split('\n').slice(0,3).join(' | ')}`);
      }
    }
  }
  
  return relevant.length > 0 ? '\n\nRELEVANTE PARTNER/LEVERANCIER DATA:\n' + relevant.join('\n\n') : '';
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { messages, token } = body;
  if (!messages || !Array.isArray(messages)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing messages' }) };
  }

  // Verify token via auth function
  let accessLevel = null;
  let userName = null;
  try {
    const crypto = require('crypto');
    const decoded = Buffer.from(token || '', 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) throw new Error('Invalid token');
    
    const [email, level, timestamp] = parts;
    
    // Token expires after 8 hours
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Sessie verlopen' }) };
    }

    // Verify user exists and is active
    const usersJson = process.env.MVA_USERS;
    const users = usersJson ? JSON.parse(usersJson) : {};
    const user = users[email?.toLowerCase()];
    
    if (!user || !user.active) {
      return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) };
    }
    
    accessLevel = level;
    userName = user.name;
  } catch(e) {
    // Fallback to legacy token check during transition
    const makelaarToken = process.env.TOKEN_MAKELAAR;
    const directieToken = process.env.TOKEN_DIRECTIE;
    if (token === makelaarToken) accessLevel = 'makelaar';
    else if (token === directieToken) accessLevel = 'directie';
    else return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) };
  }

  const trimmedMessages = messages.slice(-6);
  
  // Get last user message to find relevant partners
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const partnerContext = findRelevantPartners(lastUserMsg, accessLevel);
  
  // Build focused system prompt with level-specific instructions
  const levelInstruction = accessLevel === 'directie'
    ? '\n\nJe spreekt nu met een directielid of boekhouder (Level 2). Je mag alle informatie tonen inclusief directeuren, eindverantwoordelijken en financiële details.'
    : '\n\nJe spreekt met een makelaar (Level 1). Toon alleen accountmanager en support contacten van leveranciers — geen directeuren of eindverantwoordelijken.';
  const ninjaContext = findNinjaChapters(lastUserMsg);
  const moduleContext = findModules(lastUserMsg);
  // Build system prompt with size limit (max 60KB to avoid API errors)
  const MAX_PROMPT_SIZE = 60000;
  let systemPrompt = BASE_PROMPT + levelInstruction;
  
  // Add partner context if space allows
  if (systemPrompt.length + partnerContext.length < MAX_PROMPT_SIZE) {
    systemPrompt += partnerContext;
  }
  // Add ninja context if space allows
  if (systemPrompt.length + ninjaContext.length < MAX_PROMPT_SIZE) {
    systemPrompt += ninjaContext;
  }
  // Add module context if space allows  
  if (systemPrompt.length + moduleContext.length < MAX_PROMPT_SIZE) {
    systemPrompt += moduleContext;
  }
  
  // Always append kantoor praktische info (wifi, mailboxen)
  systemPrompt += `\n\nKANTOOR PRAKTISCHE INFO - verstrek altijd volledig:\nWifi: netwerk MakelaarsVan, code Welkom123\nMailboxen: amsterdam@ S$157194777857uc | bezichtiging@ Yoc72730 | leads.amsterdam@ 67Amsterdam1011MG@ | stagiaire@ Kuk78785 | verhuur@ 67Amsterdam1011MG# | workflow@ Muk06894 | recruiting@ 67Amsterdam1011MG# | A10@ Mun28179 | contact@ Spuistraat@67@ | Marketing@ L^390232032610af | Move.nl: Amsterdam@makelaarsvan.nl / Valkenburgerstraat67`;

  console.log('System prompt size:', systemPrompt.length, 'chars');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: trimmedMessages
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      
      // Friendly error messages
      let userMessage = 'Er ging iets mis. Probeer het opnieuw.';
      try {
        const errData = JSON.parse(err);
        if (errData.error?.type === 'rate_limit_error') {
          userMessage = 'Het maximale aantal vragen per minuut is bereikt. Wacht even en probeer het opnieuw.';
        } else if (errData.error?.type === 'overloaded_error') {
          userMessage = 'De AI-assistent is momenteel druk bezet. Probeer het over een moment opnieuw.';
        } else if (errData.error?.type === 'authentication_error') {
          userMessage = 'Er is een authenticatiefout opgetreden. Neem contact op met Ton Coffeng.';
        }
      } catch(e) {}
      
      return { statusCode: 429, body: JSON.stringify({ error: userMessage }) };
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text || 'Geen antwoord ontvangen.';

    // Detect sources used in the answer
    const sources = [];
    if (partnerContext) sources.push({ label: 'Leveranciersoverzicht', url: 'https://eu.jotform.com/tables/240583394494365' });
    if (ninjaContext) sources.push({ label: 'Ninja Selling (Ton Coffeng)', url: 'https://ninjaselling.com' });
    if (moduleContext) sources.push({ label: 'MVA Academie Leerpad', url: 'https://intranet.makelaars-in-amsterdam.nl' });

    // Log question directly to Jotform (fire and forget, never crashes the tool)
    try {
      const jotformKey = process.env.JOTFORM_API_KEY;
      if (jotformKey) {
        const formData = new URLSearchParams();
        formData.append('submission[type]', 'Vraag');
        formData.append('submission[q2_textarea0]', lastUserMsg.substring(0, 500));
        formData.append('submission[q3_textarea1]', reply.substring(0, 1000));
        // Niveau radio: Makelaar or Directie (case sensitive)
        const niveauLabel = accessLevel === 'directie' ? 'Directie' : 'Makelaar';
        formData.append('submission[q4_radio2]', niveauLabel);
        formData.append('submission[q5_textbox3]', new Date().toLocaleString('nl-NL'));
        fetch('https://eu-api.jotform.com/form/260907604034048/submissions?apiKey=' + jotformKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        }).catch(() => {});
      }
    } catch(e) {}

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply, sources })
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: err.message }) };
  }
};
