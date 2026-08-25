---
title: I'm building an open-source, Pix-inspired instant-payment foundation in Rust — and it needs contributors
published: false
tags: rust, opensource, fintech, showdev
cover_image: https://andrewsarr.github.io/raio-landing/assets/img/og-image.jpg
canonical_url: https://github.com/andrewSarr/raio
---

Brazil solved instant payments. In 2020, the Banco Central do Brasil shipped
Pix: send money to anyone, 24/7, in seconds, using their email or phone
number instead of a 20-digit account number. Adoption was fast enough to
make cards look slow, and it's now one of the most-used payment rails in the
country.

Almost nowhere else has that. Most markets have the pieces — bank rails,
card networks, one or more mobile-money providers — but not that in *shape*.
Every provider is its own island; sending money across providers, or across
borders, usually means routing through an intermediary that takes a cut and
adds a day. That's true of a lot of Europe, most of Latin America outside
Brazil, and it's especially visible in African mobile money: a large and
fast-growing base of accounts across M-Pesa, MTN MoMo, Orange Money, and
dozens of others, with almost none of them able to talk to each other
directly.

So I started building **raio**: an open-source instant-payment foundation in
Rust, learning the *shape* of Pix — alias-based pay-to-key, 24/7 settlement,
a "scan to pay" QR — and building it for interoperability instead of a
single central bank or a single market. Not a bank. Not a wallet. A
foundation: the root-of-trust types and the trait seams, for anyone building
a rail on top, anywhere.

This post is the architecture, honestly, plus exactly where it needs hands.

## The one rule

Everything about raio's design falls out of one constraint:

> `raio-core` stays IO-free. No network. No filesystem. No clock. No runtime.

That's it. If a change would make `core` depend on any of those, it belongs
in a different crate. This isn't dogma for its own sake — it's what makes the
foundation **deterministic and trivially fuzzable**. A `Money` type, a ledger
event, a QR codec — none of them should behave differently depending on what
thread they're called from, what the system clock says, or whether a
database happens to be reachable. Every IO-shaped concern is a **trait**
instead:

```rust
pub trait LedgerStore {
    fn open_account(&self, account: LedgerAccount) -> Result<(), LedgerError>;
    fn post(&self, tx: LedgerTx) -> Result<(), LedgerError>; // balanced double-entry, enforces funds
    fn balance(&self, account: &AccountId) -> Result<i64, LedgerError>;
    // ...
}

pub trait KeyDirectory {
    fn resolve(&self, key: &Key) -> Result<KeyClaim, DictError>;
    fn register(&self, claim: KeyClaim) -> Result<(), DictError>;
    // ...
}

pub trait SettlementProvider {
    fn settle(&self, transfer: TransferInstruction) -> Result<SettlementOutcome, SettlementError>;
    fn status(&self, tx_id: &TxId) -> Result<SettlementStatus, SettlementError>;
}
```

`raio-core` defines the trait. Anyone can write the implementation — an
in-memory one for tests, a `redb`-backed one for a single node, a
Postgres-backed one for a cluster — without ever touching the root of trust.
Two of those seams already ship real backends (`raio-ledger-redb` and
`raio-dict-redb`, both pure-Rust via [`redb`](https://github.com/cberner/redb),
no C toolchain to fight with).

## Money that can't lie

The other thing I got precise about early: `Money` is integer minor units
with checked arithmetic, never floats. And a foundation that has to work
in more than one market means dozens of currencies — several of which
don't have cents at all — so it's currency-aware from the start:

```rust
let xof = Money::from_minor(2500, Currency::Xof); // West African CFA franc — zero-decimal
let ngn = Money::from_minor(2_500_00, Currency::Ngn); // Nigerian naira — 2 decimals

xof.checked_add(ngn); // Err(CoreError::CurrencyMismatch { a: Xof, b: Ngn })
```

Mixing currencies has to go through a `Result` — the caller has to look the
mismatch in the eye, it can't silently produce a wrong number. The
zero-decimal CFA franc zones (XOF, XAF, and others) aren't a hack projected
through cents-that-don't-exist; every currency carries its own
`minor_scale()`, and `Money` respects it.

## Two QR standards, one codec pattern

raio ships two "copy-paste to pay" QR codecs, because Pix's BR Code and the
EMVCo QR that mobile-money and banking apps use nearly everywhere else are —
under the hood — the same shape: EMV-style TLV with a CRC-16/CCITT-FALSE
checksum.

```rust
use raio_brcode::{BrCodeBuilder, encode, decode};

let code = BrCodeBuilder::new()
    .gui("BR.GOV.BCB.PIX")
    .key("ana@example.org")
    .currency("986")
    .amount("25.00")
    .country("BR")
    .merchant_name("FULANO DE TAL")
    .merchant_city("BRASILIA")
    .txid("***")
    .build();

let payload = encode(&code).unwrap(); // "copia e cola"
let back = decode(&payload).unwrap();
assert_eq!(back, code);
```

Both codecs are pure functions — no `raio-core` dependency, no IO — which is
what makes them safe to throw a fuzzer at continuously. `raio-brcode` is the
learning reference; `raio-qr` (EMVCo Merchant-Presented Mode) is the
interoperable one — the standard M-Pesa, MTN MoMo, Orange Money, and others
already speak.

## What it looks like end to end

```bash
git clone https://github.com/andrewSarr/raio
cd raio
cargo run --example settlement_demo
```

```text
== before ==
BankA balance: 1000.00 BRL
BankB balance: 0.00 BRL

Resolved email:ana@example.org -> participant .../account ...

== settlement ==
status: Settled

== after ==
BankA balance: 975.00 BRL
BankB balance: 25.00 BRL

== BR Code (copia e cola) ==
00020126370014BR.GOV.BCB.PIX0115ana@example.org5303986540525.005802BR5913FULANO DE TAL6008BRASILIA6240053601a038a0-730d-7680-a251-90d8b9f246ad63045CC5
```

Alias resolution → a double-entry settlement → a BR Code, in milliseconds,
with a naive in-memory `SettlementProvider` standing in for a real
settlement backend (never deploy that part — see `SECURITY.md`).

## Where it stands, and where it needs you

Shipped: the core types, the double-entry ledger model, both QR codecs, and
durable `redb` backends for the ledger and the key directory. What's still
open, in order of leverage:

- **A `Transport` trait + exactly-once delivery** — the messaging seam
  between participants (ISO 20022 + GSMA Mobile Money adapters behind one
  sync trait). This is the biggest unlock: without it, raio is a foundation
  with no wire.
- **`raio-rail`** — the HTTP clearing-house + participant nodes. Payment
  request → key resolution → settlement → QR emission, across real nodes
  instead of one process. Good first crate if you want to touch every layer
  once.
- **A production `SettlementProvider` adapter** — PAPSS, an RTGS, or a real
  mobile-money API, replacing the naive example.
- **SQL/Postgres backends** for `LedgerStore` / `KeyDirectory` — the `redb`
  ones prove the seam works; a Postgres one is genuinely useful and a
  contained first PR.

None of these require understanding the whole system — that's the point of
the trait seams. Pick one, open an issue with the "Implement a missing
crate" template, and go.

## Links

- Repo: https://github.com/andrewSarr/raio
- Landing page (EN/FR): https://andrewsarr.github.io/raio-landing/
- Journal (build notes): https://raio-journal.vercel.app
- Contributing guide: https://github.com/andrewSarr/raio/blob/main/CONTRIBUTING.md

Dual-licensed MIT OR Apache-2.0. Not a bank, not affiliated with Pix or the
Banco Central do Brasil — just borrowing a good idea and building the layer
underneath it, in the open.
