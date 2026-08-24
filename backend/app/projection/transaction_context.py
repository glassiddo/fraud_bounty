from __future__ import annotations

from app.engine.models import Action, CampaignState, DefenderResult, Event


def project(action: Action, result: DefenderResult, event: Event, state: CampaignState) -> dict:
    observation = {
        "action_id": action.action_id,
        "action_type": action.type.value,
        "timestamp": action.timestamp,
        "acknowledged": event.status in {"applied", "duplicate"},
        "outcome": result.decision.value,
        "remaining_budget": state.remaining_budget,
    }
    if event.status == "invalid":
        observation["error"] = event.details["error"]
    if action.type.value == "attempt_purchase" and event.status == "applied":
        observation["transaction"] = {
            "amount_minor": action.payload["amount_minor"],
            "currency": action.payload.get("currency", "USD"),
        }
    return observation
