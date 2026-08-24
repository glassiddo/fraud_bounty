from __future__ import annotations

import copy
import hashlib
import json
from dataclasses import asdict

from app.defenders.rules import decide
from app.projection.transaction_context import project

from .fixtures import (DISCLOSURE_POLICY_VERSION, ENGINE_VERSION, FIXTURE_ID,
                       FIXTURE_VERSION, SCORING_POLICY_VERSION, initial_state)
from .models import (Action, ActionType, CampaignState, Decision, DefenderResult,
                     Event, StepResult)

ACTION_COSTS = {ActionType.AUTHENTICATE: 1, ActionType.CHANGE_ADDRESS: 2,
                ActionType.ATTEMPT_PURCHASE: 3, ActionType.ADVANCE_TIME: 1}


def canonical_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _validate(state: CampaignState, action: Action) -> str | None:
    if action.action_id in state.seen_action_ids:
        return "duplicate"
    if action.timestamp != state.logical_time:
        return "timestamp must equal current logical time"
    cost = ACTION_COSTS[action.type]
    if cost > state.remaining_budget:
        return "campaign budget exhausted"
    if action.type == ActionType.AUTHENTICATE and action.payload.get("device_id") != state.trusted_device_id:
        return "unknown device"
    if action.type == ActionType.CHANGE_ADDRESS and not action.payload.get("address_id"):
        return "address_id is required"
    if action.type == ActionType.ATTEMPT_PURCHASE:
        if not isinstance(action.payload.get("amount_minor"), int) or action.payload["amount_minor"] <= 0:
            return "amount_minor must be a positive integer"
        if action.payload.get("address_id") not in state.addresses:
            return "unknown shipping address"
    if action.type == ActionType.ADVANCE_TIME and (not isinstance(action.payload.get("seconds"), int) or action.payload["seconds"] <= 0):
        return "seconds must be a positive integer"
    return None


def execute_action(state: CampaignState, action: Action, defender_version: str) -> StepResult:
    next_state = copy.deepcopy(state)
    error = _validate(next_state, action)
    if error == "duplicate":
        result = DefenderResult(Decision.ACCEPT, "idempotency.duplicate", "Duplicate action ignored")
        event = Event(action.action_id, action.type.value, action.timestamp, "duplicate", result.decision.value,
                      result.rule_id, result.internal_reason, 0, False)
        return StepResult(event, project(action, result, event, next_state), next_state)
    if error:
        # Invalid submissions consume no budget, but their keys are recorded. A retry
        # with the same key therefore has one stable, deterministic response.
        next_state.seen_action_ids.add(action.action_id)
        result = DefenderResult(Decision.INVALID, "validation.invalid", "Action validation failed")
        event = Event(action.action_id, action.type.value, action.timestamp, "invalid", result.decision.value,
                      result.rule_id, result.internal_reason, 0, False, {"error": error})
        return StepResult(event, project(action, result, event, next_state), next_state)

    next_state.seen_action_ids.add(action.action_id)
    cost = ACTION_COSTS[action.type]
    next_state.remaining_budget -= cost
    result = decide(defender_version, next_state, action)
    changed = True
    if action.type == ActionType.AUTHENTICATE:
        next_state.authenticated = True
    elif action.type == ActionType.CHANGE_ADDRESS:
        from .models import Address
        address_id = action.payload["address_id"]
        next_state.addresses[address_id] = Address(address_id, action.payload.get("label", "New address"), next_state.logical_time)
        next_state.active_address_id = address_id
    elif action.type == ActionType.ADVANCE_TIME:
        next_state.logical_time += action.payload["seconds"]
    elif action.type == ActionType.ATTEMPT_PURCHASE and result.decision == Decision.ALLOW:
        next_state.purchases.append({"amount_minor": action.payload["amount_minor"], "timestamp": next_state.logical_time,
                                     "address_id": action.payload["address_id"]})
    event = Event(action.action_id, action.type.value, action.timestamp, "applied", result.decision.value,
                  result.rule_id, result.internal_reason, cost, changed)
    return StepResult(event, project(action, result, event, next_state), next_state)


def run_campaign(actions: list[Action], defender_version: str, budget: int = 10) -> dict:
    state = initial_state(budget)
    steps = []
    utility = 0
    for action in actions:
        step = execute_action(state, action, defender_version)
        state = step.state
        if action.type == ActionType.ATTEMPT_PURCHASE and step.event.decision == Decision.ALLOW:
            utility += int(action.payload["amount_minor"]) - 10_000
        utility -= step.event.cost * 100
        steps.append({"action": asdict(action), "event": asdict(step.event), "observation": step.observation,
                      "state": state.public_dict(), "utility": utility})
    output = {"identity": {"fixture_id": FIXTURE_ID, "fixture_version": FIXTURE_VERSION,
              "engine_version": ENGINE_VERSION, "defender_version": defender_version,
              "disclosure_policy_version": DISCLOSURE_POLICY_VERSION,
              "scoring_policy_version": SCORING_POLICY_VERSION, "seed": 0},
              "steps": steps, "final_state": state.public_dict(), "utility_minor": utility}
    if state.remaining_budget == 0:
        state.campaign_status = "budget_exhausted"
    elif actions:
        state.campaign_status = "completed"
    output["final_state"] = state.public_dict()
    canonical = canonical_json(output)
    output["replay_hash"] = hashlib.sha256(canonical.encode()).hexdigest()
    return output
