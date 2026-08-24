# Initial Implementation Prompt

Implement the first working vertical slice of an adversarial fraud-testing platform. Optimize for a small, legible, demonstrable system rather than a generalized production platform.

## Product objective

Build a working application in which a simple automated attacker discovers a profitable account-takeover campaign against a stateful defender, the campaign is recorded and replayed against two defender versions, and a dashboard shows both the attack outcome and the effect of the defender patch on synthetic benign users.

The project demonstrates:

- deterministic state transitions and replay;
- separation between complete defender state and restricted attacker observations;
- versioned fraud-control regression testing;
- attacker and defender utility trade-offs;
- the need to evaluate fraud prevention alongside legitimate-user harm.

It does not demonstrate real-world detection accuracy. Do not train or introduce an ML model.

## Technology

Use:

- Python 3.12+
- FastAPI and Pydantic
- SQLAlchemy with SQLite
- React, TypeScript, and Vite
- Recharts only if useful for the first dashboard
- pytest for backend tests
- Vitest for frontend tests if frontend logic warrants it

Keep the deterministic engine independent of FastAPI, SQLAlchemy, and the frontend. Do not add Docker, Redis, a task queue, authentication, cloud infrastructure, or a second database.

## Repository structure

Use a structure similar to:

```text
backend/
  app/
    api/              # FastAPI routes and public response schemas
    engine/           # Pure state, actions, transitions, events, replay
    defenders/        # Defender interface and v1/v2 rules
    projection/       # Attacker observation policies
    evaluation/       # Synthetic corpus and metrics
    attackers/        # Heuristic attacker
    persistence/      # SQLAlchemy models and repositories
    main.py
  tests/
frontend/
  src/
    api/
    components/
    pages/
    types/
docs/
```

Minor deviations are acceptable when they make the code simpler.

## Required scenario

Implement one fixed account-takeover scenario.

The scenario should include:

- an established account;
- a previously trusted device;
- an existing address and payment instrument;
- a shipping-address change;
- purchase attempts;
- logical time and a campaign budget.

Plant this weakness in defender v1:

> A previously trusted device receives excessive trust, allowing a high-value purchase immediately after a shipping-address change.

Defender v2 should patch it with a narrow rule such as:

> A recent sensitive profile change temporarily reduces device trust or requires a challenge for a high-value purchase.

The patch must not simply block all purchases.

## State and actions

Define typed state for at least:

- account;
- device and trust history;
- address and date added;
- payment instrument;
- purchase history;
- logical timestamp;
- remaining attacker budget;
- campaign status.

Support only the actions needed for the scenario, for example:

- `authenticate`
- `change_address`
- `attempt_purchase`
- `advance_time`

Add another action only when necessary for a coherent scenario.

Every action must have:

- a deterministic action ID or caller-provided idempotency key;
- a logical timestamp;
- a typed payload;
- a deterministic cost;
- explicit validation behavior.

Represent money as integer minor units. Do not read wall-clock time inside the engine.

## Deterministic engine

Implement the engine as pure or near-pure functions:

```text
initial state + ordered actions + scenario version + seed
    -> events + decisions + final state
```

Requirements:

- identical inputs produce identical serialized outputs;
- no external calls occur during execution or replay;
- invalid actions have deterministic, recorded results;
- state can be reconstructed from the initial fixture and recorded events or actions;
- seeded randomness is allowed only if required, and the first version should preferably avoid randomness entirely;
- canonical replay output can be hashed to verify reproducibility.

Use an append-only event/action representation persisted in SQLite. Do not build distributed event sourcing, CQRS, asynchronous consumers, or snapshots in the initial version.

## Defender backend

Define a small backend contract that receives complete defender-side context and returns an internal decision result.

The result should contain:

- decision: `allow`, `block`, `challenge`, or `review`;
- internal rule identifier;
- internal reason;
- optional defender-only metadata.

Implement `defender_v1` and `defender_v2`. The backend must not construct the public attacker response; the projection layer owns that responsibility.

## Projection boundary

Implement one initial attacker policy named `transaction_context`.

The attacker may receive:

- action acknowledgement;
- approved transaction or device attributes required for the demo;
- released decision outcome;
- reward or utility when appropriate;
- remaining campaign budget;
- generic validation errors.

