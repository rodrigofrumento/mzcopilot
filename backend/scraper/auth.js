const puppeteer = require('puppeteer');
const { saveSession } = require('../db/session');
const SELECTORS = require('./selectors');

const MZ_BASE = 'https://www.managerzone.com';
const LOGIN_URL = `${MZ_BASE}/?p=clubhouse`;
const TIMEOUT = 30000;

async function login(username, password) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });

    await page.waitForSelector(SELECTORS.login.usernameInput, { timeout: TIMEOUT });
    await page.type(SELECTORS.login.usernameInput, username);
    await page.type(SELECTORS.login.passwordInput, password);

    // Submete o form via JS para não depender de seletor de botão
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }),
      page.evaluate((sel) => {
        const input = document.querySelector(sel);
        if (input) {
          const form = input.closest('form');
          if (form) form.submit();
        }
      }, SELECTORS.login.usernameInput),
    ]);

    // Se ainda estiver na página de login, as credenciais estão erradas
    const stillOnLogin = await page.$(SELECTORS.login.usernameInput);
    if (stillOnLogin) throw new Error('Login falhou — verifique usuário e senha');

    const cookies = await page.cookies();
    const sessionCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    if (!sessionCookie) throw new Error('Cookie de sessão não encontrado após login');

    saveSession(sessionCookie);
    return { success: true };

  } finally {
    await browser.close();
  }
}

module.exports = { login };
