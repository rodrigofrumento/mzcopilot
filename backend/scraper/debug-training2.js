const { newPage } = require('./browser');

(async () => {
  const page = await newPage();

  // Tenta a URL direta do report
  await page.goto('https://www.managerzone.com/?p=training&sub=reports&sport_id=1', {
    waitUntil: 'networkidle2',
  });
  await new Promise(r => setTimeout(r, 2000));

  // Clica no link de report se existir
  const reportLink = await page.$('#sub_page_nav_training_report a, #leftmenu_training_report a');
  if (reportLink) {
    console.log('Clicando no link de report...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
      reportLink.click(),
    ]);
    await new Promise(r => setTimeout(r, 3000));
  }

  const result = await page.evaluate(() => {
    // URL atual
    const url = window.location.href;

    // Tudo que existe no conteúdo principal
    const mainContent = document.querySelector('#mainDiv, #content, #mainContent, main');
    const mainHTML = mainContent?.innerHTML?.substring(0, 6000) || document.body.innerHTML.substring(0, 6000);

    // Linhas de dados
    const rows = [...document.querySelectorAll('tr')].slice(0, 20).map(tr => ({
      text: tr.textContent.replace(/\s+/g, ' ').trim().substring(0, 200),
      className: tr.className,
    }));

    return { url, mainHTML, rows };
  });

  console.log('URL atual:', result.url);
  console.log('\n=== Primeiras 20 linhas de tabela ===');
  result.rows.forEach((r, i) => console.log(`${i}: [${r.className}] ${r.text}`));
  console.log('\n=== HTML do conteúdo principal ===');
  console.log(result.mainHTML);

  await page.close();
  process.exit(0);
})();
