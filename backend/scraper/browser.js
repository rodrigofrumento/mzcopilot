const puppeteer = require('puppeteer');
const path = require('path');

// Diretório persistente do Chrome — cookies e sessão sobrevivem entre reinicializações
const USER_DATA_DIR = path.join(__dirname, '..', '..', '.chrome-profile');

let _browser = null;

async function getBrowser() {
  if (_browser) {
    try {
      // Verifica se ainda está vivo
      await _browser.pages();
      return _browser;
    } catch (_) {
      _browser = null;
    }
  }

  _browser = await puppeteer.launch({
    headless: true,
    userDataDir: USER_DATA_DIR,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  return _browser;
}

async function newPage() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setDefaultTimeout(30000);
  return page;
}

module.exports = { getBrowser, newPage };
