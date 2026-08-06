# Private Sprint

> A 17-day sprint to ship a real privacy application on Starknet mainnet. Register by pull request, build in public, and watch the whole field ship alongside you.

**August 14 - August 31, 2026.** $5,000 USD paid in STRK, split across the top three projects.

Everyone works in their own public repository. Every push shows up on the hub at [strk20.starknet.io/hackathon](https://strk20.starknet.io/hackathon) while the sprint is running, so the rest of the field sees what you ship the day you ship it.

## Contents

- [How to enter](#how-to-enter)
- [One pull request, then we track it](#one-pull-request-then-we-track-it)
- [Your registry entry](#your-registry-entry)
- [Rules](#rules)
- [Submitting](#submitting)
- [Judging](#judging)
- [Timeline](#timeline)
- [Ideas](#ideas)
- [Resources](#resources)
- [After the sprint](#after-the-sprint)
- [Contributing](#contributing)

## How to enter

*Registration is a pull request against `registry.json`. It takes about two minutes.*

1. Fork this repository and add one object to [`registry.json`](registry.json).
2. Open a pull request. A check validates your entry and reports anything off - a slug already taken, a repository that isn't public, a field in the wrong shape.
3. Join the Telegram group. The link is in the comment on your merged PR.

**Start building before your PR is merged.** Registration is a formality, not a gate - nothing about it unlocks the stack, and review is usually same-day. Merging only decides when your project appears on the hub.

Registration stays open for the whole sprint. Registering on day 12 is fine; you just have less time.

## One pull request, then we track it

*You register once. Everything after that is read from your repository automatically - you never open a PR to update your progress.*

| Kept up to date for you | Where it comes from |
|---|---|
| Your latest push, and how long ago | your repository's commit history |
| A sentence describing what just landed | the commits and files in that push |
| Lines added and removed | the diff since we last looked |
| What your project does | your README |
| The stack you're using | `package.json`, `Scarb.toml`, and your README - the Privacy SDK, the Wallet API, `privacy_invoke`, anonymizers, sub-accounts, AVNU, Cairo, and the rest |
| Your deployed contracts, and which network each is on | checked against Starknet mainnet and Sepolia directly |
| Your live demo | GitHub Pages, then your repo's **Website** field, then your latest deployment |
| Your team's avatars and names | the GitHub handles in your entry |

Push to your repo and the hub reflects it within 30 minutes. Ship a demo and it appears on its own. Deploy a contract and it shows up with the right network beside it.

Only two things ever need another pull request: **submitting** (flipping `status` to `finished`, and adding your `starknet_address` if you haven't yet), and **changing that address** if you switch wallets mid-sprint.

## Your registry entry

*One object per project. Field-by-field guidance is in [CONTRIBUTING.md](./CONTRIBUTING.md).*

```json
{
  "slug": "zk-mail",
  "name": "ZK Mail",
  "one_liner": "Encrypted mail with shielded STRK20 payments attached to every message.",
  "category": "Consumer",
  "repo_url": "https://github.com/your-org/zk-mail",
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
| `one_liner` | yes | one sentence, roughly 120 characters |
| `category` | yes | `Consumer`, `DeFi`, `Tooling`, `Infra`, `Payments`, `Gaming`, or `Other` |
| `repo_url` | yes | your public GitHub repository |
| `starknet_address` | to submit | the address your mainnet transactions come from. Add it whenever you have one - it is only needed to verify eligibility at the end. |
| `team` | yes | bare GitHub handles. Avatars and names on the hub are resolved from these. |
| `x_handle` | no | without the `@`. Used to credit you in sprint updates. |
| `inspired_by` | no | an ID from [IDEAS.md](IDEAS.md), if you picked one up |
| `demo_url` | no | usually unnecessary - see the note below |
| `contracts` | no | array of deployed addresses; the hub checks which network each is on |
| `status` | yes | `building` while you work, `finished` when you submit |

> [!NOTE]
> **You don't need a second pull request when your demo goes live.** The hub looks for a deployed site on every project automatically: GitHub Pages first, then the repository's **Website** field, then your latest deployment. Filling in the Website field on your repo page is the one-click way to be certain it's found. Set `demo_url` by hand only if your demo lives somewhere none of those point to.

Ideas are **not** exclusive. Several teams working from the same idea is fine and expected - the hub shows how many, so you can see what's crowded.

## Rules

- Open to anyone. Individuals and teams, new projects or existing ones.
- Your repository must be **public and open-source**, with a license.
- To win, your app must run on **Starknet mainnet** against the live STRK20 pool, with at least **three mainnet transactions** from the address in your entry. You do not need an address to register - add it when you have one.
- A **public demo URL** anyone can open. Not a video, not a localhost screenshot.
- One payout address per winning team.

## Submitting

Before **August 31, 23:59 UTC**, open a second pull request changing your entry's `status` to `finished` and filling in `starknet_address` if you haven't already. Your repository's README must contain:

- What it does and why it needed privacy.
- How to run it locally.
- A link to your **3-minute demo video**.
- Your mainnet contract addresses.

## Judging

*A named panel scores every submitted project after submissions close. Nothing on the hub ranks projects by merit - it orders by most recent push, so you can see who is shipping.*

| Weight | Criterion |
|---|---|
| 30% | **STRK20 integration depth** - how far into the stack you went: shielded balances, private transfers, anonymizer contracts, the SDK |
| 30% | **Working mainnet product** - it runs, on mainnet, for a real user. Not a prototype behind a login. |
| 25% | **Innovation** - something the ecosystem doesn't have yet, or a materially better take on something it does |
| 15% | **Documentation & open-source quality** - a README someone can follow, code someone can build on, a license |

If another team depends on something you published, that counts toward your integration and open-source scores. Building the piece everyone else reuses is a winning strategy here.

Winners announced **September 4**.

## Timeline

| Date | |
|---|---|
| August 14 | Registration and hacking opens |
| August 31, 23:59 UTC | Submissions close |
| September 4 | Winners announced |

## Ideas

*Inspiration, not bounties. Nothing on the list is funded, assigned, or reserved.*

[IDEAS.md](IDEAS.md) holds 18 starting points across consumer apps, DeFi, tooling, infrastructure, compliance, and games. Build one, build a variation, or build something nobody has thought of. Community additions are welcome by pull request.

## Resources

- [Day 0: your first mainnet transaction](docs/MAINNET-DAY-0.md) - Zero to a shielded mainnet balance, with every value verified against the live network. Start here.
- [Awesome STRK20](https://github.com/Akashneelesh/awesome-strk20) - Curated list of the SDKs, helper contracts, proof-of-concept apps, and guides for the pool.
- [STRK20 starter kit](https://github.com/Akashneelesh/strk20-starter-kit) - A lean Next.js starter: wallet picker, shield/unshield/private transfer, shielded balances, and a deployable `privacy_invoke` helper.
- [Privacy SDK](https://github.com/starkware-libs/starknet-privacy) - The monorepo: pool contracts, the TypeScript SDK, and the proving service.
- [STRK20 by example](https://strk20-by-example.org/what-is-strk20) - Documentation for the pool, the Privacy Wallet API, and anonymizer contracts.
- [Build on STRK20](https://strk20.starknet.io/build) - Pick your integration route: private dapp, privacy wallet, or your own prover.

The STRK20 team is in the Telegram group every day of the sprint for architecture questions, integration help, and infrastructure blockers.

## After the sprint

Strong projects get continued support: technical feedback from the StarkWare privacy team, ecosystem introductions, and a path into the Starknet Foundation Grants Program. The sprint is where we find people worth backing - winning isn't the only way to come out of it with something.

## Contributing

Registering a project, submitting a finished one, and adding an idea all go through pull requests - see [CONTRIBUTING.md](./CONTRIBUTING.md). Please keep entries public, accurate, and link-checked.
