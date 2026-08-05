/* build-projects.mjs — turn registry.json into projects.json.
 *
 * registry.json is the human-edited source: one object per project, added by
 * pull request. This resolves each entry through the GitHub API and writes the
 * flat file the hub at strk20.starknet.io/hackathon fetches at runtime.
 *
 * Each project carries two generated sentences: `summary`, describing what the
 * project is, and `latest_push`, describing what changed in the most recent
 * push. Plus `tooling` — what the repository actually depends on, read from
 * package.json and Scarb.toml rather than claimed.
 *
 * Everything is cached on the repository's head SHA. A project that hasn't
 * pushed since the last run costs exactly one API call and no tokens, which is
 * what makes a 30-minute cron affordable across a 17-day sprint.
 *
 * No dependencies — Node 20's built-in fetch only.
 *
 *   node scripts/build-projects.mjs
 *
 * GITHUB_TOKEN  optional locally (60 requests/hour unauthenticated), provided
 *               automatically in Actions.
 * OPENAI_API_KEY optional — without it the sentences are simply omitted and the
 *               hub falls back to the one-liner the team wrote themselves.
 * OPENAI_MODEL  defaults to gpt-4o-mini.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

const REGISTRY_URL = new URL("../registry.json", import.meta.url);
const PROJECTS_URL = new URL("../projects.json", import.meta.url);

/* ---------- GitHub ---------- */

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

async function getTextFile(owner, repo, path) {
  const f = await gh(`/repos/${owner}/${repo}/contents/${path}`);
  if (!f || !f.content) return null;
  try {
    return Buffer.from(f.content, f.encoding || "base64").toString("utf8");
  } catch { return null; }
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

/* ---------- stack detection ---------- */

/* Read from package.json and Scarb.toml rather than asked for in the registry,
 * so the chips are evidence. `live` marks the STRK20-relevant ones — those are
 * highlighted on the hub; frameworks are shown but muted. */
const DEP_SIGNALS = [
  [/@starkware-libs\/starknet-privacy/, "Privacy SDK", true],
  [/@avnu\/|avnu-sdk/, "AVNU", true],
  [/ekubo/i, "Ekubo", true],
  [/vesu/i, "Vesu", true],
  [/^starknet$|starknet\.js/, "starknet.js", false],
  [/get-starknet/, "get-starknet", false],
  [/^next$/, "Next.js", false],
  [/^react$/, "React", false],
  [/^vite$/, "Vite", false],
  [/^svelte$/, "Svelte", false],
  [/^typescript$/, "TypeScript", false],
];

async function detectTooling(owner, repo) {
  const found = new Map();
  const add = (label, live) => { if (!found.has(label)) found.set(label, { label, live }); };

  const pkgRaw = await getTextFile(owner, repo, "package.json");
  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw);
      const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
      for (const dep of deps) {
        for (const [re, label, live] of DEP_SIGNALS) if (re.test(dep)) add(label, live);
      }
    } catch { warn(`${owner}/${repo} has an unparseable package.json`); }
  }

  const scarb = await getTextFile(owner, repo, "Scarb.toml");
  if (scarb) {
    add("Cairo", true);
    /* A dependency on the pool's interfaces means they are writing a contract
     * that talks to it, not just a Cairo project that happens to exist. */
    if (/privacy|anonymizer/i.test(scarb)) add("Anonymizer", true);
  }

  const langs = await gh(`/repos/${owner}/${repo}/languages`);
  if (langs) {
    if (langs.Cairo) add("Cairo", true);
    if (langs.Rust) add("Rust", false);
  }

  /* Sub-accounts have no package to depend on yet, so the only signal is the
   * team writing about them. Cheap to check while we already have the README. */
  return found;
}

/* ---------- generated sentences ---------- */

async function openai(system, user, maxTokens = 300) {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
        max_completion_tokens: maxTokens,
      }),
    });
    if (!res.ok) { warn(`OpenAI ${res.status} — sentences skipped for this project`); return null; }
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    return text ? JSON.parse(text) : null;
  } catch (e) {
    warn(`OpenAI call failed (${e.message}) — sentences skipped`);
    return null;
  }
}

const DESC_SYSTEM = `You describe developer projects for a public hackathon board that other builders read.
Return JSON: {"summary": string, "description_long": string}.
summary: ONE sentence, under 110 characters, saying what the project does. Start with a verb or a noun phrase, never with the project's name or "This project".
description_long: two or three sentences with the interesting technical substance — the approach, and the hard part they are solving.
Plain English. No marketing adjectives, no "revolutionary", no "seamless", no exclamation marks. If the README is empty or says nothing, return empty strings.`;

const PUSH_SYSTEM = `You summarise what a developer just pushed, for a live hackathon board.
Return JSON: {"latest_push": string}.
ONE sentence, under 90 characters, past tense, concrete, describing the substance of the change.
Say what changed, not how many commits. Name the actual thing: a feature, a file, a fix, a contract.
BANNED words and phrases — never use any of them: "various", "updates", "improvements", "enhanced", "enhancements", "new features", "and more", "several changes", "refactored code", "better".
If the commits are genuinely trivial (formatting, lockfiles, merges), say so plainly: "Formatting and dependency bumps only."
Good: "Added the useShieldedBalance hook and its tests." Bad: "Enhanced privacy with new features and tests."`;

/* ---------- assembly ---------- */

