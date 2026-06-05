const express = require('express');
const router = express.Router();
const { newPage } = require('../scraper/browser');

const MZ_BASE = 'https://www.managerzone.com';

router.get('/debug2', async (req, res) => {
  const page = await newPage();
  try {
    await page.goto(`${MZ_BASE}/?p=tactics&sport_id=1`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2500));

    const results = [];

    for (const letter of ['a','b','c','d','e']) {
      // Tenta várias formas de clicar na aba
      await page.evaluate((l) => {
        // Tenta via jQuery UI
        try {
          const tabs = window.$('#tabs');
          if (tabs && tabs.tabs) {
            const idx = ['a','b','c','d','e'].indexOf(l);
            tabs.tabs('option', 'active', idx);
            return 'jquery-ui';
          }
        } catch(_) {}
        // Fallback: clica no anchor dentro do li
        const anchor = document.querySelector(`#tacticTab_${l} a`);
        if (anchor) { anchor.click(); return 'anchor-click'; }
        // Fallback: clica no li
        const li = document.querySelector(`#tacticTab_${l}`);
        if (li) { li.click(); return 'li-click'; }
        return 'no-click';
      }, letter);

      await new Promise(r => setTimeout(r, 1500));

      const data = await page.evaluate((l) => {
        const formation = document.querySelector('#formation_text')?.textContent?.trim();
        const activeTab = document.querySelector('.ui-tabs-selected, .ui-state-active')?.id;
        const players = [...document.querySelectorAll('#pitch .fieldpos')].map(el => ({
          pid: el.id.replace('drag_n_',''),
          shirt: el.querySelector('.shirt-nr')?.textContent?.trim()?.replace(/\s+/g,''),
          cls: el.className.substring(0,80),
          style: el.getAttribute('style')?.substring(0,80),
        }));
        // Também tenta ler formation de outros locais
        const defs = document.querySelector('#formation_text .defs')?.textContent;
        const mids = document.querySelector('#formation_text .mids')?.textContent;
        const atts = document.querySelector('#formation_text .atts')?.textContent;
        // Checa se há data-formation no container
        const tacticContainer = document.querySelector(`#ttic_${l}, #tacticDiv_${l}, [data-tactic="${l}"]`);
        return {
          letter: l.toUpperCase(),
          activeTab,
          formation,
          defs, mids, atts,
          playerCount: players.length,
          firstPlayer: players[0],
          tacticContainerHtml: tacticContainer?.innerHTML?.substring(0, 200),
        };
      }, letter);

      results.push(data);
    }

    res.json(results);
  } finally {
    await page.close();
  }
});

module.exports = router;
