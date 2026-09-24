# A small fake-attacker case study

This repository implements a thought experiment: can a budget-limited fake attacker find a useful weakness in a stateful fraud rule when it sees only the feedback released to an ordinary client?

The example starts with an established account, a trusted device, an existing card, and an existing shipping address. A deterministic, hand-written search tries short action sequences. It finds one profitable sequence against the current rule, then the application replays those same stored actions against a proposed rule. A six-row synthetic corpus makes the cost to legitimate users visible.

This is a reproducible demonstration, not original empirical research. It contains no real transaction data, does not estimate production fraud detection performance, and makes no statistical claims. The fake attacker is not a machine-learning model.

## What to look at

The React interface is a five-part technical note:

1. The question and fixed fixture
2. Every candidate considered by the fake attacker
3. An open-loop replay against the current and proposed rules
4. Metrics and rows from the synthetic corpus
5. Engineering choices and limitations

The attacker receives acknowledgements, released outcomes, generic validation errors, remaining budget, and released utility. It never receives complete state, risk scores, matched rule identifiers, internal reasons, hidden history, defender metadata, or source configuration. The analyst endpoint is separate and exists so the interface can explain private decisions without weakening that boundary.

## Run locally

Requirements: Python 3.12 or later and Node.js 20 or later.

Start the API:

```powershell
cd backend
py -3.12 -m pip install -e ".[dev]"
py -3.12 -m uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API documentation is at `http://localhost:8000/docs`.

The API creates `backend/fraud_market.db` on first use. Set `FRAUD_MARKET_DATABASE_URL` to use another SQLite file.

Run the checks:

```powershell
cd backend
py -3.12 -m pytest -q -p no:cacheprovider
cd ..\frontend
npm ci
npm test
npm run build
```

## Architecture

```text
React case study
       |
FastAPI routes
       |
application service
  |            |
SQLite       pure engine
               |
       defender rule
               |
       public projection
```

The engine is independent of FastAPI, SQLAlchemy, and React. It uses typed actions, integer minor-unit money, logical time, deterministic costs, explicit validation, and idempotency keys. Canonical JSON and replay hashes make identical inputs easy to verify. SQLAlchemy stores fixtures, campaigns, submitted actions, events, public observations, replays, and comparisons in SQLite.

## Rule change

The current rule gives a trusted device enough weight to allow a high-value purchase immediately after a shipping-address change. The proposed rule challenges a high-value purchase during the 60 logical seconds after that change. Other trusted-device purchases keep their previous treatment. A challenge is an intervention, not a block.

The replay is open loop. Both rules receive the same stored actions and timestamps, so the fake attacker cannot change course after it sees the proposed rule.

## Limits

The demonstration has one fixed scenario, one small hand-written search, and one synthetic corpus. It has no real transaction data, statistical claims, machine-learning model, authentication, production deployment design, delayed feedback, or campaign-family analysis.
