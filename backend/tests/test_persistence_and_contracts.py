from pathlib import Path
from fastapi.testclient import TestClient

from app.attackers.heuristic import discover
from app.engine.fixtures import initial_state
from app.engine.models import Action, ActionType
from app.engine.runtime import execute_action
from app.main import create_app


PRIVATE = ("rule_id", "internal_reason", "metadata", "risk_score", "complete_state")


def local_db(name: str) -> tuple[Path, str]:
    path = Path(__file__).parent / name
    path.unlink(missing_ok=True)
    return path, f"sqlite:///{path}"


def test_campaign_survives_application_restart():
    path, url = local_db("restart-test.db")
    first = TestClient(create_app(url))
    created = first.post("/api/attacker/run").json()
    second = TestClient(create_app(url))
    stored = second.get(f"/api/campaigns/{created['campaign_id']}")
    assert stored.status_code == 200
    replay = second.post(f"/api/campaigns/{created['campaign_id']}/replay/v1").json()
    assert replay["replay_hash"] == created["result"]["replay_hash"]
    first.app.state.repository.engine.dispose(); second.app.state.repository.engine.dispose()
    path.unlink(missing_ok=True)


def test_public_success_and_error_contracts_do_not_leak():
    path, url = local_db("contract-test.db")
    client = TestClient(create_app(url))
    scenario = client.post("/api/scenario/reset").json()
    response = client.post("/api/actions", json={"scenario_id": scenario["scenario_id"], "action": {
        "action_id":"bad", "type":"attempt_purchase", "timestamp":0,
        "payload":{"device_id":"device_trusted","address_id":"missing","payment_instrument_id":"card_existing","amount_minor":100,"currency":"USD"}}})
    assert response.status_code == 200
    assert response.json()["error"] == "unknown shipping address"
    invalid = client.post("/api/actions", json={"scenario_id": scenario["scenario_id"], "action": {"type":"attempt_purchase","rule_id":"leak"}})
    assert invalid.status_code == 422
    assert set(invalid.json()) == {"code", "message"}
    combined = response.text + invalid.text
    assert all(name not in combined for name in PRIVATE)
    client.app.state.repository.engine.dispose(); path.unlink(missing_ok=True)


def test_invalid_idempotency_and_budget_are_stable():
    state = initial_state(1)
    bad = Action("bad", ActionType.ATTEMPT_PURCHASE, 0, {"amount_minor": 1, "address_id": "missing"})
    first = execute_action(state, bad, "v1")
    duplicate = execute_action(first.state, bad, "v1")
    assert first.event.status == "invalid"
    assert duplicate.event.status == "duplicate"
    assert first.state.remaining_budget == duplicate.state.remaining_budget == 1


def test_heuristic_enumerates_public_observations_and_finds_profit():
    actions, trace = discover()
    assert len(trace) == 3
    assert trace[-1]["released_utility_minor"] > 0
    assert actions[-1].payload["amount_minor"] == 150_000
    assert trace[-1]["search_status"].startswith("stopped")
    serialized = str(trace)
    assert all(name not in serialized for name in PRIVATE)
