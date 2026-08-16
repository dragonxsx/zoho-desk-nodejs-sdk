/** Stages the OpenWiki output tree for publication to the GitHub Wiki. */

import fs from "node:fs";
import path from "node:path";

import {
  flattenId,
  linkKind,
  pageIdParts,
  PROJECT_DIR,
  readPages,
  replaceMarkdownLinks,
  repoFileHref,
  RESERVED,
  resolveTarget,
  resolveWikiDir,
  ROOT_ID,
  splitAnchor,
  splitFrontmatter,
  stripLeadingHeading,
  wikiSource,
  type WikiPage,
  type WikiSource,
} from "./openwiki-graph.js";

const STAGE_DIR = path.join(PROJECT_DIR, ".wiki-stage");

function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function pageNames(pages: WikiPage[]): Map<string, string> {
  const names = new Map<string, string>();
  const used = new Set<string>();

  // Claim `Home` up front so no other page can take the name GitHub Wiki reserves.
  if (pages.some((page) => page.id === ROOT_ID)) {
    used.add("home");
    names.set(ROOT_ID, "Home");
  }

  for (const page of pages) {
    if (names.has(page.id)) continue;

    const { stem, bare, isIndex } = pageIdParts(page.id);
    const fallback = sanitize(flattenId(stem));
    let base = sanitize(flattenId(isIndex ? bare : stem)) || fallback || "page";
    if (used.has(base.toLowerCase())) base = fallback || base;

    let candidate = base;
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    used.add(candidate.toLowerCase());
    names.set(page.id, candidate);
  }

  return names;
}

function rewriteLinks(page: WikiPage, names: Map<string, string>, source: WikiSource): string {
  return replaceMarkdownLinks(page.body, (target) => {
    // GitHub Wiki resolves same-page fragments itself.
    if (linkKind(target) === "anchor") return null;

    const [file, anchor] = splitAnchor(target);

    if (linkKind(target) === "repo") {
      return repoFileHref(source.repo, source.ref, file, anchor);
    }

    const { id, escaped } = resolveTarget(page.id, target);

    const name = names.get(id);
    if (name) return name + anchor;

    if (escaped) {
      return repoFileHref(source.repo, source.ref, id.replace(/^(?:\.\.\/)+/, ""), anchor);
    }

    console.warn(`Warning: ${page.id} links to ${target}, which is not a wiki page.`);
    return null;
  });
}

function renderPage(page: WikiPage, names: Map<string, string>, source: WikiSource): string {
  const parts = [`# ${page.meta.title}`];
  if (page.meta.description) parts.push(`> ${page.meta.description}`);
  if (page.meta.tags.length) parts.push(`*${page.meta.tags.join(" &middot; ")}*`);
  parts.push(stripLeadingHeading(rewriteLinks(page, names, source)));

  return `${parts.join("\n\n").trimEnd()}\n`;
}

function renderSidebar(pages: WikiPage[], names: Map<string, string>): string {
  const byType = new Map<string, WikiPage[]>();

  const listed = pages
    .filter((page) => page.id !== ROOT_ID)
    .sort((a, b) => a.meta.title.localeCompare(b.meta.title));

  for (const page of listed) {
    const bucket = byType.get(page.meta.type);
    if (bucket) bucket.push(page);
    else byType.set(page.meta.type, [page]);
  }

  const lines = ["### [Home](Home)", ""];

  for (const [type, bucket] of [...byType].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`**${type}**`, "");
    for (const page of bucket) lines.push(`- [${page.meta.title}](${names.get(page.id)})`);
    lines.push("");
  }

  lines.push("---", "", "[Changelog](OpenWiki-Log)");
  return `${lines.join("\n").trimEnd()}\n`;
}

function renderFooter(source: WikiSource): string {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  return (
    `_Generated from [\`${source.ref}\`](https://github.com/${source.repo}/commit/${source.ref}) on ${stamp} UTC ` +
    `by [OpenWiki](https://github.com/langchain-ai/openwiki). ` +
    `Edits here are overwritten on the next run -- change the source instead._\n`
  );
}

function stageChangelog(wikiDir: string): boolean {
  const logPath = path.join(wikiDir, RESERVED.changelog);
  if (!fs.existsSync(logPath)) return false;

  const { body } = splitFrontmatter(fs.readFileSync(logPath, "utf-8"));
  fs.writeFileSync(
    path.join(STAGE_DIR, "OpenWiki-Log.md"),
    `# Changelog\n\n> How this wiki has changed over time.\n\n${stripLeadingHeading(body)}`.trimEnd() + "\n",
  );

  return true;
}

function main(): void {
  const source = wikiSource();
  const wikiDir = resolveWikiDir();
  const pages = readPages(wikiDir);
  const names = pageNames(pages);

  fs.rmSync(STAGE_DIR, { recursive: true, force: true });
  fs.mkdirSync(STAGE_DIR, { recursive: true });

  for (const page of pages) {
    fs.writeFileSync(
      path.join(STAGE_DIR, `${names.get(page.id)}.md`),
      renderPage(page, names, source),
    );
  }

  const changelog = stageChangelog(wikiDir);
  fs.writeFileSync(path.join(STAGE_DIR, "_Sidebar.md"), renderSidebar(pages, names));
  fs.writeFileSync(path.join(STAGE_DIR, "_Footer.md"), renderFooter(source));

  if (!names.has(ROOT_ID)) {
    console.warn(`Warning: openwiki/${ROOT_ID} is missing, so the wiki has no Home page.`);
  }

  console.log(`Staged ${pages.length + (changelog ? 3 : 2)} wiki pages in ${STAGE_DIR}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
