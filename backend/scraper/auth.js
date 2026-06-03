const { newPage } = require('./browser');
const { saveSession, clearSession } = require('../db/session');
const SELECTORS = require('./selectors');

const MZ_BASE = 'https://www.managerzone.com';
const LOGIN_URL = `${MZ_BASE}/?p=clubhouse`;

async function login(username, password) {
  const page = await newPage();

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector(SELECTORS.login.usernameInput);
    await page.$eval(SELECTORS.login.usernameInput, el => el.value = '');
    await page.$eval(SELECTORS.login.passwordInput, el => el.value = '');
    await page.type(SELECTORS.login.usernameInput, username, { delay: 50 });
    await page.type(SELECTORS.login.passwordInput, password, { delay: 50 });

    // Dispara click no submit do form que contém login_username (JS de MD5 precisa rodar)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      page.evaluate(() => {
        const form = document.getElementById('login_username').closest('form');
        const btn = form.querySelector('input[type="submit"], button[type="submit"]');
        btn.click();
      }),
    ]);

    await new Promise(r => setTimeout(r, 2000));

    // Aceita o cookie consent se aparecer
    await page.evaluate(() => {
      const btn = document.getElementById('CybotCookiebotDialogBodyButtonAccept')
        || [...document.querySelectorAll('button')].find(b => b.innerText.includes('Allow all'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Login OK se redirecionou para clubhouse (não está mais na página de login)
    const onLoginPage = await page.$('#login_username');
    if (onLoginPage) throw new Error('Login falhou — verifique usuário e senha');

    const cookies = await page.cookies();
    saveSession(cookies.map(c => `${c.name}=${c.value}`).join('; '));

    return { success: true };

  } finally {
    await page.close();
  }
}

// Verifica se a sessão do perfil persistente ainda está ativa
async function checkSession() {
  const page = await newPage();
  try {
    await page.goto(MZ_BASE, { waitUntil: 'domcontentloaded' });
    const clubMember = await page.evaluate(() => {
      const match = document.body.innerHTML.match(/clubMember\s*=\s*'(\d+)'/);
      return match ? match[1] : '0';
    });
    return clubMember === '1';
  } finally {
    await page.close();
  }
}

module.exports = { login, checkSession };
