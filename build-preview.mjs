/* Bundles animations into self-contained HTML previews. Browsers block ES modules
 * over file://, so a local double-click needs the engine, panels and content all
 * inlined. Deployed pages use the real modules; this is for preview only.
 *
 *   node build-preview.mjs                       # build a preview for every animation
 *                                                #   in content/ that LACKS one (so a
 *                                                #   newly added animation is covered)
 *   node build-preview.mjs --all                 # rebuild EVERY preview
 *   node build-preview.mjs recursion-fib-levels  # build just this one (or several) */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
const R = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const previewUrl = name => new URL(`./preview-${name}.html`, import.meta.url);

/* The engine bundle is identical for every animation, so read and inline it ONCE. */
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
const panels = [
  ['code.js', 'codePanel'], ['cells.js', 'cellsPanel'], ['nodes.js', 'nodesPanel'],
  ['stream.js', 'streamPanel'], ['chart.js', 'chartPanel'], ['slider.js', 'sliderPanel'],
  ['callstack.js', 'callstackPanel'], ['pegs.js', 'pegsPanel'],
].map(([f, v]) => panel(f, v)).join('\n');
const styles = R('./engine/styles.css');

/* Build one animation's preview. Note links carry a live-relative href
 * (`sorting-heapify.html`), which resolves under anim/ on the deployed pages but
 * 404s in a bundled preview, where files sit at the repo root as preview-<name>.html.
 * Rewrite each note link's href to its preview counterpart so it works locally the
 * same way it will live. If that preview hasn't been built, drop the href entirely so
 * the segment renders as plain, unclickable text -- never a dead link. Live pages
 * keep their bare hrefs; this is a bundling concern only. */
function build(name) {
  const previewExists = base => base === name || existsSync(previewUrl(base));
  const rewriteNoteLinks = src => src.replace(
    /href:\s*(['"])([\w-]+)\.html\1(\s*,)?/g,
    (_m, q, base, comma = '') => previewExists(base)
      ? `href: ${q}preview-${base}.html${q}${comma}`
      : '');
  const content = rewriteNoteLinks(R(`./content/${name}.js`)).replace(/^export default/m, 'const SPEC =');
  writeFileSync(previewUrl(name), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} — preview</title>
<style>${styles}</style></head>
<body><div id="pac"></div>
<script type="module">
${panels}
${overlay}
${engine}
${content}
mountAnimation(SPEC);
</script></body></html>`);
  console.log(`wrote preview-${name}.html`);
}

/* CLI. Named animations build directly. With no name, DISCOVER every animation from
 * content/ and build a preview for any that lacks one -- so a newly added animation
 * gets its preview automatically, which is what the old "refresh what already exists"
 * behaviour missed. `--all` rebuilds every preview. */
const args  = process.argv.slice(2);
const force = args.includes('--all') || args.includes('--force');
const named = args.filter(a => !a.startsWith('-'));

if (named.length) {
  named.forEach(build);
} else {
  const anims = readdirSync(new URL('./content/', import.meta.url))
    .filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, '')).sort();
  const todo = anims.filter(n => force || !existsSync(previewUrl(n)));
  if (!todo.length) {
    console.log(`all ${anims.length} previews already present (use --all to rebuild every one)`);
  } else {
    todo.forEach(build);
    console.log(`built ${todo.length} of ${anims.length} preview(s)${force ? ' (--all)' : ' (were missing)'}`);
  }
}
