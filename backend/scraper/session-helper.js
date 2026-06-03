// Com o perfil persistente do Chrome (browser.js), a sessão é mantida nativamente.
// Este helper verifica se a sessão ainda está ativa antes de cada scraping.

const { newPage } = require('./browser');

async function assertLoggedIn() {
  const page = await newPage();
  try {
    await page.goto('https://www.managerzone.com/', { waitUntil: 'domcontentloaded' });
    const clubMember = await page.evaluate(() => {
      const match = document.body.innerHTML.match(/clubMember\s*=\s*'(\d+)'/);
      return match ? match[1] : '0';
    });
    if (clubMember !== '1') throw new Error('Sessão expirada — reconecte no app');
  } finally {
    await page.close();
  }
}

module.exports = { assertLoggedIn };
