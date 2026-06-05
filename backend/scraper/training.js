const { newPage } = require('./browser');

const SKILL_NAME_TO_KEY = {
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
  'Experience':        'skill_experience',
  'Form':              'skill_form',
};

// Converte JS getDay() (0=Dom,1=Seg,...,6=Sáb) para MZ day (1=Seg,...,6=Sáb)
function getMzDayOfWeek() {
  const jsDay = new Date().getDay(); // 0=Dom
  return jsDay === 0 ? null : jsDay; // Dom não tem treino
}

// Retorna a data real para um dia MZ da semana atual
function getDateForMzDay(mzDay) {
  const today = new Date();
  const todayMz = getMzDayOfWeek() || 6;
  const diff = mzDay - todayMz;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// Parseia o HTML do training report e retorna entries do log
function parseReportHtml(html, mzDay) {
  const logDate = getDateForMzDay(mzDay);
  const entries = [];

  // Extrai seções: "Improvements" = improved=true, resto = improved=false
  const sections = html.split(/<h3[^>]*class="reportSeparator"[^>]*>/);
  // sections[0] = header; sections[1] = "Improvements>..."; sections[2] = possível "Trained without improvement>..."
  let improvedSection = '';
  let notImprovedSection = '';
  for (let i = 1; i < sections.length; i++) {
    const text = sections[i];
    if (text.startsWith('Improvements')) improvedSection = text;
    else notImprovedSection += text;
  }

  function parseSection(sectionHtml, improved) {
    const rowRegex = /id="training_report_(\d+)"[^>]*class="[^"]*?(junior|senior)[^"]*?"/g;
    let m;
    while ((m = rowRegex.exec(sectionHtml)) !== null) {
      const pid = m[1];
      // Pega skill da linha depois do id
      const rowStart = m.index;
      const rowEnd = sectionHtml.indexOf('</tr>', rowStart);
      const rowHtml = sectionHtml.substring(rowStart, rowEnd);
      const skillMatch = rowHtml.match(/class="clippable">([^<]+)<\/span><\/td>/);
      const skill = skillMatch ? SKILL_NAME_TO_KEY[skillMatch[1].trim()] : null;
      if (skill) {
        entries.push({ player_id: pid, log_date: logDate, skill, improved, mz_day: mzDay });
      }
    }
  }

  parseSection(improvedSection, true);
  parseSection(notImprovedSection, false);

  return entries;
}

async function scrapeTrainingWeek() {
  const page = await newPage();
  try {
    await page.goto('https://www.managerzone.com/?p=training_report', { waitUntil: 'networkidle2' });

    const isLoginPage = await page.$('#login_username');
    if (isLoginPage) {
      const err = new Error('Sessão expirada — faça login novamente');
      err.code = 'SESSION_EXPIRED';
      throw err;
    }

    await new Promise(r => setTimeout(r, 2000));

    const currentMzDay = getMzDayOfWeek();
    const daysToScrape = currentMzDay ? Array.from({ length: currentMzDay }, (_, i) => i + 1) : [6];

    const allEntries = [];

    for (const day of daysToScrape) {
      const html = await page.evaluate(async (d) => {
        const url = `/ajax.php?p=trainingReport&sub=daily&sport=soccer&day=${d}&sort_order=asc&sort_key=player_name&player_sort=all`;
        const res = await fetch(url, { credentials: 'include' });
        return res.text();
      }, day);

      const entries = parseReportHtml(html, day);
      allEntries.push(...entries);

      await new Promise(r => setTimeout(r, 800));
    }

    return allEntries;
  } finally {
    await page.close();
  }
}

module.exports = { scrapeTrainingWeek };
