/** Builds a static, self-contained visualizer for the OpenWiki output tree. */

import fs from "node:fs";
import path from "node:path";

import {
  buildGraph,
  PROJECT_DIR,
  REPO_SLUG,
  sourceRef,
  WIKI_DIR,
  type WikiGraph,
} from "./openwiki-graph.js";

const OUTPUT_DIR = path.join(PROJECT_DIR, "wiki-site");

interface Source {
  repo: string;
  ref: string;
  wiki: string;
}

const CDN = {
  forceGraph: {
    src: "https://cdn.jsdelivr.net/npm/force-graph@1.49.5/dist/force-graph.min.js",
    integrity: "sha384-Q7cpDGRIjLb0dIzHOl/cCcP5MM6ixkekYU/M/Y4shUqh7h2IgtwAY7coox/PB0/S",
  },
  marked: {
    src: "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js",
    integrity: "sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi",
  },
  domPurify: {
    src: "https://cdn.jsdelivr.net/npm/dompurify@3.4.12/dist/purify.min.js",
    integrity: "sha384-piCcpDdJ7qVeK4Tv8Z6Hpcr3ZBIgP16TxQTPVfsLFdZ5uDgwc3Y8Ho7oUnqf12qu",
  },
  mermaid: {
    src: "https://cdn.jsdelivr.net/npm/mermaid@11.16.0/dist/mermaid.min.js",
    integrity: "sha384-T/0lMUdJpd2S1ZHtRiofG3htU3xPCrFVeAQ1UUE2TJwlEJSV5NUwn30kP28n238E",
  },
} as const;

const STYLES = `
:root {
  color-scheme: light dark;
  --bg: #0f1115;
  --panel: #161920;
  --panel-2: #1c2029;
  --border: #272c38;
  --text: #e6e9ef;
  --muted: #9aa4b6;
  --accent: #6ea8fe;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f6f7f9;
    --panel: #ffffff;
    --panel-2: #f0f2f5;
    --border: #dfe3ea;
    --text: #1a1d23;
    --muted: #5b6472;
    --accent: #1f6feb;
    --shadow: 0 1px 3px rgba(16, 24, 40, 0.08);
  }
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}
header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}
header h1 { font-size: 15px; margin: 0; letter-spacing: -0.01em; }
header h1 span { color: var(--muted); font-weight: 400; }
#search {
  flex: 1 1 220px;
  min-width: 180px;
  padding: 7px 11px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  font: inherit;
  font-size: 14px;
}
#search:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
#filters { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--muted);
  border-radius: 999px;
  padding: 4px 11px;
  font-size: 12.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chip.on { color: var(--text); border-color: currentColor; }
.chip .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
#count { color: var(--muted); font-size: 12.5px; white-space: nowrap; }
main { flex: 1; display: flex; min-height: 0; }
#graph { flex: 1 1 55%; min-width: 0; position: relative; }
#reader {
  flex: 0 0 46%;
  max-width: 720px;
  border-left: 1px solid var(--border);
  background: var(--panel);
  overflow-y: auto;
  padding: 24px 28px 64px;
}
#reader.empty { display: flex; align-items: center; justify-content: center; color: var(--muted); }
.badge {
  display: inline-block;
  border-radius: 5px;
  padding: 2px 8px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #fff;
}
.doc h1 { font-size: 24px; margin: 12px 0 6px; letter-spacing: -0.02em; }
.doc h2 { font-size: 18px; margin: 28px 0 8px; padding-bottom: 5px; border-bottom: 1px solid var(--border); }
.doc h3 { font-size: 15.5px; margin: 22px 0 6px; }
.doc .lede { color: var(--muted); margin: 0 0 14px; }
.doc code {
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 12.8px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}
.doc pre {
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 13px 15px;
  overflow-x: auto;
}
.doc pre code { background: none; border: 0; padding: 0; }
.doc table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; }
.doc th, .doc td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
.doc blockquote {
  margin: 14px 0;
  padding: 2px 14px;
  border-left: 3px solid var(--border);
  color: var(--muted);
}
.doc a { color: var(--accent); }
.doc a[data-goto] { cursor: pointer; text-decoration: underline; }
.doc img { max-width: 100%; }
.doc h1, .doc h2, .doc h3 { scroll-margin-top: 12px; }
.mermaid { background: var(--panel-2); border: 1px solid var(--border); border-radius: 8px; padding: 14px; overflow-x: auto; text-align: center; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin: 10px 0 0; }
.tag { font-size: 11.5px; color: var(--muted); background: var(--panel-2); border: 1px solid var(--border); border-radius: 999px; padding: 2px 9px; }
.rel { margin-top: 34px; border-top: 1px solid var(--border); padding-top: 16px; }
.rel h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
.rel ul { margin: 0 0 18px; padding-left: 18px; }
.rel a { color: var(--accent); cursor: pointer; }
footer { color: var(--muted); font-size: 12px; padding: 10px 20px; border-top: 1px solid var(--border); background: var(--panel); }
@media (max-width: 900px) {
  main { flex-direction: column; }
  #graph { flex: 0 0 46vh; }
  #reader { flex: 1; max-width: none; border-left: 0; border-top: 1px solid var(--border); }
}
`;

