/** Shared reader for the OpenWiki output tree (openwiki/). */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_DIR = path.resolve(__dirname, "..");
export const WIKI_DIR = path.join(PROJECT_DIR, "openwiki");

export const REPO_SLUG = process.env.GITHUB_REPOSITORY || "dragonxsx/zoho-desk-nodejs-sdk";

export const ROOT_ID = "index.md";

/** Files OpenWiki writes for itself rather than as wiki pages. */
export const RESERVED = {
  instructions: "instructions.md",
  changelog: "log.md",
  plan: "_plan.md",
} as const;

const RESERVED_FILES = new Set<string>(Object.values(RESERVED));

let commitCache: string | null = null;

export function sourceCommit(): string {
  if (commitCache !== null) return commitCache;

  if (process.env.GITHUB_SHA) {
    commitCache = process.env.GITHUB_SHA.slice(0, 7);
  } else {
    try {
      commitCache = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
        cwd: PROJECT_DIR,
        encoding: "utf-8",
      }).trim();
    } catch {
      commitCache = "unknown";
    }
  }

  return commitCache;
}

export function sourceRef(): string {
  const commit = sourceCommit();
  return commit === "unknown" ? "HEAD" : commit;
}

export interface WikiSource {
  repo: string;
  ref: string;
}

export function wikiSource(): WikiSource {
  return { repo: REPO_SLUG, ref: sourceRef() };
}

export function resolveWikiDir(argv: string[] = process.argv): string {
  return argv[2] ? path.resolve(argv[2]) : WIKI_DIR;
}

export interface WikiMeta {
  type: string;
  title: string;
  description: string;
  tags: string[];
}

export interface WikiNode extends WikiMeta {
  id: string;
  body: string;
  links: string[];
  backlinks: string[];
}

export interface WikiGraph {
  generatedAt: string;
  home: string;
  types: string[];
  /** Alias path -> page id, so `/architecture/` and `architecture-overview` still resolve. */
  routes: Record<string, string>;
  nodes: WikiNode[];
}

export interface WikiPage {
  id: string;
  meta: WikiMeta;
  body: string;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' || first === "'") && first === last) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseYamlBlock(lines: string[]): Record<string, string | string[]> {
  const meta: Record<string, string | string[]> = {};
  let pendingKey: string | null = null;
  let pendingList: string[] = [];

  const flush = (): void => {
    if (pendingKey !== null) meta[pendingKey] = pendingList;
    pendingKey = null;
    pendingList = [];
  };

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const dashed = line.match(/^\s*-\s+(.*)$/);
    if (dashed && pendingKey !== null) {
      const item = unquote(dashed[1]);
      if (item) pendingList.push(item);
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!pair) continue;

    flush();
    const key = pair[1];
    const value = pair[2].trim();

    if (!value) {
      pendingKey = key;
      continue;
    }

    const inlineArray = value.match(/^\[(.*)\]$/);
    if (inlineArray) {
      meta[key] = inlineArray[1]
        .split(",")
        .map((entry) => unquote(entry))
        .filter(Boolean);
    } else {
      meta[key] = unquote(value);
    }
  }

  flush();
  return meta;
}

export function splitFrontmatter(raw: string): {
  meta: Record<string, string | string[]>;
  body: string;
} {
  const normalized = raw.replace(/^﻿/, "");
  if (!normalized.startsWith("---")) return { meta: {}, body: normalized };

  const lines = normalized.split(/\r?\n/);
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return { meta: {}, body: normalized };

  return {
    meta: parseYamlBlock(lines.slice(1, end)),
    body: lines.slice(end + 1).join("\n").replace(/^\n+/, ""),
  };
}

function asString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.join(", ");
  return "";
}

function asArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

export interface PageIdParts {
  stem: string;
  segments: string[];
  isIndex: boolean;
  bare: string;
  name: string;
  section: string;
}

/**
 * `architecture/overview.md` -> stem `architecture/overview`, name `overview`,
 * section `architecture`. An index page's `bare` drops the `index` segment.
 */
