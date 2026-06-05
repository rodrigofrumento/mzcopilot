// Intercepta TODOS os requests ajax.php ao navegar pelo treino
const { newPage } = require('./browser');

const pid = process.argv[2] || '235535622';

(async () => {
  const page = await newPage();
  const ajaxCalls = [];

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('ajax.php') || (url.includes('managerzone') && !url.includes('nocache'))) {
      try {
        const text = await res.text().catch(() => '');
        if (text.length > 0 && text.length < 50000) {
          ajaxCalls.push({ url, status: res.status(), body: text.substring(0, 500) });
        }
      } catch (_) {}
    }
  });

  // Navega para a página de treino
  await page.goto(`https://www.managerzone.com/?p=training&sub=reports&sport_id=1`, {
    waitUntil: 'networkidle2',
  });
  await new Promise(r => setTimeout(r, 2000));

  // Tenta navegar para o gráfico de um jogador específico
  await page.goto(`https://www.managerzone.com/?p=training&sub=graphs&sport_id=1&player_id=${pid}`, {
    waitUntil: 'networkidle2',
  });
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== Requests ajax.php capturados ===');
  ajaxCalls.forEach(r => {
    console.log(`\n[${r.status}] ${r.url}`);
    console.log(r.body.substring(0, 300));
    console.log('---');
  });

  // Também tenta variações da URL de histórico
  const testUrls = [
    `https://www.managerzone.com/ajax.php?p=trainingGraph&sub=getJsonTrainingHistory&sport=soccer&player_id=${pid}`,
    `https://www.managerzone.com/ajax.php?p=trainingGraph&sub=history&sport=soccer&player_id=${pid}`,
    `https://www.managerzone.com/ajax.php?p=training&sub=reports&sport=soccer&player_id=${pid}`,
  ];

  console.log('\n=== Teste direto de URLs ===');
  for (const url of testUrls) {
    const result = await page.evaluate(async (u) => {
      const r = await fetch(u, { credentials: 'include' });
      const text = await r.text();
      return { status: r.status, body: text.substring(0, 300) };
    }, url);
    console.log(`\n${url}`);
    console.log(`Status: ${result.status} | Body: ${result.body}`);
  }

  await page.close();
  process.exit(0);
})();
