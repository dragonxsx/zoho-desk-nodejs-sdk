/** Stages the OpenWiki output tree for publication to the GitHub Wiki. */

import fs from "node:fs";
import path from "node:path";

import {
  linkKind,
  PROJECT_DIR,
  readPages,
  replaceMarkdownLinks,
  repoFileHref,
  REPO_SLUG,
  resolveLink,
  sourceCommit,
  sourceRef,
  splitFrontmatter,
  WIKI_DIR,
  type WikiPage,
} from "./openwiki-graph.js";

const STAGE_DIR = path.join(PROJECT_DIR, ".wiki-stage");

interface Source {
  repo: string;
  ref: string;
}

function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function pageNames(pages: WikiPage[]): Map<string, string> {
  const names = new Map<string, string>();
  const used = new Set<string>();

  const claim = (id: string, preferred: string, fallback: string): void => {
    let name = sanitize(preferred) || sanitize(fallback) || "page";
    if (used.has(name.toLowerCase())) name = sanitize(fallback);
    let candidate = name;
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = `${name}-${suffix}`;
      suffix += 1;
    }
    used.add(candidate.toLowerCase());
    names.set(id, candidate);
  };

  const home = pages.find((page) => page.id === "index.md");
  if (home) {
    used.add("home");
    names.set(home.id, "Home");
  }

  for (const page of pages) {
    if (names.has(page.id)) continue;
    const stem = page.id.replace(/\.md$/i, "");
    const segments = stem.split("/");
    const isIndex = segments[segments.length - 1].toLowerCase() === "index";
    const flat = segments.join("-");
    const preferred = isIndex ? segments.slice(0, -1).join("-") : flat;
    claim(page.id, preferred, flat);
  }

  return names;
}

function rewriteLinks(page: WikiPage, names: Map<string, string>, source: Source): string {
  return replaceMarkdownLinks(page.body, (target) => {
    const [, anchor = ""] = target.split(/(#.*)$/);

    if (linkKind(target) === "repo") {
      return repoFileHref(source.repo, source.ref, target.split("#")[0], anchor);
    }

    const resolved = resolveLink(page.id, target);

    const name = names.get(resolved);
    if (name) return name + anchor;

    if (resolved.startsWith("../")) {
      const file = resolved.replace(/^(?:\.\.\/)+/, "");
      return repoFileHref(source.repo, source.ref, file, anchor);
    }

    console.warn(`Warning: ${page.id} links to ${target}, which is not a wiki page.`);
    return null;
  });
}

function renderPage(page: WikiPage, names: Map<string, string>, source: Source): string {
  let body = rewriteLinks(page, names, source).trimStart();

  const leadingHeading = body.match(/^#\s+.+\n?/);
  if (leadingHeading) body = body.slice(leadingHeading[0].length).trimStart();

  const parts = [`# ${page.meta.title}`];
  if (page.meta.description) parts.push(`> ${page.meta.description}`);
  if (page.meta.tags.length) parts.push(`*${page.meta.tags.join(" &middot; ")}*`);
  parts.push(body);

  return `${parts.join("\n\n").trimEnd()}\n`;
}

function renderSidebar(pages: WikiPage[], names: Map<string, string>): string {
  const byType = new Map<string, WikiPage[]>();

  for (const page of pages) {
    if (page.id === "index.md") continue;
    const bucket = byType.get(page.meta.type) ?? [];
    bucket.push(page);
    byType.set(page.meta.type, bucket);
  }

  const lines = ["### [Home](Home)", ""];

  for (const type of [...byType.keys()].sort()) {
    lines.push(`**${type}**`, "");
    const bucket = byType.get(type) ?? [];
    bucket.sort((a, b) => a.meta.title.localeCompare(b.meta.title));
    for (const page of bucket) {
      lines.push(`- [${page.meta.title}](${names.get(page.id)})`);
    }
    lines.push("");
  }

  lines.push("---", "", "[Changelog](OpenWiki-Log)");
  return `${lines.join("\n").trimEnd()}\n`;
}

function renderFooter(repo: string): string {
  const commit = sourceCommit();
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  return (
    `_Generated from [\`${commit}\`](https://github.com/${repo}/commit/${commit}) on ${stamp} UTC ` +
    `by [OpenWiki](https://github.com/langchain-ai/openwiki). ` +
    `Edits here are overwritten on the next run -- change the source instead._\n`
  );
}

function stageChangelog(wikiDir: string): void {
  const logPath = path.join(wikiDir, "log.md");
  if (!fs.existsSync(logPath)) return;

  const { body } = splitFrontmatter(fs.readFileSync(logPath, "utf-8"));
  const stripped = body.replace(/^#\s+.+\n?/, "").trimStart();
  fs.writeFileSync(
    path.join(STAGE_DIR, "OpenWiki-Log.md"),
    `# Changelog\n\n> How this wiki has changed over time.\n\n${stripped}`.trimEnd() + "\n",
  );
}

function main(): void {
  const source: Source = { repo: REPO_SLUG, ref: sourceRef() };
  const wikiDir = process.argv[2] ? path.resolve(process.argv[2]) : WIKI_DIR;
  const pages = readPages(wikiDir);

  if (pages.length === 0) {
    console.error(`Error: no wiki pages found in ${wikiDir}`);
    process.exit(1);
  }

  const names = pageNames(pages);

  fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  fs.mkdirSync(STAGE_DIR, { recursive: true });

  for (const page of pages) {
    fs.writeFileSync(
      path.join(STAGE_DIR, `${names.get(page.id)}.md`),
      renderPage(page, names, source),
    );
  }

  stageChangelog(wikiDir);
  fs.writeFileSync(path.join(STAGE_DIR, "_Sidebar.md"), renderSidebar(pages, names));
  fs.writeFileSync(path.join(STAGE_DIR, "_Footer.md"), renderFooter(source.repo));

  if (!names.has("index.md")) {
    console.warn("Warning: openwiki/index.md is missing, so the wiki has no Home page.");
  }

  console.log(`Staged ${fs.readdirSync(STAGE_DIR).length} wiki pages in ${STAGE_DIR}`);
}

main();
