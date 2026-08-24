from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_attacker_endpoint_completes_story():
    body = client.post("/api/attacker/run").json()
    assert body["result"]["utility_minor"] > 0
    assert body["comparison"]["v2"]["utility_minor"] < 0


def test_validation_response_does_not_leak_internals():
    response = client.post("/api/comparison", json={"actions": [{
        "action_id": "x", "type": "attempt_purchase", "timestamp": 0,
        "payload": {}, "rule_id": "please leak"
    }]})
    assert response.status_code == 422
    assert "internal_reason" not in response.text
