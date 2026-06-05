const { newPage } = require('./browser');

const MZ_BASE = 'https://www.managerzone.com';

async function debugTactics() {
  const page = await newPage();
  try {
    await page.goto(`${MZ_BASE}/?p=tactics&sport_id=1`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    const result = await page.evaluate(() => {
      const out = {};

      // HTML do pitch completo
      const pitch = document.querySelector('#pitch');
      out.pitchHtml = pitch?.innerHTML?.substring(0, 6000);

      // Jogadores no pitch
      const players = [...document.querySelectorAll('#pitch li, #pitch [class*="player"], #pitch [id*="player"]')].slice(0, 20).map(el => ({
        tag: el.tagName, id: el.id, className: el.className.substring(0, 80),
        text: el.textContent.trim().substring(0, 80),
        'data-*': Object.fromEntries([...el.attributes].filter(a => a.name.startsWith('data')).map(a => [a.name, a.value])),
        style: el.getAttribute('style')?.substring(0, 100),
      }));
      out.pitchPlayers = players;

      // Tabs content — cada tab A-E
      const tabContents = [...document.querySelectorAll('[id^="tacticDiv_"], .ui-tabs-panel')].slice(0, 6).map(el => ({
        id: el.id,
        className: el.className.substring(0, 60),
        html: el.innerHTML.substring(0, 2000),
      }));
      out.tabContents = tabContents;

      // Settings: passing, mentality, pressing
      const settingsEls = [
        'select#passing', 'select[name="passing"]', 'select[id*="passing"]',
        'select#mentality', 'select[name="mentality"]', 'select[id*="mentality"]',
        'select#pressing', 'select[name="pressing"]', 'select[id*="pressing"]',
        '#tactics', 'select#tactics',
      ].map(sel => {
        const el = document.querySelector(sel);
        if (!el) return { sel, found: false };
        return {
          sel, found: true, tag: el.tagName, id: el.id, name: el.getAttribute('name'),
          options: [...el.options].map(o => ({ value: o.value, text: o.text, selected: o.selected })),
        };
      });
      out.settingsEls = settingsEls;

      // Todos os selects da página
      const allSelects = [...document.querySelectorAll('select')].map(el => ({
        id: el.id, name: el.name, className: el.className.substring(0,40),
        options: [...el.options].map(o => ({ value: o.value, text: o.text, selected: o.selected })).slice(0,8),
      }));
      out.allSelects = allSelects;

      // Tactic name
      const tacticNameEl = document.querySelector('input[name="tactic_name"], #tactic_name, [id*="tactic_name"]');
      out.tacticName = tacticNameEl ? { found: true, value: tacticNameEl.value, id: tacticNameEl.id } : null;

      // Tabs container HTML (first 3000 chars)
      const tabsEl = document.querySelector('#tabs');
      out.tabsHtml = tabsEl?.innerHTML?.substring(0, 3000);

      return out;
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await page.close();
  }
}

debugTactics().catch(console.error);
