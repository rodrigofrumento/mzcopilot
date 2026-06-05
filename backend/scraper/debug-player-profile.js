// Inspeciona a página de perfil de um jogador junior para mapear
// onde ficam os indicadores de potencial (H/L) e Training Speed (T)
// Uso: node scraper/debug-player-profile.js <pid>
const { newPage } = require('./browser');

const pid = process.argv[2] || '235535622';

(async () => {
  const page = await newPage();
  const url = `https://www.managerzone.com/?p=players&pid=${pid}`;
  console.log('Abrindo:', url);

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    // 1. Tenta achar qualquer elemento com texto H1–H4, L1–L2, T1–T4
    const allText = [...document.querySelectorAll('*')].filter(el =>
      el.children.length === 0 && /^[HLT][1-4]$/.test(el.textContent.trim())
    ).map(el => ({
      tag: el.tagName,
      text: el.textContent.trim(),
      className: el.className,
      id: el.id,
      parentHTML: el.parentElement?.outerHTML?.substring(0, 300),
    }));

    // 2. Dump da skills-container completa
    const skillsContainer = document.querySelector('.skills-container');
    const skillsHTML = skillsContainer?.innerHTML?.substring(0, 3000) || 'não encontrado';

    // 3. Linhas da tabela de skills
    const skillRows = [...document.querySelectorAll('.skills-container table tr')].map(tr => ({
      cells: [...tr.querySelectorAll('td, th')].map(td => ({
        text: td.textContent.trim(),
        className: td.className,
        innerHTML: td.innerHTML.substring(0, 200),
      })),
    }));

    return { allText, skillsHTML, skillRows };
  });

  console.log('\n=== Elementos com H/L/T ===');
  console.log(JSON.stringify(result.allText, null, 2));
  console.log('\n=== Linhas da tabela de skills ===');
  console.log(JSON.stringify(result.skillRows, null, 2));
  console.log('\n=== skills-container HTML ===');
  console.log(result.skillsHTML);

  await page.close();
  process.exit(0);
})();
