/* Bundles one animation into a single self-contained HTML file.
 * Browsers block ES modules over file://, so a local double-click needs this.
 * Deployed pages use the real modules; this is for preview only.
 *   node build-preview.mjs recursion-fib-levels */
import { readFileSync, writeFileSync } from 'fs';
const name = process.argv[2];
const R = p => readFileSync(new URL(p, import.meta.url), 'utf8');

const panel = (file, varName) => {
  let s = R(`./engine/panels/${file}`).replace(/^export /gm, '');
  return `const ${varName} = (() => { ${s}\n return { mount, render }; })();`;
};

const overlay = `const { Overlay } = (() => { ${
  R('./engine/overlay/arrows.js').replace(/^export /gm, '')}\n return { Overlay }; })();`;

const engine = R('./engine/engine.js')
  .replace(/^import[\s\S]*?from '.*?';$/gm, '')
  .replace(/^export class Engine/m, 'class Engine')
  .replace(/^export function mount/m, 'function mountAnimation');

const content = R(`./content/${name}.js`).replace(/^export default/m, 'const SPEC =');

writeFileSync(`./preview-${name}.html`, `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} — preview</title>
<style>${R('./engine/styles.css')}</style></head>
<body><div id="pac"></div>
<script type="module">
${panel('code.js', 'codePanel')}
${panel('cells.js', 'cellsPanel')}
${panel('nodes.js', 'nodesPanel')}
${panel('stream.js', 'streamPanel')}
${panel('chart.js', 'chartPanel')}
${panel('callstack.js', 'callstackPanel')}
${overlay}
${engine}
${content}
mountAnimation(SPEC);
</script></body></html>`);
console.log(`wrote preview-${name}.html`);
