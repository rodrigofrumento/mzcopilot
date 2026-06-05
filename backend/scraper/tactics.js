const { newPage } = require('./browser');

const MZ_BASE = 'https://www.managerzone.com';

// Dimensões reais do pitch no MZ (medidas do debug)
const PITCH_W = 220;
const PITCH_H = 350;

async function scrapeTactics() {
  const page = await newPage();
  try {
    await page.goto(`${MZ_BASE}/?p=tactics&sport_id=1`, { waitUntil: 'domcontentloaded' });

    const isLoginPage = await page.$('#login_username');
    if (isLoginPage) {
      const err = new Error('Sessão expirada — faça login novamente');
      err.code = 'SESSION_EXPIRED';
      throw err;
    }

    await new Promise(r => setTimeout(r, 2000));

    // Lê as settings de todas as 5 táticas de uma vez (todos os selects estão no DOM)
    const settings = await page.evaluate(() => {
      const out = {};
      for (const l of ['a','b','c','d','e']) {
        out[l] = {
          passing:    document.querySelector(`#tactics_${l}`)?.value    || null,
          style:      document.querySelector(`#style_${l}`)?.value      || null,
          aggression: document.querySelector(`#aggression_${l}`)?.value || null,
          captain:    document.querySelector(`#captain_${l}`)?.value    || null,
        };
      }
      return out;
    });

    const tactics = [];
    const LETTERS = ['a','b','c','d','e'];

    for (const letter of LETTERS) {
      // Muda a aba via jQuery UI (modo correto para tabs dinâmicas do MZ)
      await page.evaluate((l) => {
        const idx = ['a','b','c','d','e'].indexOf(l);
        try {
          const tabs = window.$('#tabs');
          if (tabs && tabs.tabs) { tabs.tabs('option', 'active', idx); return; }
        } catch(_) {}
        // Fallback: clica no anchor dentro do li
        const anchor = document.querySelector(`#tacticTab_${l} a`);
        if (anchor) anchor.click();
      }, letter);
      await new Promise(r => setTimeout(r, 1500));

      const pitchData = await page.evaluate((pitchW, pitchH) => {
        // Formação
        const defs = document.querySelector('#formation_text .defs')?.textContent?.trim();
        const mids = document.querySelector('#formation_text .mids')?.textContent?.trim();
        const atts = document.querySelector('#formation_text .atts')?.textContent?.trim();
        const formation = (defs && mids && atts) ? `${defs}-${mids}-${atts}` : null;

        // Jogadores no pitch
        const players = [...document.querySelectorAll('#pitch .fieldpos')].map(el => {
          const pid     = el.id.replace('drag_n_', '');
          const shirtNr = el.querySelector('.shirt-nr')?.textContent?.trim()?.replace(/\s+/g,'') || null;
          const cls     = el.className;
          const isGk    = cls.includes('goalkeeper');
          const isSub   = cls.includes('substitute');

          const styleAttr = el.getAttribute('style') || '';
          const leftMatch = styleAttr.match(/left:\s*([\d.]+)px/);
          const topMatch  = styleAttr.match(/top:\s*([\d.]+)px/);
          const left = leftMatch ? parseFloat(leftMatch[1]) : 0;
          const top  = topMatch  ? parseFloat(topMatch[1])  : 0;

          // Normaliza para percentagem do pitch (0-100)
          // x: eixo horizontal; y: 0 = ataque (topo), 100 = GK (fundo)
          const xPct = Math.round((left / pitchW) * 100);
          const yPct = Math.round((top  / pitchH) * 100);

          return { pid, shirtNr, isGk, isSub, left, top, xPct, yPct };
        });

        return { formation, players };
      }, PITCH_W, PITCH_H);

      // Ignora táticas sem jogadores configurados
      if (pitchData.players.length === 0) continue;

      tactics.push({
        id:         letter.toUpperCase(),
        formation:  pitchData.formation,
        passing:    settings[letter].passing,
        mentality:  settings[letter].style,
        pressing:   settings[letter].aggression,
        captain:    settings[letter].captain,
        players:    pitchData.players,
      });
    }

    return tactics;

  } finally {
    await page.close();
  }
}

module.exports = { scrapeTactics };
