# Private Sprint

Seventeen days to ship a real privacy application on Starknet mainnet.

**August 14 – August 31, 2026.** $5,000 USD paid in STRK, split across the top three projects.

Everyone builds in the open. You work in your own public repository, and every push shows up on the hub at **[strk20.starknet.io/hackathon](https://strk20.starknet.io/hackathon)** while the sprint is running — so the rest of the field sees what you ship the day you ship it.

---

## How to enter

1. **Fork this repository.**
2. **Add your project to [`registry.json`](registry.json)** — one object, appended to the array. See the schema below.
3. **Open a pull request.** Once it's merged you're registered, and your module appears on the hub within 30 minutes.
4. **Join the Telegram group** — the link is in the merged PR comment, and the STRK20 team is in there every day of the sprint.

Registration stays open for the whole sprint. Registering on day 12 is fine; you just have less time.

### Your registry entry

```json
{
  "slug": "zkmail",
  "name": "ZK Mail",
  "one_liner": "Encrypted mail with shielded STRK20 payments attached to every message.",
  "category": "Consumer",
  "repo_url": "https://github.com/your-org/zkmail",
  "demo_url": "",
  "starknet_address": "0x0123...",
  "team": ["your-github-handle", "teammate-handle"],
  "x_handle": "yourhandle",
  "inspired_by": "IDEA-07",
  "status": "building"
}
```

| Field | Required | Notes |
|---|---|---|
| `slug` | yes | lowercase, hyphenated, unique across the registry |
| `name` | yes | display name on the hub |
| `one_liner` | yes | one sentence, ~120 characters. This is what people read on the card. |
| `category` | yes | `Consumer`, `DeFi`, `Tooling`, `Infra`, `Payments`, `Gaming`, or `Other` |
| `repo_url` | yes | your public GitHub repository |
| `demo_url` | no | add it when your demo is live; required to submit |
| `starknet_address` | yes | the address your mainnet transactions come from — used to verify eligibility |
| `team` | yes | GitHub handles. Avatars and names on the hub are resolved from these. |
| `x_handle` | no | without the `@`. Used to credit you in sprint updates. |
| `inspired_by` | no | an ID from [`IDEAS.md`](IDEAS.md), if you picked one up |
| `status` | yes | `building` while you work, `finished` when you submit |

Ideas are **not** exclusive. Several teams working from the same idea is fine and expected — the hub shows how many, so you can see what's crowded.

---

## Rules

- Open to anyone. Individuals and teams, new projects or existing ones.
- Your repository must be **public and open-source**, with a license.
- Your app must run on **Starknet mainnet** against the live STRK20 pool. At least **three mainnet transactions** from the address in your registry entry.
- A **public demo URL** anyone can open. Not a video, not a localhost screenshot.
- One payout address per winning team.

## How to submit

Before **August 31, 23:59 UTC**, open a second pull request that changes your entry's `status` to `finished` and fills in `demo_url`. Your repository's README must contain:

- What it does and why it needed privacy.
- How to run it locally.
- A link to your **3-minute demo video**.
- Your mainnet contract addresses.

## Judging

A named panel scores every submitted project. Nothing on the hub ranks projects by merit — the hub orders modules by recent activity so you can see who is shipping, and the panel decides winners after submissions close.

| Weight | Criterion |
|---|---|
| 30% | **STRK20 integration depth** — how far into the stack you went: shielded balances, private transfers, anonymizer contracts, the SDK |
| 30% | **Working mainnet product** — it runs, on mainnet, for a real user. Not a prototype behind a login. |
| 25% | **Innovation** — something the ecosystem doesn't have yet, or a materially better take on something it does |
| 15% | **Documentation & open-source quality** — a README someone can follow, code someone can build on, a license |

If another team depends on something you published, that counts toward your integration and open-source scores. Building the piece everyone else reuses is a winning strategy here.

Winners announced **September 4**.

---

## Timeline

| Date | |
|---|---|
| August 14 | Registration and hacking opens |
| August 31, 23:59 UTC | Submissions close |
| September 4 | Winners announced |

## Resources

- **[Day 0: your first mainnet transaction](docs/MAINNET-DAY-0.md)** — start here. Zero to a shielded mainnet balance.
- **[Ideas](IDEAS.md)** — inspiration, not bounties.
- **[Starter kit](https://github.com/starkware-libs/starknet-privacy-starter-kit)** — clone-and-go template with a working demo wired to the pool.
- **[Privacy SDK](https://github.com/starkware-libs/starknet-privacy)** — the monorepo.
- **[STRK20 by example](https://strk20-by-example.org/what-is-strk20)** — documentation.
- **[Build on STRK20](https://strk20.starknet.io/build)** — pick your integration route.

## After the sprint

Strong projects get continued support: technical feedback from the StarkWare privacy team, ecosystem introductions, and a path into the Starknet Foundation Grants Program. The sprint is where we find people worth backing — winning isn't the only way to come out of it with something.
