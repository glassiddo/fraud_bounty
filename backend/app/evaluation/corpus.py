from __future__ import annotations

from dataclasses import dataclass

from app.engine.models import Action, ActionType
from app.engine.runtime import run_campaign

UTILITY = {"fraud_loss_weight": 1, "legitimate_block_weight": 1, "challenge_cost": 2_000,
           "review_cost": 1_000, "attacker_purchase_cost": 10_000, "action_cost": 100}


@dataclass(frozen=True)
class Case:
    case_id: str
    label: str
    actions: list[Action]


def _actions(case_id: str, *, amount: int, changed: bool = False, wait: int = 0) -> list[Action]:
    result = [Action(f"{case_id}-auth", ActionType.AUTHENTICATE, 0, {"device_id": "device_trusted"})]
    address = "address_home"
    if changed:
        address = f"{case_id}-address"
        result.append(Action(f"{case_id}-change", ActionType.CHANGE_ADDRESS, 0, {"address_id": address, "label": "New address"}))
    if wait:
        result.append(Action(f"{case_id}-wait", ActionType.ADVANCE_TIME, 0, {"seconds": wait}))
    result.append(Action(f"{case_id}-purchase", ActionType.ATTEMPT_PURCHASE, wait, {
        "device_id": "device_trusted", "address_id": address, "payment_instrument_id": "card_existing",
        "amount_minor": amount, "currency": "USD"}))
    return result


CORPUS = [
    # Equal transaction values keep Goal 1 evaluation count-based and legible.
    Case("ordinary", "benign", _actions("ordinary", amount=150_000)),
    Case("legit_change_recent", "benign", _actions("legit_change_recent", amount=150_000, changed=True)),
    Case("legit_high", "benign", _actions("legit_high", amount=150_000)),
    Case("legit_change_wait", "benign", _actions("legit_change_wait", amount=150_000, changed=True, wait=120)),
    Case("fraud_immediate", "fraud", _actions("fraud_immediate", amount=150_000, changed=True)),
    Case("fraud_delayed", "fraud", _actions("fraud_delayed", amount=150_000, changed=True, wait=120)),
]


def evaluate(version: str) -> dict:
    rows = []
    for case in CORPUS:
        result = run_campaign(case.actions, version, budget=20)
        purchase = next(s for s in reversed(result["steps"]) if s["action"]["type"] == "attempt_purchase")
        rows.append({"case_id": case.case_id, "label": case.label,
                     "amount_minor": purchase["action"]["payload"]["amount_minor"],
                     "decision": purchase["event"]["decision"]})
    fraud = [r for r in rows if r["label"] == "fraud"]
    benign = [r for r in rows if r["label"] == "benign"]
    interventions = [r for r in rows if r["decision"] != "allow"]
    caught = [r for r in fraud if r["decision"] != "allow"]
    false_interventions = [r for r in benign if r["decision"] != "allow"]
    fraudulent_value_allowed = sum(r["amount_minor"] for r in fraud if r["decision"] == "allow")
    legitimate_value_blocked = sum(r["amount_minor"] for r in benign if r["decision"] == "block")
    challenge_count = sum(r["decision"] == "challenge" for r in rows)
    review_count = sum(r["decision"] == "review" for r in rows)
    defender_utility = -(fraudulent_value_allowed * UTILITY["fraud_loss_weight"] +
                         legitimate_value_blocked * UTILITY["legitimate_block_weight"] +
                         challenge_count * UTILITY["challenge_cost"] + review_count * UTILITY["review_cost"])
    ratio = lambda n, d: round(n / d, 4) if d else 0.0
    return {"version": version, "rows": rows, "metrics": {
        "fraud_recall": ratio(len(caught), len(fraud)),
        "intervention_precision": ratio(len(caught), len(interventions)),
        "benign_approval_rate": ratio(sum(r["decision"] == "allow" for r in benign), len(benign)),
        "false_intervention_rate": ratio(len(false_interventions), len(benign)),
        "benign_challenge_rate": ratio(sum(r["decision"] == "challenge" for r in benign), len(benign)),
        "fraudulent_value_allowed_minor": fraudulent_value_allowed,
        "legitimate_value_blocked_minor": legitimate_value_blocked,
        "review_volume": review_count,
        "attacker_utility_minor": fraudulent_value_allowed - sum(UTILITY["attacker_purchase_cost"] for r in fraud),
        "defender_utility_minor": defender_utility,
    }}


def evaluate_versions() -> dict:
    return {"synthetic_warning": "Synthetic scenario metrics; not production detection estimates.",
            "challenge_treatment": "Challenges and reviews count as interventions and as fraud caught for recall; challenges are not blocks. Benign challenges count in false-intervention and benign-challenge rates. Only blocks contribute to legitimate value blocked.",
            "utility_coefficients": UTILITY, "v1": evaluate("v1"), "v2": evaluate("v2")}
