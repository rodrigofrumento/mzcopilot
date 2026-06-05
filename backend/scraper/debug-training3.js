const { newPage } = require('./browser');

const URLS = [
  'https://www.managerzone.com/?p=training&sub=reports&sport_id=1',
  'https://www.managerzone.com/?p=training&sub=report&sport_id=1',
  'https://www.managerzone.com/?p=training_report&sport_id=1',
  'https://www.managerzone.com/?p=training&sport_id=1&sub=reports',
];

(async () => {
  const page = await newPage();

  for (const url of URLS) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const info = await page.evaluate(() => {
      const text = document.body.innerText.substring(0, 500).replace(/\s+/g, ' ').trim();
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id).filter(Boolean).slice(0, 30);
      return { url: window.location.href, text, ids };
    });

    console.log(`\n=== ${url} ===`);
    console.log('IDs:', info.ids.join(', '));
    console.log('Texto:', info.text);
  }

  await page.close();
  process.exit(0);
})();
