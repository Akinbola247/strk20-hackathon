# Contributing to Private Sprint

Thanks for building on the Starknet privacy pool. Everything here happens through pull requests.

## Registering your project

1. Fork the repo and edit `registry.json`.
2. Append one object to the array, keeping the existing format:
   ```json
   {
     "slug": "zk-mail",
     "name": "ZK Mail",
     "one_liner": "Encrypted mail with shielded STRK20 payments attached to every message.",
     "category": "Consumer",
     "repo_url": "https://github.com/your-org/zk-mail",
     "team": ["your-github-handle"]
   }
   ```
3. Don't modify anyone else's entry. Append yours; leave the rest alone.
4. Open the pull request. A check runs automatically and reports every problem at once.

**Start building before it's merged.** Registration doesn't unlock anything - merging only decides when your project appears on the hub.

**This is the only pull request you need until you submit.** Your pushes, what changed in them, lines added and removed, your project description, the stack you're using, your deployed contracts and their network, your demo, and your team's avatars are all read from your repository and refreshed every 30 minutes. You never open a PR to report progress.

### Fields

- **`slug`** - lowercase and hyphenated, unique across the registry. This is your project's id on the hub.
- **`one_liner`** - one sentence, roughly 120 characters. What it does, not why it's exciting.
- **`category`** - one of `Consumer`, `DeFi`, `Tooling`, `Infra`, `Payments`, `Gaming`, `Other`.
- **`repo_url`** - a public GitHub repository. The hub reads your commits, README, and manifests from it.
- **`team`** - bare GitHub handles, not URLs and not `@mentions`. Avatars and names on the hub come from these.
- **`x_handle`** - optional, without the `@`. Used to credit you in sprint updates.
- **`inspired_by`** - optional, an ID from `IDEAS.md`. Ideas aren't exclusive; this just shows what's crowded.

That's everything. Nothing about mainnet, contracts, or demos belongs in this file - you don't need anything deployed to register, and the rest lives in your own repository.

## strk20.json, in your repository

Everything you control goes in a `strk20.json` at the root of your own repo. You edit it whenever you like and the hub reads it within 30 minutes - no pull request against us, ever.

```json
{
  "starknet_address": "0x0123...",
  "contracts": ["0x0abc..."],
  "demo_video": "https://youtu.be/...",
  "demo_url": "https://your-demo.example"
}
```

- **`starknet_address`** - the address your mainnet transactions come from. Eligibility is checked against exactly this one, so keep it current if you switch wallets.
- **`contracts`** - deployed addresses. Each is checked against mainnet and Sepolia and shown with the network it was found on.
- **`demo_video`** - your 3-minute demo video.
- **`demo_url`** - only if your demo isn't found automatically. See below.

Every field is optional while you build. You need all of them by the deadline.

### Your demo is picked up automatically

You don't need to set `demo_url` in most cases. The hub checks each project for a deployment on every run, in this order:

1. `demo_url` in your `strk20.json`, if you set one - an explicit value always wins.
2. **GitHub Pages**, if the repository publishes a site.
3. The repository's **Website** field - the box under "About" on your repo page. One click, and the most reliable of the three.
4. Your latest successful **deployment**, if your host reports one back to GitHub.

## Adding an idea

1. Fork the repo and edit `IDEAS.md`.
2. Add your entry to the most fitting section, keeping the existing format:
   ```
   **IDEA-NN · Title**
   Two or three sentences: what it is, and what the hard part is.
   ```
3. Take the next free ID. Don't renumber existing entries.

Ideas are inspiration, not bounties - nothing on the list is funded, assigned, or reserved.

## Submitting

There is nothing to submit, and no second pull request. Whatever your repository shows at **August 31, 23:59 UTC** is your entry.

A project counts as submitted once four things are true, each checked automatically and shown on the hub so you can see what's still missing:

- A live demo anyone can open.
- A `demo_video` in your `strk20.json`.
- A `starknet_address` in your `strk20.json`.
- At least one contract deployed to mainnet.

Your README should still cover what it does and why it needed privacy, how to run it locally, and your mainnet contract addresses - that's what judges read, and documentation carries 15% of the score.

## Guidelines

- **Public only.** Your repository, your demo, and anything you link must resolve for someone who isn't logged in. Private repos can't be judged.
- **Mainnet, actually running.** To win, at least three mainnet transactions from the address in your entry, against the live pool. A prototype behind a login doesn't qualify. Nothing needs to be deployed to register.
- **Accurate.** Describe what your project actually does. Be especially precise about what is and isn't private - overclaiming costs you on integration depth. The [Day 0 guide](docs/MAINNET-DAY-0.md) has the breakdown.
- **License your repository.** It counts toward the open-source score, and other teams can't build on what they can't legally use.
- **No secrets, ever.** Use placeholder values for keys, addresses, and endpoints in anything you commit. Never commit real private keys.
- **Link-check before submitting.** Confirm every URL returns a live page.

## Reporting issues

Open an issue for a broken check, a wrong entry, or anything unclear in these docs. For questions while building, the Telegram group is faster - the STRK20 team is in it every day of the sprint.
