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

/* Two passes. Dependencies are the strong signal — a package.json entry means
 * the code actually imports it. Text is the weak signal, needed because parts
 * of the Starknet privacy stack have no package to depend on yet (the Wallet
 * API is a wallet method, sub-accounts aren't shipped, privacy_invoke is a
 * Cairo entrypoint). The chip says "detected", not "verified", for that reason.
 *
 * `live` marks the Starknet and STRK20 stack — those are highlighted on the
 * hub. Frameworks show up muted, because "uses React" is not interesting here.
 * The list tracks the routes documented at strk20-by-example.org. */
const DEP_SIGNALS = [
  [/@starkware-libs\/starknet-privacy/, "Privacy SDK", true],
  [/@avnu\/|avnu-sdk/, "AVNU", true],
  [/ekubo/i, "Ekubo", true],
  [/vesu/i, "Vesu", true],
  [/get-starknet/, "get-starknet", true],
  [/^starknet$|starknet\.js/, "starknet.js", true],
  [/starknetkit/i, "Starknetkit", true],
  [/^@?next$/, "Next.js", false],
  [/^react$/, "React", false],
  [/^vite$/, "Vite", false],
  [/^svelte$/, "Svelte", false],
  [/^typescript$/, "TypeScript", false],
];

const TEXT_SIGNALS = [
  [/privacy_invoke|privacyInvoke/, "privacy_invoke", true],
  [/anonymizer/i, "Anonymizer", true],
  [/sub-?accounts?/i, "Sub-accounts", true],
  [/wallet\s?api|starknet_wallet|walletApi/i, "Wallet API", true],
  [/discoverNotes|IndexerDiscoveryProvider|note discovery/i, "Note discovery", true],
  [/proving\s?service|PROVING_SERVICE|proverUrl/i, "Prover", true],
  [/shielded|unshield/i, "Shielded balances", true],
  [/snforge|starknet-foundry/i, "Starknet Foundry", false],
  [/get-starknet/i, "get-starknet", true],
  [/avnu/i, "AVNU", true],
  [/ekubo/i, "Ekubo", true],
  [/vesu/i, "Vesu", true],
];

async function detectTooling(owner, repo, readme) {
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
  if (scarb) add("Cairo", true);

  const langs = await gh(`/repos/${owner}/${repo}/languages`);
  if (langs) {
    if (langs.Cairo) add("Cairo", true);
    if (langs.Rust) add("Rust", false);
  }

  /* Text pass over whatever prose and config we already fetched — no extra
   * requests. Scoped to the README and the manifests so a stray mention deep
   * in a lockfile doesn't light up a chip. */
  const corpus = [readme || "", pkgRaw || "", scarb || ""].join("\n");
  for (const [re, label, live] of TEXT_SIGNALS) if (re.test(corpus)) add(label, live);

  return found;
}

/* ---------- deployed demos ---------- */

/* Teams shouldn't have to open a second pull request the day their site goes
 * live, so the demo is discovered rather than declared. Ordered by how much
 * the signal means: an explicit value is a deliberate choice and always wins,
 * Pages and the Website field are the team saying "this is the site", and a
 * deployment URL is the host saying it. Stops at the first hit, so the extra
 * requests only happen for projects that haven't shipped one yet. */
