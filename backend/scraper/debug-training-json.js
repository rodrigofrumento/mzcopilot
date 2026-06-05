// Inspeciona o endpoint JSON de histórico de treino do MZ
// Uso: node scraper/debug-training-json.js <pid>
const { newPage } = require('./browser');

const pid = process.argv[2] || '235535622';

(async () => {
  const page = await newPage();

  // Precisa estar autenticado — abre o MZ primeiro
  await page.goto('https://www.managerzone.com/?p=clubhouse', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Busca o JSON de histórico de treino do jogador
  const url = `https://www.managerzone.com/ajax.php?p=trainingGraph&sub=getJsonTrainingHistory&sport=soccer&player_id=${pid}`;
  console.log('Buscando:', url);

  const response = await page.evaluate(async (fetchUrl) => {
    const res = await fetch(fetchUrl, { credentials: 'include' });
    return res.text();
  }, url);

  console.log('\n=== Resposta (primeiros 3000 chars) ===');
  console.log(response.substring(0, 3000));

  try {
    const json = JSON.parse(response);
    console.log('\n=== Estrutura das chaves ===');
    console.log(Object.keys(json));
    if (json.series) {
      console.log('\n=== Primeira série ===');
      console.log(JSON.stringify(json.series[0], null, 2).substring(0, 1000));
    }
  } catch (e) {
    console.log('\nNão é JSON válido:', e.message);
  }

  await page.close();
  process.exit(0);
})();
