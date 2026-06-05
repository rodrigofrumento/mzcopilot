// Inspeciona as classes CSS das células de skill no alt view
// para identificar como o MZ marca skills no máximo
const { newPage } = require('./browser');

(async () => {
  const page = await newPage();
  await page.goto('https://www.managerzone.com/?p=players&sub=alt', { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(
    () => document.querySelectorAll('#playerAltViewTable a[href*="pid="]').length > 0,
    { timeout: 20000 }
  );
  await new Promise(r => setTimeout(r, 3000));

  const result = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#playerAltViewTable a[href*="pid="]')];
    // Pega os primeiros 3 jogadores para amostrar
    return rows.slice(0, 3).map(a => {
      const tr = a.closest('tr');
      const tds = [...tr.querySelectorAll('td')];
      return {
        name: a.textContent.trim(),
        // Todas as tds com suas classes e texto
        cells: tds.map((td, i) => ({
          index: i,
          text: td.textContent.trim(),
          className: td.className,
          innerHTML: td.innerHTML.substring(0, 200),
        })),
      };
    });
  });

  console.log(JSON.stringify(result, null, 2));
  await page.close();
  process.exit(0);
})();
