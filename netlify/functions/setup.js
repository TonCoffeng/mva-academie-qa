// TIJDELIJK: genereer correcte MVA_USERS hash waarden
// NA GEBRUIK VERWIJDEREN
const crypto = require('crypto');

exports.handler = async function(event, context) {
  function hashPassword(password, salt) {
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
  }
  
  const salt1 = 'mva2026ton';
  const salt2 = 'mva2026hans';  
  const salt3 = 'mva2026monique';
  
  const users = {
    'toncoffeng@makelaarsvan.nl': {
      name: 'Ton Coffeng', level: 'directie', salt: salt1,
      passwordHash: hashPassword('Level2!', salt1), active: true
    },
    'hanskoppes@makelaarsvan.nl': {
      name: 'Hans Koppes', level: 'directie', salt: salt2,
      passwordHash: hashPassword('Level2!', salt2), active: true
    },
    'moniqueklaver@makelaarsvan.nl': {
      name: 'Monique Klaver', level: 'makelaar', salt: salt3,
      passwordHash: hashPassword('MVA2026!', salt3), active: true
    }
  };
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(users, null, 2)
  };
};
