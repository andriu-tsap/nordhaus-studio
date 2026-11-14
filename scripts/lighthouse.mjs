import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { launch } from 'chrome-launcher';
import { mkdir, writeFile } from 'node:fs/promises';
const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] });
try {
  await mkdir('reports', { recursive: true });
  for (const device of ['mobile', 'desktop']) {
    const result = await lighthouse(
      process.env.LH_URL || 'http://127.0.0.1:4173/',
      {
        port: chrome.port,
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
      device === 'desktop' ? desktopConfig : undefined,
    );
    if (!result) throw new Error('Brak raportu Lighthouse');
    const report = result.lhr;
    await writeFile(`reports/lighthouse-${device}.json`, JSON.stringify(report, null, 2));
    const scores = Object.fromEntries(
      Object.entries(report.categories).map(([key, category]) => [
        key,
        Math.round(category.score * 100),
      ]),
    );
    console.log(device, scores);
    await writeFile(`reports/lighthouse-${device}-scores.json`, JSON.stringify(scores, null, 2));
    if (Object.values(scores).some((score) => score < 90)) process.exitCode = 1;
  }
} finally {
  await chrome.kill();
}
