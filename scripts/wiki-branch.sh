#!/usr/bin/env bash
# Moves the generated OpenWiki tree between the `openwiki` branch and `openwiki/`.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WIKI_DIR="${PROJECT_DIR}/openwiki"
BRANCH="${WIKI_BRANCH:-openwiki}"
WORKTREE_DIR="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/openwiki-branch"

git_repo() {
  git -C "$PROJECT_DIR" "$@"
}

branch_exists() {
  git_repo ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1
}

fetch_branch() {
  git_repo fetch --no-tags --force origin "refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}"
}

# The commit OpenWiki recorded as documented, read from a .last-update.json on stdin.
read_git_head() {
  sed -n 's/.*"gitHead"[[:space:]]*:[[:space:]]*"\([0-9a-f]\{7,40\}\)".*/\1/p' | head -1
}

restore() {
  rm -rf "$WIKI_DIR"
  mkdir -p "$WIKI_DIR"

  if ! branch_exists; then
    echo "Branch '${BRANCH}' does not exist yet -- OpenWiki will generate from scratch."
    return 0
  fi

  fetch_branch
  git_repo archive "refs/remotes/origin/${BRANCH}" | tar -x -C "$WIKI_DIR"

  local pages
  pages="$(find "$WIKI_DIR" -name '*.md' | wc -l | tr -d ' ')"
  echo "Restored ${pages} pages from '${BRANCH}' into openwiki/."
}

commit_message() {
  local prev="$1" head="$2" count=""

  echo "docs: update OpenWiki (${head:0:7})"

  if [ -n "$prev" ] && [ "$prev" != "$head" ] && git_repo cat-file -e "${prev}^{commit}" 2>/dev/null; then
    count="$(git_repo rev-list --count "${prev}..${head}" 2>/dev/null || true)"
    echo
    echo "Documents ${prev:0:7}..${head:0:7}${count:+ (${count} commits)}."
  fi

  echo
  echo "Source-Commit: ${head}"
}

publish() {
  if [ ! -d "$WIKI_DIR" ]; then
    echo "::error::openwiki/ is missing -- run \`openwiki code --update\` first."
    exit 1
  fi

  local prev_head="" new_head=""

  rm -rf "$WORKTREE_DIR"
  git_repo worktree prune

  if branch_exists; then
    fetch_branch
    prev_head="$(git_repo show "refs/remotes/origin/${BRANCH}:.last-update.json" 2>/dev/null | read_git_head || true)"
    git_repo worktree add -B "$BRANCH" "$WORKTREE_DIR" "refs/remotes/origin/${BRANCH}"
  else
    echo "Creating '${BRANCH}' as an orphan branch."
    if git_repo show-ref --verify --quiet "refs/heads/${BRANCH}"; then
      git_repo branch -D "$BRANCH" >/dev/null
    fi
    git_repo worktree add --detach --no-checkout "$WORKTREE_DIR" HEAD
    git -C "$WORKTREE_DIR" checkout --quiet --orphan "$BRANCH"
    git -C "$WORKTREE_DIR" rm -r --quiet --cached .
  fi

  if [ -f "${WIKI_DIR}/.last-update.json" ]; then
    new_head="$(read_git_head < "${WIKI_DIR}/.last-update.json")"
  fi
  if [ -z "$new_head" ]; then
    new_head="$(git_repo rev-parse HEAD)"
  fi

  find "$WORKTREE_DIR" -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +
  cp -R "${WIKI_DIR}/." "${WORKTREE_DIR}/"

  git -C "$WORKTREE_DIR" add -A
  if git -C "$WORKTREE_DIR" diff --cached --quiet; then
    echo "Branch '${BRANCH}' is already up to date."
  else
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
      git -C "$WORKTREE_DIR" config user.name "github-actions[bot]"
      git -C "$WORKTREE_DIR" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
    fi

    commit_message "$prev_head" "$new_head" | git -C "$WORKTREE_DIR" commit --quiet -F -
    git -C "$WORKTREE_DIR" push origin "HEAD:refs/heads/${BRANCH}"
    echo "Pushed the wiki to '${BRANCH}' (generated from ${new_head:0:7})."
  fi

  git_repo worktree remove --force "$WORKTREE_DIR"
}

case "${1:-}" in
  restore) restore ;;
  publish) publish ;;
  *)
    echo "Usage: bash scripts/wiki-branch.sh <restore|publish>" >&2
    echo "  restore  fetch the '${BRANCH}' branch into openwiki/" >&2
    echo "  publish  push openwiki/ back to the '${BRANCH}' branch" >&2
    exit 1
    ;;
esac
