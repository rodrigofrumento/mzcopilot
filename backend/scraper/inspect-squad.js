const { newPage } = require('./browser');

(async () => {
  const page = await newPage();

  await page.goto('https://www.managerzone.com/?p=players&sub=alt', {
    waitUntil: 'networkidle2',
  });
  await new Promise(r => setTimeout(r, 3000));

  const info = await page.evaluate(() => {
    // Conta links em cada container
    const containers = ['#squad_profiles', '#squad_summary', '#squad_numbers'];
    const counts = {};
    containers.forEach(sel => {
      counts[sel] = document.querySelectorAll(`${sel} a[href*="pid="]`).length;
    });
    const totalLinks = document.querySelectorAll('a[href*="pid="]').length;

    // Pega a row do primeiro link fora de qualquer container específico
    const firstLink = document.querySelector('a[href*="pid="]');
    const row = firstLink?.closest('tr');
    const cells = row ? [...row.querySelectorAll('td')].map(td => td.textContent.trim()) : [];
    const parentIds = [];
    let el = firstLink?.parentElement;
    while (el) { if (el.id) parentIds.push(el.id); el = el.parentElement; }

    return { counts, totalLinks, cells, parentIds: parentIds.slice(0, 6), firstLinkHref: firstLink?.href };
  });

  console.log(JSON.stringify(info, null, 2));
  await page.close();
  process.exit(0);
})();
