# Ideas

**Inspiration, not bounties.** Nothing here is funded, assigned, or reserved. The prize is top-three only, judged on the rubric in the [README](README.md). Build one of these, build a variation, or build something nobody has thought of — the last option has won more hackathons than this list ever will.

Ideas are **not exclusive**. Several teams working the same idea is fine; the hub shows how many, so you can see what's crowded before you commit. Reference an idea with `"inspired_by": "IDEA-07"` in your registry entry.

**Add your own** — open a PR against this file. Community ideas are welcome and get the next free ID.

---

## Consumer

**IDEA-01 · Private payroll**
Pay a team from a shielded balance. Recipients see their own salary, nobody sees anyone else's, and the company's total outflow stays private. The hard part is recurring payments without leaking a schedule.

**IDEA-02 · Shielded messaging with value attached**
Encrypted messages where a private transfer rides along with the message. Tipping, invoices, paid DMs. Note discovery is the interesting constraint.

**IDEA-03 · Private donations**
A donation page where the donor list is provably real but individually private — the recipient can prove total received without revealing who gave what. Useful for political and humanitarian giving.

**IDEA-04 · Anonymous group treasury**
A shared shielded balance several people can spend from under a policy (threshold, spending limits, time locks) without exposing individual contributions or the balance.

## DeFi

**IDEA-05 · Private lending**
Borrow against a shielded balance without publishing position size. Liquidation is the hard problem: how does a liquidator act on a position they cannot see?

**IDEA-06 · Shielded limit orders**
Resting orders that don't broadcast size or price intent until they fill. Anonymizer contract plus an off-chain matching layer.

**IDEA-07 · Private DCA / recurring buys**
Scheduled buys executed from a shielded balance through existing AMMs, so the accumulation pattern isn't a public trail.

**IDEA-08 · Private yield routing**
Deposit shielded, earn across venues, withdraw shielded, with the strategy's positions unlinkable to the depositor.

## Tooling

**IDEA-09 · Drop-in React component kit**
Shield, unshield, private-transfer, and balance components any Starknet app can install and render. If other sprint projects depend on it, that counts for you in judging.

**IDEA-10 · Privacy-aware wallet connector**
A connect-wallet layer that understands shielded balances and surfaces them next to public ones, with the viewing key handled correctly.

**IDEA-11 · Local dev environment**
One command that gives a developer a pool, an indexer, a prover, and funded test accounts. Whatever the starter kit doesn't cover yet.

**IDEA-12 · Transaction simulator**
Show a user what a private transaction will reveal *before* they sign it. Anonymity-set size, timing correlation, amount leakage.

## Infrastructure

**IDEA-13 · Open note indexer**
Note discovery today means scanning. A public, self-hostable indexer that wallets can query without handing over a viewing key.

**IDEA-14 · Private bridging**
Move value in or out of Starknet without the bridge transaction linking source and destination. Genuinely hard, genuinely valuable, unlikely to finish in 17 days — a working prototype and a clear write-up would still be a strong submission.

**IDEA-15 · Prover-as-a-service**
Hosted proof generation with a clean API, so app teams don't each operate proving infrastructure.

## Compliance & analytics

**IDEA-16 · Selective disclosure tooling**
Let a user prove a specific fact about their private activity — "this payment came from me", "my balance exceeds X", "none of my funds touched this address" — without revealing everything else.

**IDEA-17 · Privacy score**
Score how private a given address actually is, given its shielding behaviour, timing, and amounts. Tell users what's leaking and what to change.

## Games

**IDEA-18 · Hidden-information games**
Poker, fog-of-war strategy, sealed-bid auctions. Anything where the game is ruined by a public state and fixed by a private one.

---

*Maxime's RFPs, Harsh's ideas, and community suggestions from X merge into this file before August 14.*
