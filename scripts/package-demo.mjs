import { gzipSync } from 'node:zlib';
import { readdir, readFile } from 'node:fs/promises';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('apps/storefront/out', 'dist', { recursive: true });
await cp('apps/studio/dist/browser', 'dist/studio', { recursive: true });
await writeFile('dist/.nojekyll', '');
execFileSync('python3', ['scripts/plugin-zip.py']);
console.log('Gotowy pakiet statyczny: dist/ (Next.js + Angular + WordPress Playground plugin).');

async function compress(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = dir + '/' + entry.name;
    if (entry.isDirectory()) await compress(path);
    else if (/\.(js|css|html|svg|txt|json)$/.test(path)) {
      const bytes = await readFile(path);
      if (bytes.length > 1024) await writeFile(path + '.gz', gzipSync(bytes, { level: 9 }));
    }
  }
}
await compress('dist');
