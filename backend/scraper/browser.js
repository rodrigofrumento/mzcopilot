const puppeteer = require('puppeteer');
const path = require('path');

let _browser = null;

async function getBrowser() {
  if (_browser) {
    try {
      await _browser.pages();
      return _browser;
    } catch (_) {
      _browser = null;
    }
  }

  _browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  return _browser;
}

/**
 * Abre uma nova página já com os cookies de sessão do MZ injetados.
 * Os cookies vêm do banco (tabela session), não de um perfil persistente.
 */
async function newPage() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setDefaultTimeout(30000);

  // Injeta cookies da sessão salva no banco
  try {
    const { getSession } = require('../db/session');
    const session = getSession();
    if (session?.cookie) {
      const cookies = session.cookie.split('; ').map(raw => {
        const eqIdx = raw.indexOf('=');
        const name  = raw.substring(0, eqIdx).trim();
        const value = raw.substring(eqIdx + 1).trim();
        return { name, value, domain: 'www.managerzone.com', path: '/' };
      }).filter(c => c.name && c.value);
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
      }
    }
  } catch (_) {
    // Se não houver sessão ainda (ex: primeiro login), prossegue sem cookies
  }

  return page;
}

async function closeBrowser() {
  if (_browser) {
    try { await _browser.close(); } catch (_) {}
    _browser = null;
  }
}

module.exports = { getBrowser, newPage, closeBrowser };
