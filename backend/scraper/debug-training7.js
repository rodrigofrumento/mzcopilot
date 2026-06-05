// Analisa a estrutura completa das linhas do training report
const { newPage } = require('./browser');

(async () => {
  const page = await newPage();
  await page.goto('https://www.managerzone.com/?p=training_report', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  // Busca o report de hoje (day=5 = sexta)
  const html = await page.evaluate(async () => {
    const r = await fetch('/ajax.php?p=trainingReport&sub=daily&sport=soccer&day=5&sort_order=desc&sort_key=modification&player_sort=all', {
      credentials: 'include'
    });
    return r.text();
  });

  // Parseia no Node via regex simples
  // Extrai as linhas da tabela
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const rows = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) {
    const row = m[1];
    if (row.includes('pid=') || row.includes('player') || row.includes('Keeping') || row.includes('Speed')) {
      rows.push(row.replace(/\s+/g, ' ').trim().substring(0, 500));
    }
  }

  console.log(`=== HTML total: ${html.length} chars ===`);
  console.log('\n=== Primeiras 10 linhas com dados de jogador ===');
  rows.slice(0, 10).forEach((r, i) => console.log(`\n[${i}] ${r}`));

  // Salva HTML completo
  require('fs').writeFileSync('debug-training-full.html', html);
  console.log('\nHTML completo salvo em debug-training-full.html');

  await page.close();
  process.exit(0);
})();