function validate(entry, index, seenSlugs) {
  const where = `registry.json[${index}]`;
  const required = ["slug", "name", "one_liner", "category", "repo_url", "starknet_address", "team"];
  for (const key of required) {
    if (!entry[key] || (Array.isArray(entry[key]) && !entry[key].length)) {
      warn(`${where} is missing "${key}" — skipped`);
      return false;
    }
  }
  if (seenSlugs.has(entry.slug)) { warn(`${where} duplicate slug "${entry.slug}" — skipped`); return false; }
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

async function buildProject(entry, prev) {
  const { owner, repo } = parseRepo(entry.repo_url);
  const meta = await gh(`/repos/${owner}/${repo}`);
  if (!meta) warn(`${owner}/${repo} is unreachable — is it public?`);
  if (meta?.private) warn(`${owner}/${repo} is private — public repositories are required`);

  const builders = [];
  for (const login of entry.team) builders.push(await resolveUser(login));

  const base = {
    slug: entry.slug,
    name: entry.name,
    one_liner: entry.one_liner,
    category: entry.category,
    repo_url: meta?.html_url || entry.repo_url,
    demo_url: entry.demo_url || "",
    x_handle: entry.x_handle || "",
    inspired_by: entry.inspired_by || "",
    status: entry.status === "finished" ? "finished" : "building",
    contracts: Array.isArray(entry.contracts) ? entry.contracts : [],
    /* The hub orders on this. Null (unreachable repo) sorts last and renders
     * as an em dash rather than a fake timestamp. */
    pushed_at: meta?.pushed_at || null,
    stars: meta?.stargazers_count ?? 0,
    builders,
  };

  const head = await gh(`/repos/${owner}/${repo}/commits?per_page=1`);
  const headSha = head?.[0]?.sha || null;

  /* Nothing new since the last run: reuse everything generated. This is the
   * common case on a 30-minute cron and costs no tokens. */
  if (prev && headSha && prev.head_sha === headSha) {
    console.log(`  ${entry.slug}: unchanged`);
    return {
      ...base,
      head_sha: headSha,
      summary: prev.summary || "",
      description_long: prev.description_long || "",
      latest_push: prev.latest_push || "",
      tooling: prev.tooling || [],
    };
  }

  console.log(`  ${entry.slug}: reindexing`);
  const tooling = await detectTooling(owner, repo);
  const readme = await getTextFile(owner, repo, "README.md");
  if (readme && /sub-?accounts?/i.test(readme)) tooling.set("Sub-accounts", { label: "Sub-accounts", live: true });

  /* Description is regenerated only when the README actually changed — a push
   * that touches only source shouldn't rewrite the project's description. */
  let summary = prev?.summary || "";
  let descriptionLong = prev?.description_long || "";
  const readmeHash = readme ? readme.length + ":" + readme.slice(0, 200) : "";
  if (readme && readmeHash !== (prev?.readme_hash || "")) {
    const out = await openai(DESC_SYSTEM, `Project name: ${entry.name}\nTeam's own one-liner: ${entry.one_liner}\n\nREADME:\n${readme.slice(0, 6000)}`);
    if (out) {
      summary = out.summary || summary;
      descriptionLong = out.description_long || descriptionLong;
    }
  }

  /* What just landed. With a previous SHA the compare endpoint gives the
   * commits and the changed files in a single call; without one (a project's
   * first index) fall back to recent commits. */
  let latestPush = "";
  let changeText = "";
  if (prev?.head_sha && headSha && prev.head_sha !== headSha) {
    const cmp = await gh(`/repos/${owner}/${repo}/compare/${prev.head_sha}...${headSha}`);
    if (cmp) {
      const msgs = (cmp.commits || []).map((c) => `- ${c.commit.message.split("\n")[0]}`).join("\n");
      const files = (cmp.files || []).slice(0, 30).map((f) => `${f.filename} (+${f.additions}/-${f.deletions})`).join("\n");
      changeText = `Commits:\n${msgs}\n\nFiles changed:\n${files}`;
    }
  }
  if (!changeText) {
    const commits = await gh(`/repos/${owner}/${repo}/commits?per_page=10`);
    if (commits?.length) {
      changeText = "Commits:\n" + commits.map((c) => `- ${c.commit.message.split("\n")[0]}`).join("\n");
    }
  }
  if (changeText) {
    const out = await openai(PUSH_SYSTEM, `Project: ${entry.name}\n\n${changeText.slice(0, 5000)}`, 200);
    latestPush = out?.latest_push || prev?.latest_push || "";
  }

  return {
    ...base,
    head_sha: headSha,
    readme_hash: readmeHash,
    summary,
    description_long: descriptionLong,
    latest_push: latestPush,
    tooling: [...tooling.values()],
  };
}

/* ---------- run ---------- */

const registry = JSON.parse(readFileSync(REGISTRY_URL, "utf8"));
if (!Array.isArray(registry)) {
  console.error("registry.json must be an array");
  process.exit(1);
}

/* Previous output doubles as the cache — no separate cache file to keep in
 * sync, and the committed diff shows exactly what changed each run. */
let previous = [];
if (existsSync(PROJECTS_URL)) {
  try { previous = JSON.parse(readFileSync(PROJECTS_URL, "utf8")); } catch { previous = []; }
}
const prevBySlug = new Map(previous.map((p) => [p.slug, p]));

console.log(`resolving ${registry.length} registry entries…`);
if (!OPENAI_KEY) console.log("  (no OPENAI_API_KEY — generated sentences will be omitted)");

const seenSlugs = new Set();
const projects = [];
for (const [i, entry] of registry.entries()) {
  if (!validate(entry, i, seenSlugs)) continue;
  projects.push(await buildProject(entry, prevBySlug.get(entry.slug)));
}

/* Most recently pushed first. The hub re-sorts client-side too, so this is
 * belt-and-braces — it also makes the committed file readable in a diff. */
projects.sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0));

writeFileSync(PROJECTS_URL, JSON.stringify(projects, null, 2) + "\n");
console.log(`wrote projects.json — ${projects.length} projects, ${warnings.length} warnings`);
