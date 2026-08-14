/* Existing registrations are append-only. A later registration must not
 * silently replace a project that was already accepted. */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const baseSha = process.env.BASE_SHA;
if (!baseSha) {
  console.log("BASE_SHA is not set - skipped append-only registry check.");
  process.exit(0);
}

let before;
try {
  before = JSON.parse(execFileSync("git", ["show", `${baseSha}:registry.json`], { encoding: "utf8" }));
} catch (error) {
  console.error(`Could not read registry.json at ${baseSha}: ${error.message}`);
  process.exit(1);
}

const after = JSON.parse(readFileSync("registry.json", "utf8"));
const currentRepos = new Set(after.map((entry) => entry?.repo_url).filter(Boolean));
const removed = before
  .map((entry) => entry?.repo_url)
  .filter((repoUrl) => repoUrl && !currentRepos.has(repoUrl));

if (removed.length) {
  console.error("Existing registry entries cannot be removed or replaced:");
  for (const repoUrl of removed) console.error(`  - ${repoUrl}`);
  console.error("Append new projects as new objects in registry.json.");
  process.exit(1);
}

console.log(`Registry retention check passed - ${before.length} existing project${before.length === 1 ? "" : "s"} preserved.`);
