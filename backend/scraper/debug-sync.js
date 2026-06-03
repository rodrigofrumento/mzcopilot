const db = require('../db/schema');
const { scrapeSquad } = require('./squad');
const { upsertPlayer } = require('../db/players');

(async () => {
  db.run('DELETE FROM players');
  const players = await scrapeSquad();
  console.log('Total retornado:', players.length);

  // Verifica IDs únicos
  const ids = players.map(p => p.id);
  const uniqueIds = new Set(ids);
  console.log('IDs únicos:', uniqueIds.size);

  // Verifica se há jogadores com cells erradas (number null indica problema)
  const problematic = players.filter(p => p.number === null);
  console.log('Jogadores sem número:', problematic.length);
  if (problematic.length > 0) {
    console.log('Exemplo problemático:', JSON.stringify(problematic[0]));
  }

  // Salva todos
  players.forEach(p => upsertPlayer(p));
  const count = db.get('SELECT COUNT(*) as c FROM players').c;
  console.log('Jogadores no DB após upsert:', count);

  process.exit(0);
})();
