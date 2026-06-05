const { newPage } = require('./browser');
const SELECTORS = require('./selectors');

const SQUAD_URL = 'https://www.managerzone.com/?p=players&sub=alt';

// Ordem das skills como aparecem na tabela do MZ
const SKILL_COLUMNS = [
  'skill_speed', 'skill_stamina', 'skill_play_intelligence', 'skill_passing',
  'skill_shooting', 'skill_heading', 'skill_keeping', 'skill_ball_control',
  'skill_tackling', 'skill_aerial_passing', 'skill_set_plays',
  'skill_experience', 'skill_form',
];

function parseValue(str) {
  return parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
}

async function scrapeSquad() {
  const page = await newPage();
  try {
    await page.goto(SQUAD_URL, { waitUntil: 'domcontentloaded' });

    // Detecta redirecionamento para tela de login (sessão expirada)
    const isLoginPage = await page.$('#login_username');
    if (isLoginPage) {
      const err = new Error('Sessão expirada — faça login novamente');
      err.code = 'SESSION_EXPIRED';
      throw err;
    }

    // Aguarda o #squad_summary ter jogadores e o count parar de crescer (AJAX completo)
    await page.waitForFunction(
      () => document.querySelectorAll('#squad_summary a[href*="pid="]').length > 0,
      { timeout: 20000 }
    );
    // Dá tempo para o resto do lote AJAX carregar
    await new Promise(r => setTimeout(r, 3000));

    const players = await page.evaluate((skillCols, selectors) => {
      const rows = [...document.querySelectorAll(selectors.playerLink)];
      return rows.map(a => {
        const tr = a.closest('tr');
        const cells = [...tr.querySelectorAll('td')].map(td => td.textContent.trim());
        const pidMatch = a.href.match(/pid=(\d+)/);

        const tds = [...tr.querySelectorAll('td')];
        const skills = {};
        const maxedSkills = [];
        skillCols.forEach((col, i) => {
          skills[col] = parseInt(cells[6 + i], 10) || 0;
          if (tds[6 + i]?.className === 'maxed') maxedSkills.push(col);
        });

        return {
          id: pidMatch?.[1] || '',
          name: a.textContent.trim(),
          number: parseInt(cells[0], 10) || null,
          age: parseInt(cells[4], 10) || null,
          birth_season: parseInt(cells[5], 10) || null,
          value: cells[2],
          salary: cells[3],
          is_youth: 0,
          maxed_skills: JSON.stringify(maxedSkills),
          ...skills,
        };
      });
    }, SKILL_COLUMNS, SELECTORS.squad);

    return players;
  } finally {
    await page.close();
  }
}

module.exports = { scrapeSquad };
