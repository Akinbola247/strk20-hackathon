# Private Sprint

> A small, curated sprint to ship a real privacy application on Starknet mainnet. Apply by pull request, build in public alongside the other builders working on Starknet privacy.

**August 14 - August 31, 2026.** $5,000 USD paid in STRK, split across the top three projects.

Everyone works in their own public repository. Every push shows up on the hub at [strk20.starknet.io/hackathon](https://strk20.starknet.io/hackathon) while the sprint is running, so the rest of the field sees what you ship the day you ship it.

## Contents

- [How to apply](#how-to-apply)
- [One pull request, then we track it](#one-pull-request-then-we-track-it)
- [Your registry entry](#your-registry-entry)
- [strk20.json](#strk20json)
- [Rules](#rules)
- [Submitting](#submitting)
- [Judging](#judging)
- [Timeline](#timeline)
- [Ideas](#ideas)
- [Resources](#resources)
- [After the sprint](#after-the-sprint)
- [Contributing](#contributing)

## How to apply

*This is a curated sprint. The pull request is an application, and merging it means we're adding you to the builders group.*

1. Fork this repository and add one object to [`registry.json`](registry.json), including your Telegram username.
2. Open a pull request. A check validates the shape of your entry; a human reads the rest.
3. If we merge it, you're in the Telegram group with the other builders working on Starknet privacy, and your project appears on the hub.

**We're keeping the group small and serious.** It exists so people building privacy on Starknet can talk to each other and to the STRK20 team, and that only works if everyone in it is genuinely building. We'd rather have fifteen teams who ship than fifty who registered.

If you're already in the privacy builders group, this is a formality - open the PR and carry on. If we don't know you yet, tell us what you're building and why in the PR description. That's what we read.

Applications stay open for the whole sprint. Applying on day 12 is fine; you just have less time.

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
| Your Starknet address, contracts and demo video | `strk20.json` in your own repository - see below |

Push to your repo and the hub reflects it within 30 minutes. Ship a demo and it appears on its own. Deploy a contract and it shows up with the right network beside it.

**There is no second pull request.** Submitting isn't a form you remember to fill in before the deadline - it's a state your repository is in, and the hub shows you exactly which parts you're missing.

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
  "telegram": ["your_telegram", "teammate_telegram"],
  "x_handle": "yourhandle",
  "inspired_by": "IDEA-07"
}
```

| Field | Required | Notes |
|---|---|---|
| `slug` | yes | lowercase, hyphenated, unique across the registry |
| `name` | yes | display name on the hub |
| `one_liner` | yes | one sentence, roughly 120 characters |
| `category` | yes | `Consumer`, `DeFi`, `Tooling`, `Infra`, `Payments`, `Gaming`, or `Other` |
| `repo_url` | yes | your public GitHub repository |
| `team` | yes | bare GitHub handles. Avatars and names on the hub are resolved from these. |
| `telegram` | yes | bare Telegram usernames, no `@`, one per person who needs group access. We use them to check whether you're already in the builders group and to add you if you aren't. Never published on the hub. |
| `x_handle` | no | without the `@`. Used to credit you in sprint updates. |
| `inspired_by` | no | an ID from [IDEAS.md](IDEAS.md), if you picked one up |

That's the whole entry. Nothing about mainnet, contracts, or demos belongs here - you don't need anything deployed to register.

## strk20.json

*A file in your own repository. None of this goes in your registration PR - add each piece to your own repo whenever you have it, and the hub picks it up within 30 minutes.*

```json
{
  "starknet_address": "0x0123...",
  "contracts": ["0x0abc...", "0x0def..."],
  "demo_video": "https://youtu.be/...",
  "demo_url": "https://your-demo.example"
}
```

| Field | Notes |
|---|---|
| `starknet_address` | The address your mainnet transactions come from. Eligibility is checked against exactly this one. |
| `contracts` | Deployed addresses. Each is checked against mainnet and Sepolia, and shown with the network it was found on. |
| `demo_video` | Your 3-minute demo video. |
| `demo_url` | Only if your demo isn't discoverable automatically - see the note below. |

**Nothing here is required to register, and adding it is never a pull request.** Deployed a contract? Paste the address in. Recorded your demo video? Add the link. The hub reads the file on its next run and your row updates on its own.

It matters that these end up in your repository, though: they're how we know your app is on mainnet and how judges reach your demo. A project with none of them still shows on the hub - it just can't be judged. The hub shows each team which pieces are still missing, so nothing is a surprise on the last day.

> [!NOTE]
> **Your demo is usually found without you doing anything.** The hub checks GitHub Pages first, then the repository's **Website** field, then your latest deployment. Filling in the Website field on your repo page is the one-click way to be certain. Set `demo_url` in `strk20.json` only if your demo lives somewhere none of those point to.

Ideas are **not** exclusive. Several teams working from the same idea is fine and expected - the hub shows how many, so you can see what's crowded.

## Rules

- Anyone can apply. Individuals and teams, new projects or existing ones - but participation is curated, and not every application is accepted.
- Your repository must be **public and open-source**, with a license.
- To win, your app must run on **Starknet mainnet** against the live STRK20 pool, with at least **three mainnet transactions** from the address in your `strk20.json`. You do not need an address to register - add it when you have one.
- A **public demo URL** anyone can open. Not a video, not a localhost screenshot.
- One payout address per winning team.

## Submitting

*There is nothing to submit, and no second pull request. Whatever your repository shows at **August 31, 23:59 UTC** is your entry.*

By then, four things need to exist for judges to be able to score you. All are read from your repository automatically - you never tell us about any of them:

- A **live demo** anyone can open.
- A **3-minute demo video**, linked in `strk20.json`.
- Your **Starknet address** in `strk20.json`.
- At least one **contract deployed to mainnet**.

Your README should still cover what it does and why it needed privacy, how to run it locally, and your mainnet contract addresses - that's what judges read, and it carries 15% of the score.

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
