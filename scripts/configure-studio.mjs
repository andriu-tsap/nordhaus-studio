import { writeFile } from 'node:fs/promises';
await writeFile(
  'apps/studio/src/config.js',
  `window.NORDHAUS_API_URL=${JSON.stringify(process.env.STUDIO_API_URL || '')};\n`,
);
