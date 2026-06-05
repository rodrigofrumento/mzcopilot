// Captura o href real dos links de treino e intercepta AJAX ao clicar no report
const { newPage } = require('./browser');

(async () => {
  const page = await newPage();
  const ajaxCalls = [];

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('ajax.php')) {
      try {
        const text = await res.text().catch(() => '');
        ajaxCalls.push({ url, status: res.status(), len: text.length, body: text.substring(0, 800) });
      } catch (_) {}
    }
  });

  await page.goto('https://www.managerzone.com/?p=training&sport_id=1', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Captura hrefs dos links de treino
  const links = await page.evaluate(() => {
    const ids = ['sub_page_nav_training_home','sub_page_nav_training_report','sub_page_nav_training_graphs','leftmenu_training_report'];
    return ids.map(id => {
      const el = document.getElementById(id);
      return { id, href: el?.href || el?.querySelector('a')?.href || 'not found', text: el?.textContent?.trim() };
    });
  });

  console.log('=== Links de treino ===');
  console.log(JSON.stringify(links, null, 2));

  // Navega pelo href do training_report
  const reportLink = links.find(l => l.id === 'sub_page_nav_training_report');
  if (reportLink?.href && reportLink.href !== 'not found') {
    console.log('\nNavegando para:', reportLink.href);
    await page.goto(reportLink.href, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    const content = await page.evaluate(() => {
      return {
        url: window.location.href,
        text: document.body.innerText.substring(0, 1000).replace(/\s+/g, ' '),
        tables: [...document.querySelectorAll('table')].map(t => ({
          id: t.id, rows: t.rows.length, html: t.outerHTML.substring(0, 600)
        })).filter(t => t.rows > 1).slice(0, 5),
      };
    });

    console.log('\n=== Conteúdo do Training Report ===');
    console.log('URL:', content.url);
    console.log('Texto:', content.text);
    console.log('Tabelas:', JSON.stringify(content.tables, null, 2));
  }

  console.log('\n=== AJAX calls após navegação ===');
  ajaxCalls.forEach(c => console.log(`[${c.status}] len=${c.len} ${c.url}\n${c.body}\n---`));

  await page.close();
  process.exit(0);
})();
