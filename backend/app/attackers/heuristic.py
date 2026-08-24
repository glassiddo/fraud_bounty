from __future__ import annotations
from dataclasses import asdict
from typing import Protocol
from app.engine.fixtures import initial_state
from app.engine.models import Action, ActionType
from app.engine.runtime import execute_action, run_campaign

class AttackerBoundary(Protocol):
    def submit(self, action: Action) -> dict: ...

class RestrictedSession:
    """Only this projected boundary is available to the search."""
    def __init__(self, defender_version: str = "v1", budget: int = 10):
        self.__state = initial_state(budget)
        self.__defender = defender_version
    def submit(self, action: Action) -> dict:
        step = execute_action(self.__state, action, self.__defender)
        self.__state = step.state
        return step.observation

def candidate_actions(wait: int, amount: int, prefix: str) -> list[Action]:
    result = [Action(f"{prefix}-auth", ActionType.AUTHENTICATE, 0, {"device_id": "device_trusted"}),
              Action(f"{prefix}-change", ActionType.CHANGE_ADDRESS, 0, {"address_id": "address_drop", "label": "Drop address"})]
    if wait:
        result.append(Action(f"{prefix}-wait", ActionType.ADVANCE_TIME, 0, {"seconds": wait}))
    result.append(Action(f"{prefix}-purchase", ActionType.ATTEMPT_PURCHASE, wait, {"device_id": "device_trusted", "address_id": "address_drop", "payment_instrument_id": "card_existing", "amount_minor": amount, "currency": "USD"}))
    return result

def discover() -> tuple[list[Action], list[dict]]:
    trace = []
    for index, (wait, amount) in enumerate(((120, 20_000), (0, 50_000), (0, 150_000))):
        boundary: AttackerBoundary = RestrictedSession()
        actions = candidate_actions(wait, amount, f"search-{index + 1}")
        observations = [boundary.submit(action) for action in actions]
        utility = amount - 10_000 if observations[-1]["outcome"] == "allow" else -10_000
        trace.append({"candidate": index + 1, "submitted_actions": [asdict(a) for a in actions], "observations": observations, "released_utility_minor": utility})
        if utility > 0 and wait == 0 and amount >= 100_000:
            return actions, trace
    raise RuntimeError("bounded search found no positive campaign")

def campaign_actions() -> list[Action]: return discover()[0]
def run_attacker() -> dict:
    actions, trace = discover()
    result = run_campaign(actions, "v1")
    result["search_trace"] = trace
    return result
