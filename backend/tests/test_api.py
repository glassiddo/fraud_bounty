from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_attacker_endpoint_completes_story():
    body = client.post("/api/attacker/run").json()
    assert body["result"]["utility_minor"] > 0
    assert "comparison" not in body
    analyst = client.get(f"/api/analyst/campaigns/{body['campaign_id']}").json()
    assert analyst["comparison"]["v2"]["utility_minor"] < 0


def test_attacker_run_and_analyst_fields_are_separate():
    body = client.post("/api/attacker/run").json()
    public = str(body)
    assert all(field not in public for field in ("rule_id", "internal_reason", "metadata", "final_state"))
    analyst = client.get(f"/api/analyst/campaigns/{body['campaign_id']}").json()
    assert "rule_id" in str(analyst)


def test_validation_response_does_not_leak_internals():
    response = client.post("/api/comparison", json={"actions": [{
        "action_id": "x", "type": "attempt_purchase", "timestamp": 0,
        "payload": {}, "rule_id": "please leak"
    }]})
    assert response.status_code == 422
    assert "internal_reason" not in response.text
