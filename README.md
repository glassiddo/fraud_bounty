# Could bounty hunting work for fraud prevention?

A fully fictional interactive portfolio case for fraud analyst applications. Northstar offers a $750 fictional bounty for a reproducible unauthorized order dispatched to a changed destination. The main story explores a platform hypothesis: if AI lowers root-cause investigation costs, independent search for unknown sequential gaps may become more valuable. The narrow playable example is a separate illustration.

## Run

The startup helper uses Python 3.12 and Node.js 20+. After installing dependencies, run `./start-demo.ps1` from the repository root to start both services in the background. It reuses services already running and writes startup logs to `.demo-logs/`. The backend also supports later Python versions when launched manually with the corresponding interpreter.

For first-time setup or separate terminals:

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

1. **The idea:** who authorized fraud bounties might attract, why outside testing could expose additional gaps, how AI complicates bounties, and the value of easier investigation.
2. **The bounty environment:** company-provided accounts, cards, and histories; platform responsibilities; the hunter’s shopping experience; and limits around bank responses.
3. **A possible setup:** an API-independent checkout with mixed products, quantities, custom recipients and destinations, supplied cards, and separate network/browser/cookie profiles. Integration with company testing infrastructure remains open.
4. **Privacy & realism:** isolation, information leakage, de-identification that preserves decision-relevant relationships, and whether findings survive representative reproduction.

The proposed broad search platform is not implemented. The checkout illustration reviews a combination without scoring it or submitting it to the backend. Network profiles, integration with company data, and earnings-based settlement are proposals. The existing one-account, one-order exercise retains its fixed fictional bounty and illustrates only a small stateful path. It does not measure attacker profit or demonstrate open-ended attacks.

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
