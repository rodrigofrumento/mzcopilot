const { newPage } = require('./browser');

const MZ_BASE = 'https://www.managerzone.com';

const SKILL_NAME_TO_DB = {
  'Speed':             'skill_speed',
  'Stamina':           'skill_stamina',
  'Play Intelligence': 'skill_play_intelligence',
  'Passing':           'skill_passing',
  'Shooting':          'skill_shooting',
  'Heading':           'skill_heading',
  'Keeping':           'skill_keeping',
  'Ball Control':      'skill_ball_control',
  'Tackling':          'skill_tackling',
  'Aerial Passing':    'skill_aerial_passing',
  'Set Plays':         'skill_set_plays',
};

const DB_TO_POTENTIAL = {
  'skill_speed':             'potential_speed',
  'skill_stamina':           'potential_stamina',
  'skill_play_intelligence': 'potential_play_intelligence',
  'skill_passing':           'potential_passing',
  'skill_shooting':          'potential_shooting',
  'skill_heading':           'potential_heading',
  'skill_keeping':           'potential_keeping',
  'skill_ball_control':      'potential_ball_control',
  'skill_tackling':          'potential_tackling',
  'skill_aerial_passing':    'potential_aerial_passing',
  'skill_set_plays':         'potential_set_plays',
};

async function scrapePlayerProfile(pid) {
  const page = await newPage();
  try {
    await page.goto(`${MZ_BASE}/?p=players&pid=${pid}`, { waitUntil: 'domcontentloaded' });

    const isLoginPage = await page.$('#login_username');
    if (isLoginPage) {
      const err = new Error('Sessão expirada — faça login novamente');
      err.code = 'SESSION_EXPIRED';
      throw err;
    }

    await new Promise(r => setTimeout(r, 1000));

    const profile = await page.evaluate((skillNameToDb, dbToPotential) => {
      const rows = [...document.querySelectorAll('.skills-container table tr')];
      if (rows.length === 0) return { potentials: {}, trainingSpeed: null };

      const lastRow = rows[rows.length - 1];
      const hasScoutRow = lastRow.querySelector('.scout_report_stars') !== null;
      const skillRows = hasScoutRow ? rows.slice(0, -1) : rows;

      // Lê os tiers de High e Low do painel de scout (última linha)
      // "High1" → highTier = "1" ; "Low2" → lowTier = "2"
      // O sup de cada skill é mapeado pelo tier: sup===highTier → H, sup===lowTier → L
      // highIndex/lowIndex = o superscript no label (¹=1, ²=2) — identifica qual grupo
      // highStars/lowStars = número de estrelas — é o tier real (H3, L2, etc.)
      let highIndex = null;
      let highStars = null;
      let lowIndex  = null;
      let lowStars  = null;
      let trainingSpeed = null;

      if (hasScoutRow) {
        const scoutDivs = [...lastRow.querySelectorAll('.scout_report_stars')];
        for (const div of scoutDivs) {
          const label = div.querySelector('.scout_report_name span:first-child')?.textContent.trim();
          const sup   = div.querySelector('.scout_report_name .sup')?.textContent.trim();
          const stars = div.querySelectorAll('i').length;

          if (label === 'High') {
            highIndex = sup;
            highStars = stars;
          } else if (label === 'Low') {
            lowIndex = sup;
            lowStars = stars;
          } else if (label === 'Tr. speed') {
            if (sup) trainingSpeed = `T${sup}`;
            else if (stars > 0) trainingSpeed = `T${stars}`;
          }
        }
      }

      // Mapeia cada skill: sup igual ao índice do grupo → tier = número de estrelas
      const potentials = {};
      for (const tr of skillRows) {
        const nameSpan = tr.querySelector('.skill_name');
        if (!nameSpan) continue;

        const sup = nameSpan.querySelector('.sup')?.textContent.trim();
        if (!sup) continue;

        const skillName = nameSpan.querySelector('span:first-child')?.textContent.trim();
        const dbKey = skillNameToDb[skillName];
        if (!dbKey) continue;

        const potKey = dbToPotential[dbKey];
        if (!potKey) continue;

        if (sup === highIndex && highStars) potentials[potKey] = `H${highStars}`;
        else if (sup === lowIndex && lowStars) potentials[potKey] = `L${lowStars}`;
      }

      // Training Area: nome da skill que o jogador está treinando
      const SKILL_NAMES = ['Speed','Stamina','Play Intelligence','Passing','Shooting',
        'Heading','Keeping','Ball Control','Tackling','Aerial Passing','Set Plays',
        'Experience','Form'];

      const trainingAreaEl =
        document.querySelector('select[name="trainingArea"]') ||
        document.querySelector('#trainingArea') ||
        document.querySelector('select[name="training_area"]') ||
        document.querySelector('select[name="training"]') ||
        document.querySelector('#training_area') ||
        document.querySelector('#training') ||
        // qualquer select cujas opções incluam nomes de skills do MZ
        [...document.querySelectorAll('select')].find(s =>
          [...s.options].some(o => SKILL_NAMES.includes(o.text.trim()))
        ) ||
        // select próximo a texto "training"
        [...document.querySelectorAll('select')].find(s =>
          (s.previousElementSibling?.textContent || s.parentElement?.textContent || '')
            .toLowerCase().includes('training')
        );

      const trainingArea = trainingAreaEl
        ? (trainingAreaEl.options[trainingAreaEl.selectedIndex]?.text?.trim() || null)
        : null;

      return { potentials, trainingSpeed, trainingArea };
    }, SKILL_NAME_TO_DB, DB_TO_POTENTIAL);

    return {
      id: String(pid),
      ...profile.potentials,
      training_speed:  profile.trainingSpeed,
      training_area:   profile.trainingArea,
      is_youth: 1,
    };
  } finally {
    await page.close();
  }
}

module.exports = { scrapePlayerProfile };