async function resolveDemo(entry, meta, owner, repo) {
  if (entry.demo_url) return entry.demo_url;

  /* Free — the repository metadata is already in hand. */
  if (meta?.homepage && /^https?:\/\//i.test(meta.homepage)) return meta.homepage;

  if (meta?.has_pages) {
    const pages = await gh(`/repos/${owner}/${repo}/pages`);
    if (pages?.html_url) return pages.html_url;
  }

  const deployments = await gh(`/repos/${owner}/${repo}/deployments?per_page=1`);
  const id = deployments?.[0]?.id;
  if (id) {
    const statuses = await gh(`/repos/${owner}/${repo}/deployments/${id}/statuses?per_page=5`);
    const live = (statuses || []).find((st) => st.state === "success" && st.environment_url);
    if (live) return live.environment_url;
  }

  return "";
}

/* ---------- deployed contracts ---------- */

/* Which network a declared contract actually lives on, asked of the chains
 * rather than taken on trust. Mainnet is checked first because that is what
 * the sprint requires; a contract only on Sepolia is still worth showing, and
 * an address that exists nowhere is reported as such instead of silently
 * rendering a dead explorer link. */
const RPCS = [
  ["mainnet", process.env.MAINNET_RPC_URL || "https://rpc.starknet.lava.build"],
  ["sepolia", process.env.SEPOLIA_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia"],
];

async function classHashAt(rpc, address) {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "starknet_getClassHashAt",
        params: ["latest", address],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result || null;
  } catch { return null; }
}

async function resolveContracts(entry) {
  const declared = Array.isArray(entry.contracts) ? entry.contracts : [];
  const out = [];
  for (const raw of declared) {
    const address = typeof raw === "string" ? raw : raw.address;
    if (!address || !/^0x[0-9a-fA-F]+$/.test(address)) {
      warn(`${entry.slug} declared an address that isn't a felt: ${address}`);
      continue;
    }
    let network = "unknown";
    for (const [name, rpc] of RPCS) {
      if (await classHashAt(rpc, address)) { network = name; break; }
    }
    if (network === "unknown") warn(`${entry.slug}: ${address.slice(0, 12)}… not found on mainnet or sepolia`);
    out.push({ address, network });
  }
  return out;
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
  /* starknet_address is intentionally absent: it is required to submit, not to
     register, so a project with nothing deployed still renders on the hub. */
  const required = ["slug", "name", "one_liner", "category", "repo_url", "team"];
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
    demo_url: await resolveDemo(entry, meta, owner, repo),
    x_handle: entry.x_handle || "",
    inspired_by: entry.inspired_by || "",
    status: entry.status === "finished" ? "finished" : "building",
    contracts: await resolveContracts(entry),
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
      readme_hash: prev.readme_hash || "",
      summary: prev.summary || "",
      description_long: prev.description_long || "",
      latest_push: prev.latest_push || "",
      tooling: prev.tooling || [],
      has_readme: !!prev.has_readme,
      additions: prev.additions || 0,
      deletions: prev.deletions || 0,
    };
  }

  console.log(`  ${entry.slug}: reindexing`);
  const readme = await getTextFile(owner, repo, "README.md");
  const tooling = await detectTooling(owner, repo, readme);

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
  /* Lines moved in this push, GitHub-style. On a project's first index there is
   * no previous SHA to diff against, so the head commit's own stats stand in. */
  let additions = 0;
  let deletions = 0;
  if (prev?.head_sha && headSha && prev.head_sha !== headSha) {
    const cmp = await gh(`/repos/${owner}/${repo}/compare/${prev.head_sha}...${headSha}`);
    if (cmp) {
      const msgs = (cmp.commits || []).map((c) => `- ${c.commit.message.split("\n")[0]}`).join("\n");
      const files = (cmp.files || []).slice(0, 30).map((f) => `${f.filename} (+${f.additions}/-${f.deletions})`).join("\n");
      changeText = `Commits:\n${msgs}\n\nFiles changed:\n${files}`;
      for (const f of cmp.files || []) { additions += f.additions || 0; deletions += f.deletions || 0; }
    }
  }
  if (!changeText) {
    const commits = await gh(`/repos/${owner}/${repo}/commits?per_page=10`);
    if (commits?.length) {
      changeText = "Commits:\n" + commits.map((c) => `- ${c.commit.message.split("\n")[0]}`).join("\n");
    }
    if (headSha) {
      const headCommit = await gh(`/repos/${owner}/${repo}/commits/${headSha}`);
      additions = headCommit?.stats?.additions || 0;
      deletions = headCommit?.stats?.deletions || 0;
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
    has_readme: !!readme,
    additions,
    deletions,
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
