# Adversarial Fraud Testing Platform — durable Goal 1

This repository contains the lean first vertical slice of a fraud-control regression lab. A transparent heuristic attacker exploits excessive trusted-device confidence in defender v1. The application then replays the identical open-loop campaign against a narrowly patched v2 and evaluates both versions on a labeled synthetic corpus.

This is a deterministic teaching and portfolio demonstration. It does **not** estimate real-world detection performance and contains no ML model or production data.

## What the demo proves

- The pure engine replays ordered actions without wall-clock time or external calls.
- The attacker sees a restricted projection, never defender rules, reasons, metadata, or complete state.
- The planted campaign earns positive utility against v1 and negative utility against v2.
- The patch challenges only a high-value purchase shortly after an address change; it does not block all purchases.
- Synthetic benign-user effects remain visible alongside fraud prevention.

## Run locally

Requirements: Python 3.12+ and Node.js 20+.

Start the API:

```powershell
cd backend
py -3.12 -m pip install -e ".[dev]"
py -3.12 -m uvicorn app.main:app --reload
```

Start the dashboard in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API documentation is at `http://localhost:8000/docs`.

The API creates `backend/fraud_market.db` on first start. Override it with
`FRAUD_MARKET_DATABASE_URL=sqlite:///absolute/path/demo.db` when isolation is useful.

Run all checks:

```powershell
cd backend
py -3.12 -m pytest -q -p no:cacheprovider
cd ..\frontend
npm ci
npm run build
```

## Architecture

```text
heuristic attacker -> attacker-facing service -> deterministic engine
                                                |-> defender v1/v2
                                                |-> restricted projection
                                                |-> replay comparison
                                                `-> synthetic evaluation

FastAPI exposes the service contract; React renders the same result. A single
SQLAlchemy/SQLite repository stores fixture versions, campaigns, submitted actions,
events, released observations, replay identities/results, and comparisons. The pure
engine imports none of FastAPI, SQLAlchemy, or React.
```

The engine under `backend/app/engine` has no FastAPI or frontend dependency. Defender decisions and attacker projection are separate. Money uses integer minor units; time is an integer logical timestamp.

## Demonstration workflow

1. `POST /api/attacker/run` enumerates three bounded candidates using only the
   attacker-facing projection, saves the profitable v1 campaign, and compares it.
2. `GET /api/campaigns/{id}` retrieves the ordered durable campaign.
3. `POST /api/campaigns/{id}/replay/v2` replays exactly those open-loop actions.
4. `GET /api/campaigns/{id}/comparison` retrieves state, decision, and visible-output
   divergences independently.
5. `GET /api/evaluation` returns labeled synthetic rows, metrics, challenge policy,
   and visible utility coefficients.

For manual action submission, call `POST /api/scenario/reset`, then `POST /api/actions`.
Payloads are discriminated by action type and reject extra fields. Public success and
error shapes deliberately omit rule IDs, reasons, risk details, hidden history, and
defender metadata. Swagger at `/docs` contains the exact contracts.

## Determinism and metric definitions

Replay identity includes fixture/version, transition engine, defender, disclosure and
scoring versions, seed, and the ordered timestamped actions embedded in the result.
Canonical JSON uses sorted keys and compact separators before SHA-256 hashing. Time is
logical, money is integer minor units, and invalid/duplicate idempotency keys have
recorded deterministic results.

Challenges and reviews are interventions and count as caught fraud for recall.
Challenges are not blocks; benign challenges count toward false intervention and
benign challenge rates. Only blocks contribute to legitimate value blocked. Review
volume remains separate. All utility coefficients are returned by the scenario and
evaluation endpoints and shown in the dashboard.

## Goal 1 boundary and limitations

This remains one fixed synthetic scenario with a tiny explicit corpus and transparent,
non-ML search. Its figures illustrate regression-test mechanics; they are not estimates
of production fraud detection, attacker behavior, customer harm, or financial impact.
There is no authentication, real data, payment execution, general scenario authoring,
delayed feedback, campaign-family aggregation, queue, worker, or production deployment
architecture. SQLite durability is intended for a local demonstration, not distributed
operation or indefinite replay compatibility.
