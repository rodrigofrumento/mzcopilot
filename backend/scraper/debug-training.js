const { newPage } = require('./browser');

(async () => {
  const page = await newPage();
  await page.goto('https://www.managerzone.com/?p=training&sub=reports&sport_id=1', {
    waitUntil: 'networkidle2',
  });
  await new Promise(r => setTimeout(r, 3000));

  const result = await page.evaluate(() => {
    // Tenta achar a tabela/container principal de treino
    const candidates = [
      '#training_report', '#trainingReport', '.training-report',
      'table.training', '#training', '.trainingContainer',
      '[id*="training"]', '[class*="training"]',
    ];

    const found = {};
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) found[sel] = el.innerHTML.substring(0, 500);
    }

    // Dump de todos ids/classes relevantes no body
    const allIds = [...document.querySelectorAll('[id]')]
      .map(el => el.id)
      .filter(id => id.toLowerCase().includes('train') || id.toLowerCase().includes('report'));

    const allClasses = [...new Set(
      [...document.querySelectorAll('[class]')]
        .flatMap(el => [...el.classList])
        .filter(c => c.toLowerCase().includes('train') || c.toLowerCase().includes('report'))
    )];

    // Pega as primeiras tabelas da página
    const tables = [...document.querySelectorAll('table')].slice(0, 5).map(t => ({
      id: t.id,
      className: t.className,
      html: t.innerHTML.substring(0, 800),
    }));

    return { found, allIds, allClasses, tables };
  });

  console.log('=== IDs com "training/report" ===');
  console.log(result.allIds);
  console.log('\n=== Classes com "training/report" ===');
  console.log(result.allClasses);
  console.log('\n=== Seletores encontrados ===');
  console.log(JSON.stringify(result.found, null, 2));
  console.log('\n=== Primeiras tabelas ===');
  console.log(JSON.stringify(result.tables, null, 2));

  await page.close();
  process.exit(0);
})();
