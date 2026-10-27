// Builds dist/nyc-transit-hub-demo.html: the real app bundled with demo-shim.js into one offline file.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('..', import.meta.url);
const r = await build({ entryPoints: [new URL('entry.js', import.meta.url).pathname], bundle: true, format: 'iife', minify: true, write: false, loader: { '.json': 'json' }, external: ['https://*'] });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = await readFile(new URL('public/styles.css', root), 'utf8');
const html = await readFile(new URL('public/index.html', root), 'utf8');
const body = html.split('<!--APP-START-->')[1].split('<!--APP-END-->')[0];
const out = `<title>NYC Transit Hub</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=JetBrains+Mono:wght@500;600&family=Public+Sans:wght@400;600&display=swap">
<style>${css}</style>
${body}
<script>${js}</script>
`;
await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/nyc-transit-hub-demo.html', root), out);
console.log('demo bytes', out.length);
