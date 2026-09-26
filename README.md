# Could bounty hunting work for fraud prevention?

A fully fictional interactive portfolio case for fraud analyst applications. Northstar offers a $750 fictional bounty for a reproducible unauthorized order dispatched to a changed destination. The main story explores a platform hypothesis: if AI lowers root-cause investigation costs, independent search for unknown sequential gaps may become more valuable. The narrow playable example is a separate illustration.

## Run

Python 3.12+ and Node.js 20+ are required. In two terminals:

```powershell
cd backend
py -3.12 -m pip install -e ".[dev]"
py -3.12 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open [the local case](http://127.0.0.1:5173). Set `VITE_API_URL` to override the default `http://localhost:8000/api`. This local demonstration is not deployed or authenticated.

## The case

1. **Why now?:** the author's hypothesis about AI and a possible shift in the fraud-testing bottleneck.
2. **What hunters find:** sequential paths toward simulated economic gain, distinct from bounty rewards.
3. **The platform:** a recorded transaction screen with customer-visible history and an explicit advance-time interaction, alongside the information the company withholds.
4. **Company value:** additional coverage, cross-control evidence and reusable tests. An optional gated illustration retains the existing analysis.
5. **Potential & limits:** incremental value, simulation fidelity, economics and related work.

The proposed broad search platform is not implemented. The existing one-account, one-order exercise illustrates only a small stateful path. It does not measure attacker profit or demonstrate open-ended attacks.

The accepted Studio 8 order dispatches at +120 simulated seconds and is confirmed unauthorized at +300. Collection point 14 initially succeeds at checkout but is cancelled at +30 after a simulated reputation response links it to two historical disputed accounts. Events are relative to checkout. Large time advances process scheduled events in order. A challenge or decline does not inherit baseline dispatch/dispute events.

The targeted control challenges $1,000+ purchases within 60 simulated seconds of adding their shipping address. Movers and gift buyers overlap with the finding. Waiting until the window expires remains a demonstrated gap, not a claim of adaptive resistance.

## Reproduction and checks

```powershell
cd backend
py -3.12 -m pytest -q -p no:cacheprovider
py -3.12 -m app.bounty_analysis
cd ..\frontend
npm test
npm run build
```

`bounty_analysis` prints JSON with the qualification calculation, replay hashes, all 100 customer records and decisions. Default results: 1 of 2 selected submissions qualifies; $920 modeled inventory/delivery loss; current/blunt/targeted legitimate declines 0/40/0 and challenges 0/0/15. At 80% legitimate completion, targeted verification has 3 expected abandonments. Its assumed operations cost is $32 for 16 challenges, including the submitted finding. None of these counts estimates production prevalence or savings.

## Implementation and persistence

- `backend/app/bounty.py`: deterministic delayed case, public projection, recordings and constructed cohort. Reuses the existing engine and `defenders/rules.py`.
- `backend/app/bounty_api.py`: public hunter routes, separate merchant/evaluator routes, transactional SQLite persistence and idempotent action submissions.
- `frontend/src/BountyApp.tsx`, `TransactionPreview.tsx`, `Hunter.tsx`, `Merchant.tsx`: presentation, public transaction recording, customer-only play and privileged analytical views.
- `backend/tests/test_bounty.py`, `frontend/src/BountyApp.test.tsx`: delayed outcomes, projection allowlists, replay consistency, budgets, persistence, idempotency, sensitivity, privilege gating and retry behavior.

The API creates `backend/fraud_market.db`; `FRAUD_MARKET_DATABASE_URL` selects another SQLite file. Attempts use an additive `bounty_attempts` table. The browser stores the attempt ID and whether privileged content was opened. There is no reset within an attempt. Clearing browser storage or calling the create endpoint can create another attempt; this is not tamper-proof budget enforcement.

The original technical presentation, heuristic, campaign storage and endpoints are preserved. The earlier detailed React views remain in source, outside the shortened main reading path. Its immediate utility and six-row metrics are explicitly labeled legacy and are not used for the new case. The prior README is preserved in [docs/legacy-technical-note.md](docs/legacy-technical-note.md). Earlier outlines describe that legacy scope.

## Analytical limits

Everything is synthetic. No real merchant, payment, account or fraud infrastructure is contacted. Recordings are authored, not agent-discovered. The reputation response tests downstream handling of a fixed signal, not a real provider's recognition capability.

Retail order value ($1,500), assumed merchant inventory/delivery loss ($920), illustrative net resale proceeds ($700), and fictional bounty ($750) remain separate. Challenge completion and $2 verification operations cost are assumptions. Sensitivity uses expected alternative branches, not replayed evidence of an attacker completing verification; completed verification adds an assumed five-minute fulfillment delay. No support-cost or ROI estimate is made.

The cohort is deliberately constructed, not representative traffic. Privileged routes have no authentication: separate projections enforce the intended application flow, not secure isolation from source inspection or direct API use. Opening privileged material marks subsequent play as informed exploration.

Independent participation and rewards are the hypothesis. Automated fraud red-teaming is related work, including [Darwinium Beagle](https://www.darwinium.com/beagle); this case makes no unsupported novelty or comparative-effectiveness claim.