export function pageIdParts(id: string): PageIdParts {
  const stem = id.replace(/\.md$/i, "");
  const segments = stem.split("/");
  const isIndex = segments[segments.length - 1].toLowerCase() === "index";

  return {
    stem,
    segments,
    isIndex,
    bare: isIndex ? segments.slice(0, -1).join("/") : stem,
    name: segments[segments.length - 1],
    section: segments.length > 1 ? segments[segments.length - 2] : "",
  };
}

/** `a/b` -> `a-b`, the flat form GitHub Wiki uses. */
export function flattenId(value: string): string {
  return value.split("/").join("-");
}

const LEADING_HEADING = /^#\s+.+\n?/;

export function stripLeadingHeading(body: string): string {
  return body.trimStart().replace(LEADING_HEADING, "").trimStart();
}

export function readMeta(
  id: string,
  meta: Record<string, string | string[]>,
  body: string,
): WikiMeta {
  const { isIndex, name, section } = pageIdParts(id);
  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";

  const title =
    asString(meta.title) ||
    (isIndex ? section || firstHeading || name : firstHeading || name);

  return {
    type: asString(meta.type) || (isIndex ? "Section" : "Reference"),
    title,
    description: asString(meta.description),
    tags: asArray(meta.tags),
  };
}

const FENCE_PATTERN = /^(?:```[\s\S]*?^```|~~~[\s\S]*?^~~~)/gm;

const LINK_PATTERN = /(\[[^\]]*\]\(\s*<?)([^)>\s]+)(>?(?:\s+"[^"]*")?\s*\))/g;

function forEachOutsideFences(body: string, visit: (segment: string) => void): void {
  let cursor = 0;

  for (const fence of body.matchAll(FENCE_PATTERN)) {
    const start = fence.index ?? 0;
    visit(body.slice(cursor, start));
    cursor = start + fence[0].length;
  }

  visit(body.slice(cursor));
}

function mapOutsideFences(body: string, map: (segment: string) => string): string {
  let out = "";
  let cursor = 0;

  for (const fence of body.matchAll(FENCE_PATTERN)) {
    const start = fence.index ?? 0;
    out += map(body.slice(cursor, start)) + fence[0];
    cursor = start + fence[0].length;
  }

  return out + map(body.slice(cursor));
}

/** `repo` means rooted at the repository (e.g. `/README.md`), not at a wiki page. */
export type LinkKind = "external" | "anchor" | "repo" | "page";

export function linkKind(target: string): LinkKind {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//")) return "external";
  if (target.startsWith("#")) return "anchor";
  if (target.startsWith("/")) return "repo";
  return "page";
}

export function repoFileHref(repo: string, ref: string, filePath: string, anchor = ""): string {
  return `https://github.com/${repo}/blob/${ref}/${filePath.replace(/^\/+/, "")}${anchor}`;
}

export function splitAnchor(target: string): [file: string, anchor: string] {
  const hash = target.indexOf("#");
  return hash === -1 ? [target, ""] : [target.slice(0, hash), target.slice(hash)];
}

function isPageLink(target: string): boolean {
  if (!target || linkKind(target) !== "page") return false;
  const [file] = splitAnchor(target);
  return file.toLowerCase().endsWith(".md") || file.endsWith("/");
}

export function replaceMarkdownLinks(
  body: string,
  replace: (target: string) => string | null,
): string {
  return mapOutsideFences(body, (segment) =>
    segment.replace(LINK_PATTERN, (match, open: string, target: string, close: string) => {
      const kind = linkKind(target);
      if (!isPageLink(target) && kind !== "repo" && kind !== "anchor") return match;
      const replacement = replace(target);
      return replacement === null ? match : `${open}${replacement}${close}`;
    }),
  );
}

export function markdownLinks(body: string): string[] {
  const targets: string[] = [];

  forEachOutsideFences(body, (segment) => {
    for (const match of segment.matchAll(LINK_PATTERN)) {
      if (isPageLink(match[2])) targets.push(match[2]);
    }
  });

  return targets;
}

export interface LinkDebris {
  line: number;
  text: string;
}

const COMMENT_LINE = /^\s*<!--/;
const INLINE_CODE = /`[^`]*`/g;

/** Generated prose sometimes duplicates a link's tail, leaving a literal `](` on the page. */
export function findLinkDebris(body: string): LinkDebris[] {
  // Blank out fences, preserving line numbers.
  const masked = body.replace(FENCE_PATTERN, (fence) => fence.replace(/[^\n]/g, " "));
  const found: LinkDebris[] = [];

  masked.split("\n").forEach((line, index) => {
    if (COMMENT_LINE.test(line)) return;
    const rest = line.replace(LINK_PATTERN, "").replace(INLINE_CODE, "");
    if (rest.includes("](")) found.push({ line: index + 1, text: line.trim() });
  });

  return found;
}

export function resolveLink(fromId: string, target: string): string {
  const [file] = splitAnchor(target);
  const dir = path.posix.dirname(fromId);
  const resolved = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, file));
  // `normalize` keeps the trailing slash, so a directory link lands on its index page.
  const withIndex = resolved.endsWith("/") ? `${resolved}index.md` : resolved;
  // Reaching the wiki root leaves a "./" that no page id carries.
  return withIndex.startsWith("./") ? withIndex.slice(2) : withIndex;
}

export interface ResolvedTarget {
  /** A wiki page id, or a `../`-prefixed path when the target escapes the wiki root. */
  id: string;
  /** Fragment including its leading `#`. */
  anchor: string;
  escaped: boolean;
}

