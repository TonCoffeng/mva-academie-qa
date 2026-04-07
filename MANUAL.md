# MvA Intelligence — Technische Manual
**Versie:** 1.0 | **Datum:** 7 april 2026

## Systemen en GitHub repos

| Systeem | GitHub Repo | Live URL |
|---|---|---|
| Q&A Kennisbank | mva-academie-qa | q-and-a-mva.netlify.app |
| Portal | mva-portal | mva-intelligence.netlify.app |
| Leerpad | mva-leerpad | mva-leerpad.netlify.app |
| Documentbibliotheek | mva-documenten | mva-documenten.netlify.app |
| ACES Profielscan | — | a-c-e-s-test.netlify.app |

## Wachtwoorden

| Gebruiker | Email | Wachtwoord | Level |
|---|---|---|---|
| Ton Coffeng | toncoffeng@makelaarsvan.nl | Level2! | Directie |
| Hans Koppes | hanskoppes@makelaarsvan.nl | Level2! | Directie |
| Monique Klaver | moniqueklaver@makelaarsvan.nl | MVA2026! | Makelaar |

Hash methode: HMAC-SHA256(wachtwoord, salt)
Opgeslagen in: Netlify env var MVA_USERS op project q-and-a-mva

## Q&A Token format
btoa(email + ':' + level + ':' + Date.now())
Sessie timeout: 24 uur

## Veelvoorkomende problemen

### CSS tekst zichtbaar (alle systemen)
Oorzaak: index.html heeft 2x de tag </style>
Fix: Verwijder de eerste via GitHub API PUT

### Sessie verlopen (Q&A)
Oorzaak: token format mismatch of verlopen
Fix: auth.js gebruikt HMAC-SHA256 - wachtwoord was Level2!

### Tegels wit op wit (portal)
Fix: .module-card background van white naar #1A2B5F + color:white

### Doorstuur naar portal (leerpad)
Fix: Verwijder SSO script + vervang netlify.toml door lege versie

## GitHub API fix workflow
TOKEN ophalen via github.com/settings/tokens/new (scope: repo)
1. GET inhoud + SHA
2. Decode: decodeURIComponent(escape(atob(content.replace(/\n/g,''))))
3. Pas aan
4. Encode: btoa(unescape(encodeURIComponent(fixed)))
5. PUT met sha in body
Netlify deployt automatisch binnen 30 seconden.

## Supabase (portal auth)
URL: https://ehqtyhoeubchcwfavdzr.supabase.co
Key: sb_publishable_OqTL874jsDEMKg9LomfrmQ_nwIo6Wet
Tabel: gebruikers (naam, level, actief)

## ACES / Jotform
Kandidaten form: 260858872462873
Origineel ACES: 251273870708057
Partners: 240583394494365
Endpoint: eu-api.jotform.com

## Azure App Registration (toekomst - SharePoint)
Client ID: e03d7975-665f-4a3e-ad14-06d3830bfda8
Tenant ID: c4393f59-4976-4909-a870-23e86e9843a2
Status: beheerderstoestemming nog te verlenen door WPTC

## MVA Huisstijl
Navy: #1A2B5F | Oranje: #E8500A | Font: Roboto

## Agenda Roemer 9 april 2026
1. CORS fix ACES scores naar Jotform 260858872462873
2. Jotform PDF-notificatie Ton+Hans+recruiting@
3. Score-velden q75-q80 checken
4. SSO portal naar Q&A en leerpad

## Contacten
Ton Coffeng - directeur - toncoffeng@makelaarsvan.nl
Hans Koppes - mede-directeur - hanskoppes@makelaarsvan.nl
Monique Klaver - backoffice - moniqueklaver@makelaarsvan.nl
WPTC - IT-partij Microsoft 365/Azure