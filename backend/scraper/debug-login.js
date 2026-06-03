// node scraper/debug-login.js <usuario> <senha>
const { newPage } = require('./browser');
const SELECTORS = require('./selectors');

const [,, username, password] = process.argv;
if (!username || !password) { console.log('Uso: node scraper/debug-login.js <usuario> <senha>'); process.exit(1); }

(async () => {
  const page = await newPage();
  page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('nav ->', f.url()); });
  page.on('response', r => { if (r.status() >= 300 && r.status() < 400) console.log('redirect', r.status(), '->', r.headers()['location']); });

  await page.goto('https://www.managerzone.com/?p=clubhouse', { waitUntil: 'domcontentloaded' });
  console.log('Página carregada:', page.url());

  // Mostra os campos disponíveis no form
  const formInfo = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input')].map(i => ({ name: i.name, type: i.type, id: i.id }));
    const forms = [...document.querySelectorAll('form')].map(f => ({ action: f.action, method: f.method }));
    return { inputs, forms };
  });
  console.log('Form info:', JSON.stringify(formInfo, null, 2));

  await page.waitForSelector(SELECTORS.login.usernameInput);
  await page.$eval(SELECTORS.login.usernameInput, el => el.value = '');
  await page.$eval(SELECTORS.login.passwordInput, el => el.value = '');
  await page.type(SELECTORS.login.usernameInput, username, { delay: 50 });
  await page.type(SELECTORS.login.passwordInput, password, { delay: 50 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => console.log('(sem navegação)')),
    page.evaluate(() => {
      const form = document.getElementById('login_username').closest('form');
      const btn = form.querySelector('input[type="submit"], button[type="submit"]');
      btn.click();
    }),
  ]);

  await new Promise(r => setTimeout(r, 3000));

  console.log('URL pós-login:', page.url());
  const clubMember = await page.evaluate(() => {
    const match = document.body.innerHTML.match(/clubMember\s*=\s*'(\d+)'/);
    return match ? match[1] : 'não encontrado';
  });
  console.log('clubMember:', clubMember);

  const bodySlice = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Texto da página:\n', bodySlice);

  await page.close();
  process.exit(0);
})();
