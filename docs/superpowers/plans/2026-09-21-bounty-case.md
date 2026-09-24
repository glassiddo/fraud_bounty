# Fictional fraud bounty implementation plan

Goal: adapt the established-account demonstration into a short bounty-led portfolio case.

Architecture: retain React/Vite, FastAPI, the existing pure decision function and SQLite engine. Add a bounded case service with its own delayed outcome model and public projection. Preserve the original technical note as an explicitly privileged legacy appendix.

User specification: the implementation request in this task governs scope; proceed after inspection and explanation.

- [x] Test delayed fulfillment, rejected findings, public projection, state persistence and three-policy replay.
- [x] Add case engine and API. Reuse the existing decision function; simulate reputation and challenge completion separately. Persist attempts transactionally.
- [x] Add six presentation chapters, optional play, explicit privilege gate, inspectable records and sensitivity.
- [ ] Run all existing and new tests, build, inspect desktop/mobile browser flow, document limits and launch commands.

Mechanism: device trust survives a shipping-address change. A known collection address is stopped by a delayed synthetic reputation response; an unlinked address reaches dispatch. Targeted recent-change challenges overlap with movers and gift buyers. Waiting beyond the short window remains a documented adaptive gap.

Evaluation: deterministic group counts, not random plausible rows; identical customer records across policies. Challenge completion and attacker failure are assumptions, varied in the UI. Monetary loss is inventory plus fulfillment expense, distinct from retail value and assumed resale proceeds.

Verification: 19 backend tests and 8 frontend tests pass; production build passes. Browser inspected landing, both recorded outcomes, optional play, reveal gate and responses. Full responsive-device sweep deferred at user wrap-up request. Prior uncommitted work preserved; no commit or deployment.
