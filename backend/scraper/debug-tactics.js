const { newPage } = require('./browser');

const MZ_BASE = 'https://www.managerzone.com';

async function debugTactics() {
  const page = await newPage();
  try {
    await page.goto(`${MZ_BASE}/?p=tactics&sport_id=1`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const result = await page.evaluate(() => {
      const out = {};

      // Verifica login
      out.isLogin = !!document.querySelector('#login_username');

      // Tenta descobrir estrutura da página
      out.title = document.title;

      // Containers de táticas
      const tacticTabs = [...document.querySelectorAll('[class*="tactic"]')].slice(0, 20).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className.substring(0, 80),
        text: el.textContent.trim().substring(0, 60),
      }));
      out.tacticTabs = tacticTabs;

      // Tenta pegar abas A B C D E
      const tabs = [...document.querySelectorAll('.tactics_tab, [id*="tactic"], [class*="tab"]')].slice(0, 20).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className.substring(0, 80),
        text: el.textContent.trim().substring(0, 60),
      }));
      out.tabs = tabs;

      // Estrutura geral da página (top level)
      const mainDivs = [...document.querySelectorAll('#main > div, #content > div, .main-content > div')].slice(0, 10).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className.substring(0, 80),
        childCount: el.children.length,
      }));
      out.mainDivs = mainDivs;

      // Pegar todo HTML da área de táticas (primeiros 8000 chars)
      const tacticsArea = document.querySelector('#tactics_content, #tactics, .tactics-container, [id*="tactics"]');
      out.tacticsAreaId = tacticsArea?.id;
      out.tacticsAreaClass = tacticsArea?.className?.substring(0, 80);
      out.tacticsAreaHtml = tacticsArea?.innerHTML?.substring(0, 4000);

      // Buscar formação
      const formationEls = [...document.querySelectorAll('[class*="formation"], [id*="formation"]')].slice(0, 5).map(el => ({
        tag: el.tagName, id: el.id, className: el.className.substring(0, 80),
        text: el.textContent.trim().substring(0, 100),
      }));
      out.formationEls = formationEls;

      // Jogadores no campo
      const pitchPlayers = [...document.querySelectorAll('[class*="player_position"], [class*="tactic_player"], .field_player')].slice(0, 15).map(el => ({
        tag: el.tagName, id: el.id, className: el.className.substring(0, 80),
        text: el.textContent.trim().substring(0, 60),
        'data-*': Object.fromEntries([...el.attributes].filter(a => a.name.startsWith('data')).map(a => [a.name, a.value])),
      }));
      out.pitchPlayers = pitchPlayers;

      // Dump do body (500 chars do início)
      out.bodyStart = document.body.innerHTML.substring(0, 500);

      // Seletores comuns de MZ
      const selectors = [
        '#tacticsField', '#field', '.tactics-field', '.pitch',
        '#tactic_A', '[id^="tactic_"]',
        '.tactic_settings', '.tactic-settings',
        'select[name*="formation"]', 'select[name*="tactic"]',
      ];
      out.selectorCheck = {};
      for (const s of selectors) {
        const el = document.querySelector(s);
        out.selectorCheck[s] = el ? { found: true, tag: el.tagName, id: el.id, className: el.className?.substring(0,60) } : null;
      }

      return out;
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await page.close();
  }
}

debugTactics().catch(console.error);