The attacker must not receive:

- complete state;
- risk score;
- matched rule identifier;
- internal reason;
- hidden history or defender-only metadata.

Use explicit public response schemas. Add tests showing that defender-only fields do not appear in successful responses or validation errors. Treat status codes and error shapes as part of the observation contract.

Do not implement delayed or batched feedback in this first slice unless the core is already complete.

## Heuristic attacker

Implement one transparent, non-ML attacker that can discover or execute the planted weakness. It may use a short enumerated or heuristic search over permitted action sequences.

The attacker should:

- interact only through the attacker-facing application/service interface;
- respect action and campaign budgets;
- record the observations it actually received;
- produce an ordered submitted campaign;
- find at least one positive-utility campaign against v1.

Do not let it inspect defender state, rule identifiers, reasons, or source-level configuration at runtime.

## Replay comparison

Persist a replay identity containing at least:

- initial fixture identifier and version;
- transition-engine version;
- defender version;
- disclosure-policy version;
- scoring-policy version;
- seed;
- ordered actions and logical timestamps.

Replay the same open-loop action sequence against v1 and v2. Produce a step-by-step comparison containing:

- action;
- v1 decision and attacker-visible outcome;
- v2 decision and attacker-visible outcome;
- whether internal state diverged;
- whether defender decisions diverged;
- whether attacker-visible outputs diverged;
- utility accumulated under each version.

Clearly distinguish these divergence types; they need not occur at the same step.

## Benign and fraudulent evaluation corpus

Create a small deterministic, labeled synthetic corpus using explicit templates. It does not need to imitate a real population statistically.

Include examples such as:

- ordinary purchase from a trusted device;
- legitimate address change followed by a modest purchase;
- legitimate high-value purchase without a profile change;
- suspicious address change followed immediately by a high-value purchase;
- other small variations needed to reveal the v1/v2 trade-off.

Evaluate both defender versions and report:

- fraud recall;
- intervention precision;
- benign approval rate;
- false-intervention rate;
- benign challenge rate;
- fraudulent value allowed;
- legitimate value blocked;
- review volume if reviews are used;
- attacker utility;
- defender utility.

Keep `allow`, `block`, `challenge`, and `review` visible as separate outcomes. Define explicitly how metrics treat challenges. Label the results as metrics on a synthetic scenario corpus, not estimates of production performance.

Use simple configurable utility formulas. All coefficients must be visible in scenario configuration.

## API

Expose only the endpoints needed for the demonstration. A reasonable initial API is:

- start or reset the fixed scenario;
- submit an attacker action;
- run the heuristic attacker;
- submit or retrieve a campaign;
- replay a campaign against a defender version;
- retrieve v1/v2 comparison results;
- retrieve evaluation metrics.

Do not build general scenario authoring or user management.

## Dashboard

Build a functional single-page dashboard that communicates the result without requiring the user to inspect API responses.

It should show:

1. A short scenario description.
2. A button to run the heuristic attacker against v1.
3. The resulting ordered campaign and attacker-visible observations.
4. Attacker utility under v1.
5. A replay comparison against v2.
6. The first meaningful divergence between versions.
7. A compact v1/v2 metrics comparison for the synthetic corpus.
8. A warning that metrics are synthetic and do not represent real detection performance.

Prefer a clear table and a few summary cards over elaborate visualizations. Do not implement campaign-family aggregation in this first slice.

## Tests

At minimum, test:

- identical replay inputs produce identical outputs and hashes;
- logical time affects the recent-address-change rule correctly;
- v1 permits the planted campaign;
- v2 changes the intended decision;
- v2 does not block every benign case;
- defender-only fields never enter attacker response schemas;
- action budgets are enforced deterministically;
- invalid and duplicate actions behave deterministically;
- reported metric calculations are correct on a small known fixture.

## Completion criteria

The initial implementation is complete when a user can open the application, run the attacker, see a profitable campaign against v1, replay it unchanged against v2, identify the decision divergence, and compare the effect of the patch on labeled benign and fraudulent synthetic cases.

Favor explicit code and documentation over abstraction. If a proposed component does not contribute directly to that demonstration, leave it out of the initial implementation.