const CLIENT = `
var PALETTE = ['#6ea8fe','#f5a97f','#a6da95','#c6a0f6','#ee99a0','#8bd5ca','#eed49f','#b7bdf8','#f0c6c6','#91d7e3'];
var state = { graph: null, byId: new Map(), color: new Map(), active: new Set(), query: '', current: null };
var chart = null;

function colorFor(type) { return state.color.get(type) || '#8892a4'; }

function matches(node) {
  if (state.active.size && !state.active.has(node.type)) return false;
  if (!state.query) return true;
  var q = state.query;
  return (node.title + ' ' + node.description + ' ' + node.tags.join(' ') + ' ' + node.id + ' ' + node.body).toLowerCase().indexOf(q) !== -1;
}

function visibleData() {
  var nodes = state.graph.nodes.filter(matches);
  var ids = new Set(nodes.map(function (n) { return n.id; }));
  var links = state.graph.edges
    .filter(function (e) { return ids.has(e.source) && ids.has(e.target); })
    .map(function (e) { return { source: e.source, target: e.target }; });
  var degree = new Map();
  links.forEach(function (l) {
    degree.set(l.source, (degree.get(l.source) || 0) + 1);
    degree.set(l.target, (degree.get(l.target) || 0) + 1);
  });
  return {
    nodes: nodes.map(function (n) {
      return { id: n.id, title: n.title, type: n.type, val: 1 + (degree.get(n.id) || 0) };
    }),
    links: links
  };
}

function refresh() {
  var data = visibleData();
  document.getElementById('count').textContent =
    data.nodes.length + ' of ' + state.graph.nodes.length + ' pages';
  chart.graphData(data);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resolveTarget(fromId, href) {
  var hash = href.indexOf('#');
  var anchor = hash === -1 ? '' : href.slice(hash + 1);
  var file = hash === -1 ? href : href.slice(0, hash);
  var dir = fromId.indexOf('/') === -1 ? '' : fromId.slice(0, fromId.lastIndexOf('/'));
  var parts = (dir ? dir.split('/') : []).concat(file.split('/'));
  var stack = [];
  var escaped = false;
  parts.forEach(function (part) {
    if (!part || part === '.') return;
    if (part === '..') {
      if (stack.length) stack.pop(); else escaped = true;
      return;
    }
    stack.push(part);
  });
  // A directory link such as "architecture/" means that section's index page.
  if (!escaped && file.charAt(file.length - 1) === '/') stack.push('index.md');
  var joined = stack.join('/');
  var id = escaped ? null : joined;
  if (id && !state.byId.has(id) && state.byId.has(id + '/index.md')) id = id + '/index.md';
  return { id: id, path: joined, anchor: anchor, escaped: escaped };
}

function sourceHref(repoPath, anchor) {
  var source = window.WIKI_SOURCE || {};
  if (!source.repo || !repoPath) return null;
  return 'https://github.com/' + source.repo + '/blob/' + source.ref + '/' + repoPath +
    (anchor ? '#' + anchor : '');
}

function slugify(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z0-9#]+;/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9 _-]+/g, '')
    .trim()
    .replace(/[ _]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

var slugCounts = new Map();

function headingId(text) {
  var base = slugify(text) || 'section';
  var seen = slugCounts.get(base) || 0;
  slugCounts.set(base, seen + 1);
  return seen ? base + '-' + seen : base;
}

function scrollToAnchor(reader, anchor) {
  if (!anchor) return;
  var target = null;
  try {
    target = reader.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(anchor) : anchor));
  } catch (error) {
    target = null;
  }
  if (target) target.scrollIntoView({ block: 'start' });
}

function linkList(title, ids) {
  if (!ids.length) return '';
  var items = ids.map(function (id) {
    var node = state.byId.get(id);
    return '<li><a data-goto="' + escapeHtml(id) + '">' + escapeHtml(node ? node.title : id) + '</a></li>';
  }).join('');
  return '<h4>' + title + '</h4><ul>' + items + '</ul>';
}

function select(id, push, anchor) {
  var node = state.byId.get(id);
  var reader = document.getElementById('reader');
  if (!node) {
    reader.className = 'empty';
    reader.innerHTML = '<p>Select a page in the graph.</p>';
    return;
  }

  state.current = id;
  if (push !== false) {
    history.replaceState(null, '', '#' + encodeURIComponent(id) + (anchor ? '#' + anchor : ''));
  }

  var head =
    '<span class="badge" style="background:' + colorFor(node.type) + '">' + escapeHtml(node.type) + '</span>' +
    '<h1>' + escapeHtml(node.title) + '</h1>' +
    (node.description ? '<p class="lede">' + escapeHtml(node.description) + '</p>' : '') +
    (node.tags.length
      ? '<div class="tags">' + node.tags.map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('') + '</div>'
      : '');

  slugCounts = new Map();
  var body = DOMPurify.sanitize(marked.parse(node.body), { ADD_ATTR: ['data-goto', 'data-anchor'] });
  var related = linkList('Links out', node.links) + linkList('Linked from', node.backlinks);

  reader.className = '';
  reader.innerHTML =
    '<div class="doc">' + head + body + '</div>' +
    (related ? '<div class="rel">' + related + '</div>' : '');
  reader.scrollTop = 0;

  // Every relative href must end up either in-app or pointing at GitHub. One left as-is
  // would navigate the browser out of this single page and land on a Pages 404.
  reader.querySelectorAll('.doc a[href]').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.charAt(0) === '#') return;

    var source = window.WIKI_SOURCE || {};
    var external = function (repoPath, anchor) {
      var url = sourceHref(repoPath, anchor);
      if (!url) return;
      link.setAttribute('href', url);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noreferrer');
    };

    // "/README.md" and friends are rooted at the repository, not at this site.
    if (href.charAt(0) === '/') {
      var split = href.indexOf('#');
      external(
        (split === -1 ? href : href.slice(0, split)).replace(/^[/]+/, ''),
        split === -1 ? '' : href.slice(split + 1)
      );
      return;
    }

    var target = resolveTarget(node.id, href);
    if (target.id && state.byId.has(target.id)) {
      link.setAttribute('data-goto', target.id);
      if (target.anchor) link.setAttribute('data-anchor', target.anchor);
      link.removeAttribute('href');
      return;
    }

    var repoPath = target.escaped || !source.wiki ? target.path : source.wiki + '/' + target.path;
    external(repoPath, target.anchor);
  });

  reader.querySelectorAll('.doc a[href^="#"]').forEach(function (link) {
    link.setAttribute('data-goto', node.id);
    link.setAttribute('data-anchor', link.getAttribute('href').slice(1));
    link.removeAttribute('href');
  });

  renderMermaid(reader);
  scrollToAnchor(reader, anchor);
}

function renderMermaid(root) {
  var blocks = root.querySelectorAll('pre > code.language-mermaid');
  if (!blocks.length) return;
  var targets = [];
  blocks.forEach(function (code) {
    var holder = document.createElement('div');
    holder.className = 'mermaid';
    holder.textContent = code.textContent;
    code.parentNode.replaceWith(holder);
    targets.push(holder);
  });
  mermaid.run({ nodes: targets }).catch(function (error) {
    console.warn('[wiki] mermaid render failed', error);
  });
}

function buildFilters() {
  var host = document.getElementById('filters');
  state.graph.types.forEach(function (type, index) {
    state.color.set(type, PALETTE[index % PALETTE.length]);
    var chip = document.createElement('button');
    chip.className = 'chip';
    chip.style.color = state.color.get(type);
    chip.innerHTML = '<span class="dot"></span>' + escapeHtml(type);
    chip.addEventListener('click', function () {
      if (state.active.has(type)) { state.active.delete(type); chip.classList.remove('on'); }
      else { state.active.add(type); chip.classList.add('on'); }
      refresh();
    });
    host.appendChild(chip);
  });
}

function initGraph() {
  var host = document.getElementById('graph');
  chart = ForceGraph()(host)
    .nodeId('id')
    .nodeRelSize(4)
    .nodeVal(function (n) { return n.val; })
    .nodeColor(function (n) { return n.id === state.current ? '#ffffff' : colorFor(n.type); })
    .nodeLabel(function (n) { return n.title; })
    .linkColor(function () { return 'rgba(136, 146, 164, 0.35)'; })
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .nodeCanvasObjectMode(function () { return 'after'; })
    .nodeCanvasObject(function (n, ctx, scale) {
      if (scale < 1.4) return;
      ctx.font = (11 / scale) + 'px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = getComputedStyle(document.body).color;
      ctx.textBaseline = 'middle';
      ctx.fillText(n.title, n.x + 7, n.y);
    })
    .onNodeClick(function (n) { select(n.id); chart.centerAt(n.x, n.y, 400); })
    .width(host.clientWidth)
    .height(host.clientHeight);

  chart.d3Force('charge').strength(-140);

  window.addEventListener('resize', function () {
    chart.width(host.clientWidth).height(host.clientHeight);
  });
}

document.addEventListener('click', function (event) {
  var link = event.target.closest('[data-goto]');
  if (!link) return;
  event.preventDefault();
  select(link.getAttribute('data-goto'), true, link.getAttribute('data-anchor') || '');
});

function boot() {
  return fetch('./graph.json')
    .then(function (response) { return response.json(); })
    .then(function (graph) {
      state.graph = graph;
      graph.nodes.forEach(function (n) { state.byId.set(n.id, n); });

      var dark = matchMedia('(prefers-color-scheme: dark)').matches;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'default' });
      marked.use({
        renderer: {
          heading: function (text, level) {
            return '<h' + level + ' id="' + headingId(text) + '">' + text + '</h' + level + '>';
          }
        }
      });

      document.getElementById('generated').textContent = new Date(graph.generatedAt).toUTCString();
      buildFilters();
      initGraph();
      refresh();

      var search = document.getElementById('search');
      search.addEventListener('input', function () {
        state.query = search.value.trim().toLowerCase();
        refresh();
      });

      var hash = (location.hash || '').slice(1);
      var split = hash.indexOf('#');
      var initial = decodeURIComponent(split === -1 ? hash : hash.slice(0, split));
      var initialAnchor = split === -1 ? '' : hash.slice(split + 1);
      var fallback = state.byId.has('index.md') ? 'index.md' : graph.nodes[0] && graph.nodes[0].id;
      select(state.byId.has(initial) ? initial : fallback, false, initialAnchor);
    })
    .catch(function (error) {
      document.getElementById('reader').innerHTML =
        '<p>Could not load <code>graph.json</code>. Serve this directory over HTTP rather than opening the file directly.</p>';
      console.error('[wiki]', error);
    });
}

boot();
`;