export function resolveTarget(fromId: string, target: string): ResolvedTarget {
  const [file, anchor] = splitAnchor(target);
  const id = resolveLink(fromId, file);
  return { id, anchor, escaped: id.startsWith("../") };
}

function collectMarkdown(root: string, prefix = ""): string[] {
  const entries = fs.readdirSync(path.join(root, prefix), { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isSymbolicLink()) continue;

    const relative = prefix ? path.posix.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      found.push(...collectMarkdown(root, relative));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".md")) continue;
    if (RESERVED_FILES.has(entry.name.toLowerCase())) continue;

    found.push(relative);
  }

  return found;
}

export function readPages(root: string = WIKI_DIR): WikiPage[] {
  const hint = "Run `openwiki code --update --print` first.";
  if (!fs.existsSync(root)) throw new Error(`No wiki found at ${root}. ${hint}`);

  const ids = collectMarkdown(root).sort();
  if (ids.length === 0) throw new Error(`No wiki pages found in ${root}. ${hint}`);

  return ids.map((id) => {
    const raw = fs.readFileSync(path.join(root, id), "utf-8");
    const { meta, body } = splitFrontmatter(raw);

    const debris = findLinkDebris(body);
    if (debris.length) {
      // Report positions in the file, not in the frontmatter-stripped body.
      const offset = raw.split("\n").length - body.split("\n").length;
      for (const { line, text } of debris) {
        console.warn(`Warning: ${id}:${line + offset} has malformed link syntax -- ${text}`);
      }
    }

    return { id, meta: readMeta(id, meta, body), body };
  });
}

function routeTable(ids: string[]): Record<string, string> {
  const routes: Record<string, string> = {};

  const claim = (alias: string, id: string): void => {
    const key = alias.toLowerCase();
    if (key && key !== id.toLowerCase() && !(key in routes)) routes[key] = id;
  };

  for (const id of ids) {
    const { stem, bare } = pageIdParts(id);
    claim(stem, id);
    claim(bare, id);
    claim(flattenId(bare), id);
  }

  return routes;
}

export function buildGraph(root: string = WIKI_DIR): WikiGraph {
  const pages = readPages(root);
  const known = new Set(pages.map((page) => page.id));

  const nodes: WikiNode[] = pages.map((page) => ({
    id: page.id,
    ...page.meta,
    body: page.body,
    links: [
      ...new Set(
        markdownLinks(page.body)
          .map((target) => resolveLink(page.id, target))
          .filter((id) => id !== page.id && known.has(id)),
      ),
    ],
    backlinks: [],
  }));

  const byId = new Map(nodes.map((node) => [node.id, node]));
  for (const node of nodes) {
    for (const target of node.links) {
      byId.get(target)?.backlinks.push(node.id);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    home: known.has(ROOT_ID) ? ROOT_ID : nodes[0].id,
    types: [...new Set(nodes.map((node) => node.type))].sort(),
    routes: routeTable(nodes.map((node) => node.id)),
    nodes,
  };
}
