from app.attackers.heuristic import campaign_actions
from app.engine.fixtures import initial_state
from app.engine.models import Action, ActionType
from app.engine.runtime import execute_action, run_campaign
from app.evaluation.corpus import evaluate_versions
from app.replay import compare


def purchase_decision(result):
    return result["steps"][-1]["event"]["decision"]


def test_replay_is_byte_deterministic():
    first = run_campaign(campaign_actions(), "v1")
    second = run_campaign(campaign_actions(), "v1")
    assert first == second
    assert first["replay_hash"] == second["replay_hash"]


def test_planted_campaign_and_patch():
    comparison = compare(campaign_actions())
    assert comparison["v1"]["utility_minor"] > 0
    assert comparison["v2"]["utility_minor"] < 0
    assert comparison["first_decision_divergence"]["v1_decision"] == "allow"
    assert comparison["first_decision_divergence"]["v2_decision"] == "challenge"


def test_logical_time_expires_recent_change_rule():
    actions = campaign_actions()[:2] + [
        Action("wait", ActionType.ADVANCE_TIME, 0, {"seconds": 60}),
        Action("buy", ActionType.ATTEMPT_PURCHASE, 60, {"device_id": "device_trusted",
               "address_id": "address_drop", "amount_minor": 150_000}),
    ]
    assert purchase_decision(run_campaign(actions, "v2", budget=20)) == "allow"


def test_budget_invalid_and_duplicate_are_deterministic():
    action = Action("one", ActionType.AUTHENTICATE, 0, {"device_id": "device_trusted"})
    applied = execute_action(initial_state(1), action, "v1")
    duplicate = execute_action(applied.state, action, "v1")
    assert duplicate.event.status == "duplicate"
    assert duplicate.event.cost == 0
    expensive = Action("two", ActionType.ATTEMPT_PURCHASE, 0, {
        "device_id": "device_trusted", "address_id": "address_home", "amount_minor": 1})
    invalid = execute_action(applied.state, expensive, "v1")
    assert invalid.event.details == {"error": "campaign budget exhausted"}


def test_projection_never_leaks_defender_fields():
    result = run_campaign(campaign_actions(), "v2")
    serialized = str([step["observation"] for step in result["steps"]])
    assert "rule_id" not in serialized
    assert "internal_reason" not in serialized
    assert "metadata" not in serialized


def test_v2_allows_benign_cases_and_metrics_are_known():
    evaluation = evaluate_versions()
    metrics = evaluation["v2"]["metrics"]
    assert metrics["benign_approval_rate"] == 0.75
    assert metrics["fraud_recall"] == 0.5
    assert metrics["intervention_precision"] == 0.5
    assert metrics["fraudulent_value_allowed_minor"] == 150_000
