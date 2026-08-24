# Implementation Outline

This outline separates the project into goals. Complete each goal as a usable vertical improvement; avoid building later platform features before the central replay demonstration works.

## Goal 1: Prove the vertical slice

### Purpose

Demonstrate the complete idea with one fixed account-takeover scenario and minimal infrastructure.

### Build

- Pure deterministic state model and transition function
- Logical time and integer monetary values
- Fixed initial account fixture
- Minimal action set
- Simple defender v1 and v2
- One attacker-facing observation policy
- One heuristic attacker
- Ordered campaign recording
- Open-loop replay against both defender versions
- Small labeled benign/fraudulent corpus
- Basic FastAPI endpoints
- Single-page React dashboard

### Dashboard content

- Scenario explanation
- Run-attacker control
- Ordered action and observation timeline
- v1 outcome and attacker utility
- v1/v2 step comparison
- First decision divergence
- Synthetic evaluation metrics for both versions

### Acceptance criteria

- The attacker produces a positive-utility campaign against v1.
- The same actions no longer produce positive utility against v2.
- The dashboard identifies why and where behavior changed.
- Benign evaluation proves that v2 does not simply block everything.
- Repeating a replay produces byte-equivalent canonical output and the same hash.

### Explicit exclusions

- General scenario creation
- Delayed or batched feedback
- Campaign-family aggregation
- Shared cohorts
- Authentication and multiple users
- Marketplace or payout functionality

## Goal 2: Make the engine trustworthy

### Purpose

Turn the successful prototype into credible regression-testing infrastructure.

### Build

- Version all replay dependencies
- Persist campaigns, actions, events, fixtures, and results in SQLite
- Add idempotency and duplicate-action handling
- Define canonical serialization and replay hashes
- Separate state, defender logic, projection, persistence, and API layers
- Strengthen error and observation schemas
- Add deterministic scenario reset
- Expand engine and API tests

### Replay comparison

Show separately:

- first internal-state divergence;
- first defender-decision divergence;
- first attacker-visible divergence;
- final utility divergence.

### Acceptance criteria

- A stored campaign remains reproducible after application restart.
- Each result identifies every relevant configuration version.
- No hidden defender field appears in attacker-visible payloads or errors.
- Engine tests do not require the API, database, or frontend.

## Goal 3: Strengthen defender evaluation

### Purpose

Demonstrate that fraud-control changes must be evaluated for both fraud prevention and legitimate-user harm.

### Build

- Expand the deterministic synthetic corpus
- Document scenario labels and generation templates
- Define how challenges and reviews count in each metric
- Add configurable attacker and defender utility coefficients
- Show value-weighted as well as count-based metrics
- Add a v1/v2 confusion-matrix view
- Add a concise trade-off summary

### Metrics

- Fraud recall
- Intervention precision
- Benign approval rate
- False-intervention rate
- Benign challenge rate
- Fraudulent value allowed
- Legitimate value blocked
- Review volume
- Attacker utility
- Defender utility

### Acceptance criteria

- Every metric is reproducible from exported evaluation rows.
- The UI states that metrics describe a synthetic labeled corpus.
- A defender patch can improve some metrics while visibly worsening others.
- Utility coefficients are visible rather than hidden in code.

## Goal 4: Demonstrate feedback as an information channel

### Purpose

Test the claim that delayed and batched outcomes reduce the bandwidth and temporal precision of attacker feedback without eliminating leakage.

### Build

- Immediate feedback mode
- Fixed-delay feedback mode
- End-of-campaign batch mode
- One deliberately discoverable decision threshold or sequential rule
- Controlled attacker experiment with fixed budgets
- Repeated deterministic trials
- Results view or experiment report

### Measurements

Choose one primary measure:

- actions or campaigns required to find a profitable strategy.

Optional secondary measures:

- success probability under a fixed budget;
- threshold-estimation error;
- attacker utility under equal resource budgets.

### Acceptance criteria

- All modes expose the same underlying defender rule.
- Only feedback timing changes between experimental conditions.
- Results are reported across multiple deterministic trials, not as one anecdotal run.
- Documentation avoids claiming that delayed feedback eliminates leakage.

## Goal 5: Add analyst-oriented campaign families

### Purpose

Show how many raw campaigns can become a small number of explainable, replayable findings.

### Build

- Define three or four explicit campaign families
- Construct deterministic trajectory fingerprints
- Group campaigns using interpretable matching rules
- Select a representative trajectory for each family
- Link every family to replay
- Show within-family variation and matching explanation

### Example families

- Rapid purchase after profile change
- Many instruments attempted on one account
- One instrument reused across multiple accounts
- Trust-building followed by high-value extraction

### Dashboard content

- Family name and plain-language description
- Campaign count and submitted-principal count
- Validation rate
- Aggregate attacker or defender impact
- Representative trajectory
- Explanation of why campaigns were grouped
- Replay action

### Acceptance criteria

- A small handcrafted test set is assigned to expected families.
- Minor irrelevant variation does not create excessive new families.
- The UI calls these rule-defined families, not ML-discovered clusters.
- Counts do not overstate verified real-world attacker identity.

## Goal 6: Portfolio-quality finalization

### Purpose

Make the project easy for a technical reviewer to understand, run, and evaluate.

### Build

- Refine the dashboard and empty/error states
- Add architecture and threat-model documentation
- Add one-command local setup
- Provide seeded demonstration data
- Add screenshots or a short recorded walkthrough
- Add an architecture diagram
- Document design decisions and limitations
- Add automated backend and frontend checks
- Measure and document replay reproducibility

### README emphasis

The final README should explain:

1. The ex-post limitation of ordinary fraud investigation
2. The idea of prospective, bounded adversarial testing
3. Defender/attacker information asymmetry
4. Deterministic campaign replay across defender versions
5. Benign-user regression and operational trade-offs
6. Analyst-oriented aggregation
7. What the project deliberately does not claim

### Acceptance criteria

- A reviewer can understand the project within two minutes.
- A new user can run the demonstration without manual database editing.
- The primary v1-to-v2 story is visible without reading source code.
- Tests cover determinism, projection boundaries, replay, and metrics.
- Documentation distinguishes synthetic demonstration results from production claims.

## Stretch goals

Only consider these after Goals 1–6 are solid:

- Second scenario type
- Outcome-only disclosure policy
- Closed-loop attacker reruns in addition to open-loop replay
- Scenario configuration UI
- Shared-cohort execution and contamination experiments
- Multiple pluggable defender implementations
- Exportable campaign regression suites

Do not add real external participants, production data, payments, bounty adjudication, or marketplace mechanics to this portfolio implementation.
