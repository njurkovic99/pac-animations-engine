/* Bundles one animation into a single self-contained HTML file.
 * Browsers block ES modules over file://, so a local double-click needs this.
 * Deployed pages use the real modules; this is for preview only.
 *   node build-preview.mjs recursion-fib-levels */
import { readFileSync, writeFileSync, existsSync } from 'fs';
const name = process.argv[2];
const R = p => readFileSync(new URL(p, import.meta.url), 'utf8');

/* Note links carry a live-relative href (`sorting-heapify.html`), which resolves
 * under anim/ on the deployed pages but 404s in a bundled preview, where files sit
 * at the repo root as preview-<name>.html. Rewrite each note link's href to its
 * preview counterpart so it works locally the same way it will live. If that
 * preview hasn't been built, drop the href entirely so the segment renders as plain,
 * unclickable text -- never a dead link. Live pages keep their bare hrefs; this is a
 * bundling concern only. */
const previewExists = base =>
  base === name || existsSync(new URL(`./preview-${base}.html`, import.meta.url));

const rewriteNoteLinks = src => src.replace(
  /href:\s*(['"])([\w-]+)\.html\1(\s*,)?/g,
  (_m, q, base, comma = '') => previewExists(base)
    ? `href: ${q}preview-${base}.html${q}${comma}`
    : '');

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

const content = rewriteNoteLinks(R(`./content/${name}.js`)).replace(/^export default/m, 'const SPEC =');

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
${panel('slider.js', 'sliderPanel')}
${panel('callstack.js', 'callstackPanel')}
${overlay}
${engine}
${content}
mountAnimation(SPEC);
</script></body></html>`);
console.log(`wrote preview-${name}.html`);
