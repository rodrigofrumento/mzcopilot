const { newPage } = require('./browser');
const SELECTORS = require('./selectors');

console.log('playerLink selector:', SELECTORS.squad.playerLink);

(async () => {
  const page = await newPage();
  await page.goto('https://www.managerzone.com/?p=players&sub=alt', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  const debug = await page.evaluate((sel) => {
    const summaryLinks = document.querySelectorAll('#squad_summary a[href*="pid="]').length;
    const allLinks = document.querySelectorAll('a[href*="pid="]').length;
    const selectorLinks = document.querySelectorAll(sel).length;
    const first = document.querySelector(sel);
    const cells = first ? [...first.closest('tr').querySelectorAll('td')].map(td => td.textContent.trim()) : [];
    return { summaryLinks, allLinks, selectorLinks, cells };
  }, SELECTORS.squad.playerLink);

  console.log(JSON.stringify(debug, null, 2));
  await page.close();
  process.exit(0);
})();
