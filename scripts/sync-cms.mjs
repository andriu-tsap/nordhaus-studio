import { writeFile } from 'node:fs/promises';
const origin = process.env.WORDPRESS_URL;
if (!origin) throw new Error('Ustaw WORDPRESS_URL, np. http://localhost:8080');
const response = await fetch(`${origin.replace(/\/$/, '')}/wp-json/nordhaus/v1/export`);
if (!response.ok) throw new Error(`CMS: HTTP ${response.status}`);
const data = await response.json();
if (
  !Array.isArray(data.products) ||
  !Array.isArray(data.articles) ||
  data.products.some(
    (p) =>
      !p.id ||
      !p.name ||
      !Number.isInteger(p.price) ||
      p.price <= 0 ||
      !['Meble', 'Oświetlenie', 'Dodatki'].includes(p.category) ||
      !['chair', 'table', 'lamp', 'sofa', 'vase'].includes(p.image),
  )
)
  throw new Error('Nieprawidłowe dane eksportu CMS');
await writeFile(
  new URL('../packages/domain/src/cms.ts', import.meta.url),
  `// Generated from the public Nordhaus CMS export. Never place private data here.\nimport type { Product,Article } from './index.js';\nexport const cmsProducts:Product[]=${JSON.stringify(data.products, null, 2)};\nexport const cmsArticles:Article[]=${JSON.stringify(data.articles, null, 2)};\n`,
);
console.log(
  `CMS: ${data.products.length} produktów, ${data.articles.length} artykułów. Uruchom npm run build.`,
);