function script(entry: { src: string; integrity: string }): string {
  return `<script src="${entry.src}" integrity="${entry.integrity}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`;
}

function renderPage(graph: WikiGraph, source: Source): string {
  const name = source.repo.split("/").pop() ?? source.repo;
  const sourceJson = JSON.stringify(source).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} wiki</title>
<meta name="description" content="Interactive graph of the ${name} OpenWiki documentation.">
<style>${STYLES}</style>
</head>
<body>
<header>
  <h1>${name} <span>wiki</span></h1>
  <input id="search" type="search" placeholder="Search pages, tags and content" autocomplete="off" spellcheck="false">
  <div id="filters"></div>
  <div id="count">${graph.nodes.length} pages</div>
</header>
<main>
  <div id="graph"></div>
  <div id="reader" class="empty"><p>Loading&hellip;</p></div>
</main>
<footer>
  Generated by <a href="https://github.com/langchain-ai/openwiki">OpenWiki</a> &middot;
  <span id="generated">&hellip;</span>
</footer>
${script(CDN.forceGraph)}
${script(CDN.marked)}
${script(CDN.domPurify)}
${script(CDN.mermaid)}
<script>window.WIKI_SOURCE = ${sourceJson};</script>
<script>${CLIENT}</script>
</body>
</html>
`;
}

/** Base path this site is served from, e.g. `/zoho-desk-nodejs-sdk/` for a project page. */
function basePath(repo: string): string {
  const name = repo.split("/").pop() ?? repo;
  return name.toLowerCase().endsWith(".github.io") ? "/" : `/${name}/`;
}

/**
 * Every URL path that should resolve to a page, so a stray `/architecture/` can be
 * mapped back onto its `#architecture/index.md` route instead of dead-ending.
 */
