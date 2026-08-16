/** Shared reader for the OpenWiki output tree (openwiki/). */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_DIR = path.resolve(__dirname, "..");
export const WIKI_DIR = path.join(PROJECT_DIR, "openwiki");

export const REPO_SLUG = process.env.GITHUB_REPOSITORY || "dragonxsx/zoho-desk-nodejs-sdk";

export function sourceCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: PROJECT_DIR,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export function sourceRef(): string {
  const commit = sourceCommit();
  return commit === "unknown" ? "HEAD" : commit;
}

const RESERVED_FILES = new Set(["instructions.md", "log.md", "_plan.md"]);

export interface WikiMeta {
  type: string;
  title: string;
  description: string;
  tags: string[];
}

export interface WikiNode extends WikiMeta {
  id: string;
  body: string;
  size: number;
  links: string[];
  backlinks: string[];
}

export interface WikiEdge {
  source: string;
  target: string;
}

export interface WikiGraph {
  root: string;
  generatedAt: string;
  types: string[];
  nodes: WikiNode[];
  edges: WikiEdge[];
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

export function readMeta(
  id: string,
  meta: Record<string, string | string[]>,
  body: string,
): WikiMeta {
  const base = path.posix.basename(id);
  const isIndex = base.toLowerCase() === "index.md";
  const dir = path.posix.dirname(id);
  const sectionName = dir === "." ? "" : path.posix.basename(dir);
  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
  const stem = base.replace(/\.md$/i, "");

  const title =
    asString(meta.title) ||
    (isIndex ? sectionName || firstHeading || stem : firstHeading || stem);

  return {
    type: asString(meta.type) || (isIndex ? "Section" : "Reference"),
    title,
    description: asString(meta.description),
    tags: asArray(meta.tags),
  };
}

const FENCE_PATTERN = /^(?:```[\s\S]*?^```|~~~[\s\S]*?^~~~)/gm;

const LINK_PATTERN = /(\[[^\]]*\]\(\s*<?)([^)>\s]+)(>?(?:\s+"[^"]*")?\s*\))/g;

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

/**
 * How a markdown link target should be treated.
 *
 * - `external` -- has a scheme or is protocol-relative; leave it alone.
 * - `anchor` -- same-page fragment; leave it alone.
 * - `repo` -- rooted at the repository, e.g. `/README.md`; not a wiki page.
 * - `page` -- relative to the linking page, so possibly another wiki page.
 */
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

/** A relative target that names a wiki page: either a `.md` file or a directory. */
function isPageLink(target: string): boolean {
  if (!target || linkKind(target) !== "page") return false;
  const file = target.split("#")[0];
  return file.toLowerCase().endsWith(".md") || file.endsWith("/");
}

/** Targets a consumer may want to rewrite: wiki pages plus repository files. */
function isRewritable(target: string): boolean {
  return isPageLink(target) || linkKind(target) === "repo";
}

export function replaceMarkdownLinks(
  body: string,
  replace: (target: string) => string | null,
): string {
  return mapOutsideFences(body, (segment) =>
    segment.replace(LINK_PATTERN, (match, open: string, target: string, close: string) => {
      if (!isRewritable(target)) return match;
      const replacement = replace(target);
      return replacement === null ? match : `${open}${replacement}${close}`;
    }),
  );
}

export function markdownLinks(body: string): string[] {
  const targets: string[] = [];
  replaceMarkdownLinks(body, (target) => {
    if (isPageLink(target)) targets.push(target);
    return null;
  });
  return targets;
}

export interface LinkDebris {
  line: number;
  text: string;
}

/**
 * Lines whose link syntax does not parse cleanly: a stray `](` or an unmatched `)`
 * left over once real links and inline code are removed. Generated prose has been
 * seen duplicating a link's tail into the surrounding text, which renders as
 * literal markdown on the published page.
 */
export function findLinkDebris(body: string): LinkDebris[] {
  // Blank out fenced code, keeping line numbers aligned with the source.
  const masked = body.replace(FENCE_PATTERN, (fence) => fence.replace(/[^\n]/g, " "));
  const found: LinkDebris[] = [];

  masked.split("\n").forEach((line, index) => {
    if (/^\s*<!--/.test(line)) return;
    const rest = line.replace(LINK_PATTERN, "").replace(/`[^`]*`/g, "");
    const opens = (rest.match(/\(/g) ?? []).length;
    const closes = (rest.match(/\)/g) ?? []).length;
    if (closes > opens || rest.includes("](")) found.push({ line: index + 1, text: line.trim() });
  });

  return found;
}

export function resolveLink(fromId: string, target: string): string {
  const file = target.split("#")[0];
  const dir = path.posix.dirname(fromId);
  const resolved = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, file));
  // `normalize` keeps the trailing slash, so a directory link lands on its index page.
  const withIndex = resolved.endsWith("/") ? `${resolved}index.md` : resolved;
  // Reaching the wiki root leaves a "./" that no page id carries.
  return withIndex.startsWith("./") ? withIndex.slice(2) : withIndex;
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

  return found.sort();
}

export function readPages(root: string = WIKI_DIR): WikiPage[] {
  if (!fs.existsSync(root)) {
    throw new Error(
      `No wiki found at ${root}. Run \`openwiki code --update --print\` first.`,
    );
  }

  return collectMarkdown(root).map((id) => {
    const raw = fs.readFileSync(path.join(root, id), "utf-8");
    const { meta, body } = splitFrontmatter(raw);

    // Report positions in the file, not in the frontmatter-stripped body.
    const offset = raw.split("\n").length - body.split("\n").length;
    for (const { line, text } of findLinkDebris(body)) {
      console.warn(`Warning: ${id}:${line + offset} has malformed link syntax -- ${text}`);
    }

    return { id, meta: readMeta(id, meta, body), body };
  });
}

export function buildGraph(root: string = WIKI_DIR): WikiGraph {
  const pages = readPages(root);
  const known = new Set(pages.map((page) => page.id));

  const nodes: WikiNode[] = pages.map((page) => {
    const links = [
      ...new Set(
        markdownLinks(page.body)
          .map((target) => resolveLink(page.id, target))
          .filter((id) => id !== page.id && known.has(id)),
      ),
    ];

    return {
      id: page.id,
      ...page.meta,
      body: page.body,
      size: page.body.length,
      links,
      backlinks: [],
    };
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: WikiEdge[] = [];

  for (const node of nodes) {
    for (const target of node.links) {
      edges.push({ source: node.id, target });
      byId.get(target)?.backlinks.push(node.id);
    }
  }

  return {
    root: path.basename(root),
    generatedAt: new Date().toISOString(),
    types: [...new Set(nodes.map((node) => node.type))].sort(),
    nodes,
    edges,
  };
}
