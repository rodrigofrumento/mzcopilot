// Debug focado: última linha da tabela (H/L/T) + cores das barras de skill
const { newPage } = require('./browser');

const pid = process.argv[2] || '235686851';

(async () => {
  const page = await newPage();
  await page.goto(`https://www.managerzone.com/?p=players&pid=${pid}`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    // 1. HTML completo da última linha (scout_report)
    const lastRow = document.querySelector('.skills-container table tr:last-child');
    const lastRowHTML = lastRow?.innerHTML || 'não encontrado';

    // 2. Mapa de skill → cor da barra (blevel/rlevel/wlevel) + sup tier
    const rows = [...document.querySelectorAll('.skills-container table tr')];
    const skillBars = rows.slice(0, -1).map(tr => {
      const nameSpan = tr.querySelector('.skill_name');
      const img = tr.querySelector('img.skill');
      const sup = nameSpan?.querySelector('.sup')?.textContent.trim() || null;
      const skillName = nameSpan?.querySelector('span:first-child')?.textContent.trim() || '';
      const imgSrc = img?.src || '';
      const barType = imgSrc.match(/(blevel|rlevel|wlevel)/)?.[1] || 'unknown';
      return { skillName, barType, sup };
    });

    // 3. Texto limpo da última linha
    const lastRowText = lastRow?.textContent.replace(/\s+/g, ' ').trim() || '';

    return { lastRowHTML, skillBars, lastRowText };
  });

  console.log('\n=== Barras por skill (cor + tier) ===');
  console.log(JSON.stringify(result.skillBars, null, 2));
  console.log('\n=== Texto da última linha ===');
  console.log(result.lastRowText);
  console.log('\n=== HTML completo da última linha ===');
  console.log(result.lastRowHTML);

  await page.close();
  process.exit(0);
})();