function routeTable(graph: WikiGraph): Record<string, string> {
  const routes: Record<string, string> = {};
  const claim = (key: string, id: string): void => {
    const normalized = key.toLowerCase();
    if (!(normalized in routes)) routes[normalized] = id;
  };

  for (const node of graph.nodes) {
    const stem = node.id.replace(/\.md$/i, "");
    const segments = stem.split("/");
    const isIndex = segments[segments.length - 1].toLowerCase() === "index";
    const bare = isIndex ? segments.slice(0, -1).join("/") : stem;

    claim(node.id, node.id);
    claim(stem, node.id);
    claim(bare, node.id);
    claim(`${bare}/`, node.id);
    // The GitHub Wiki flattens the same page to `architecture-overview`.
    claim(bare.split("/").join("-"), node.id);
  }

  delete routes[""];
  return routes;
}

function renderNotFound(graph: WikiGraph, source: Source): string {
  const name = source.repo.split("/").pop() ?? source.repo;
  const base = JSON.stringify(basePath(source.repo));
  const routes = JSON.stringify(routeTable(graph)).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} wiki</title>
<meta name="robots" content="noindex">
<style>${STYLES}
main { align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }
main p { color: var(--muted); }
main a { color: var(--accent); }
</style>
</head>
<body>
<main><p>This wiki lives on a single page. <a id="home" href=".">Open the wiki</a>.</p></main>
<script>
(function () {
  var BASE = ${base};
  var ROUTES = ${routes};

  var pathname = location.pathname;
  var base = pathname.indexOf(BASE) === 0 ? BASE : '/';
  var rest = pathname.slice(base.length);

  document.getElementById('home').setAttribute('href', base);

  try { rest = decodeURIComponent(rest); } catch (error) { /* keep the raw path */ }
  rest = rest.replace(/^[/]+/, '');

  var id = ROUTES[rest.toLowerCase()];
  if (!id && rest) id = ROUTES[rest.replace(/[/]+$/, '').toLowerCase()];

  var anchor = (location.hash || '').slice(1);
  location.replace(
    base + (id ? '#' + encodeURIComponent(id) + (anchor ? '#' + anchor : '') : '')
  );
})();
</script>
</body>
</html>
`;
}

function main(): void {
  const wikiDir = process.argv[2] ? path.resolve(process.argv[2]) : WIKI_DIR;
  const graph = buildGraph(wikiDir);
  const relative = path.relative(PROJECT_DIR, wikiDir).split(path.sep).join("/");
  const source: Source = {
    repo: REPO_SLUG,
    ref: sourceRef(),
    wiki: relative.startsWith("..") || path.isAbsolute(relative) ? path.basename(wikiDir) : relative,
  };

  if (graph.nodes.length === 0) {
    console.error(`Error: no wiki pages found in ${wikiDir}`);
    process.exit(1);
  }

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUTPUT_DIR, "graph.json"), JSON.stringify(graph));
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), renderPage(graph, source));
  fs.writeFileSync(path.join(OUTPUT_DIR, "404.html"), renderNotFound(graph, source));
  fs.writeFileSync(path.join(OUTPUT_DIR, ".nojekyll"), "");

  console.log(
    `Built ${OUTPUT_DIR}: ${graph.nodes.length} pages, ${graph.edges.length} links, ${graph.types.length} types.`,
  );
  console.log("Preview with: npx serve wiki-site");
}

main();
