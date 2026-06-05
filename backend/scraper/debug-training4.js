const { newPage } = require('./browser');

(async () => {
  const page = await newPage();

  // Intercepta requests AJAX para descobrir a URL do relatório
  const ajaxUrls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('ajax') || url.includes('training') || url.includes('report')) {
      ajaxUrls.push({ url, method: req.method() });
    }
  });

  await page.goto('https://www.managerzone.com/?p=training&sub=reports&sport_id=1', {
    waitUntil: 'networkidle2',
  });
  await new Promise(r => setTimeout(r, 2000));

  // Clica em uma data do calendário (hoje ou recente)
  const dateCell = await page.$('.ui-datepicker-calendar td:not(.ui-datepicker-other-month) a');
  if (dateCell) {
    console.log('Clicando em data do calendário...');
    await dateCell.click();
    await new Promise(r => setTimeout(r, 3000));
  }

  const result = await page.evaluate(() => {
    // Busca qualquer container que apareceu com dados de jogadores
    const body = document.body.innerHTML;
    // Pega seções com "report" ou player data
    const allDivs = [...document.querySelectorAll('div[id], div[class]')]
      .filter(el => {
        const t = (el.id + el.className).toLowerCase();
        return t.includes('report') || t.includes('player') || t.includes('result');
      })
      .map(el => ({
        id: el.id,
        className: el.className,
        html: el.innerHTML.substring(0, 400),
      }));

    // Tabelas com dados
    const tables = [...document.querySelectorAll('table')]
      .filter(t => t.rows.length > 2)
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        className: t.className,
        rows: t.rows.length,
        html: t.innerHTML.substring(0, 600),
      }));

    return { allDivs, tables };
  });

  console.log('\n=== URLs AJAX capturadas ===');
  ajaxUrls.forEach(r => console.log(`${r.method} ${r.url}`));

  console.log('\n=== Divs com report/player ===');
  console.log(JSON.stringify(result.allDivs, null, 2));

  console.log('\n=== Tabelas com dados ===');
  console.log(JSON.stringify(result.tables, null, 2));

  await page.close();
  process.exit(0);
})();
