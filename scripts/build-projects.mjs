/* build-projects.mjs — turn registry.json into projects.json.
 *
 * registry.json is the human-edited source: one object per project, added by
 * pull request. This resolves each entry through the GitHub API (repository
 * metadata + one avatar lookup per team member) and writes the flat file the
 * hub at strk20.starknet.io/hackathon fetches at runtime.
 *
 * Runs on a 30-minute cron and on every push to main, so a merged registration
 * PR shows up on the hub within a minute rather than waiting for the next tick.
 *
 * No dependencies — Node 20's built-in fetch only.
 *
 *   node scripts/build-projects.mjs
 *
 * GITHUB_TOKEN is optional locally (60 requests/hour unauthenticated, enough to
 * test) and provided automatically in Actions.
 */

import { readFileSync, writeFileSync } from "node:fs";

const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN || "";
const HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "strk20-private-sprint-indexer",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

const CATEGORIES = ["Consumer", "DeFi", "Tooling", "Infra", "Payments", "Gaming", "Other"];

/* Warnings are collected rather than thrown: one team with a typo in their
 * repo URL must not take the whole hub down. The run reports them at the end
 * and still writes a good projects.json for everyone else. */
const warnings = [];
const warn = (msg) => { warnings.push(msg); console.warn(`  warn: ${msg}`); };

async function gh(path) {
  const res = await fetch(`${API}${path}`, { headers: HEADERS });
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get("x-ratelimit-reset");
    throw new Error(`rate limited on ${path}` + (reset ? ` (resets ${new Date(reset * 1000).toISOString()})` : ""));
  }
  if (!res.ok) return null;
  return res.json();
}

/* Accepts the shapes people actually paste: with or without a trailing slash,
 * with or without .git, and full URLs with query strings. */
function parseRepo(url) {
  if (typeof url !== "string") return null;
  const m = url.trim().match(/github\.com[/:]([^/]+)\/([^/?#]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, "") };
}

const userCache = new Map();
async function resolveUser(login) {
  if (userCache.has(login)) return userCache.get(login);
  const u = await gh(`/users/${encodeURIComponent(login)}`);
  /* An unresolvable handle still renders — GitHub's identicon endpoint gives a
   * stable placeholder, so a typo shows a grey avatar instead of a broken image. */
  const out = u
    ? { login: u.login, name: u.name || u.login, avatar_url: u.avatar_url }
    : { login, name: login, avatar_url: `https://github.com/${encodeURIComponent(login)}.png` };
  if (!u) warn(`unknown GitHub user "${login}"`);
  userCache.set(login, out);
  return out;
}

function validate(entry, index, seenSlugs) {
  const where = `registry.json[${index}]`;
  const required = ["slug", "name", "one_liner", "category", "repo_url", "starknet_address", "team"];
  for (const key of required) {
    if (!entry[key] || (Array.isArray(entry[key]) && !entry[key].length)) {
      warn(`${where} is missing "${key}" — skipped`);
      return false;
    }
  }
  if (seenSlugs.has(entry.slug)) {
    warn(`${where} duplicate slug "${entry.slug}" — skipped`);
    return false;
  }
  if (!parseRepo(entry.repo_url)) {
    warn(`${where} repo_url is not a GitHub URL: ${entry.repo_url} — skipped`);
    return false;
  }
  if (!CATEGORIES.includes(entry.category)) {
    warn(`${where} category "${entry.category}" is not one of ${CATEGORIES.join(", ")} — kept as Other`);
    entry.category = "Other";
  }
  seenSlugs.add(entry.slug);
  return true;
}

async function buildProject(entry) {
  const { owner, repo } = parseRepo(entry.repo_url);
  const meta = await gh(`/repos/${owner}/${repo}`);
  if (!meta) warn(`${owner}/${repo} is unreachable — is it public?`);
  if (meta?.private) warn(`${owner}/${repo} is private — public repositories are required`);

  const builders = [];
  for (const login of entry.team) builders.push(await resolveUser(login));

  return {
    slug: entry.slug,
    name: entry.name,
    one_liner: entry.one_liner,
    category: entry.category,
    repo_url: meta?.html_url || entry.repo_url,
    demo_url: entry.demo_url || "",
    x_handle: entry.x_handle || "",
    inspired_by: entry.inspired_by || "",
    status: entry.status === "finished" ? "finished" : "building",
    /* The hub orders on this. Null (unreachable repo) sorts last and renders
     * as an em dash rather than a fake timestamp. */
    pushed_at: meta?.pushed_at || null,
    stars: meta?.stargazers_count ?? 0,
    builders,
  };
}

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8"));
if (!Array.isArray(registry)) {
  console.error("registry.json must be an array");
  process.exit(1);
}

console.log(`resolving ${registry.length} registry entries…`);
const seenSlugs = new Set();
const projects = [];
for (const [i, entry] of registry.entries()) {
  if (!validate(entry, i, seenSlugs)) continue;
  projects.push(await buildProject(entry));
}

/* Most recently active first. The hub re-sorts client-side too, so this is
 * belt-and-braces — it also makes the committed file readable in a diff. */
projects.sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0));

writeFileSync(new URL("../projects.json", import.meta.url), JSON.stringify(projects, null, 2) + "\n");
console.log(`wrote projects.json — ${projects.length} projects, ${warnings.length} warnings`);
