from __future__ import annotations

from app.engine.models import Action
from app.engine.runtime import run_campaign


def compare(actions: list[Action]) -> dict:
    v1, v2 = run_campaign(actions, "v1"), run_campaign(actions, "v2")
    steps = []
    first_state = first_decision = first_observation = None
    for index, (left, right) in enumerate(zip(v1["steps"], v2["steps"])):
        row = {"index": index, "action": left["action"],
               "v1_decision": left["event"]["decision"], "v2_decision": right["event"]["decision"],
               "v1_observation": left["observation"], "v2_observation": right["observation"],
               "state_diverged": left["state"] != right["state"],
               "decision_diverged": left["event"]["decision"] != right["event"]["decision"],
               "observation_diverged": left["observation"] != right["observation"],
               "v1_utility_minor": left["utility"], "v2_utility_minor": right["utility"]}
        if first_state is None and row["state_diverged"]:
            first_state = row
        if first_decision is None and row["decision_diverged"]:
            first_decision = row
        if first_observation is None and row["observation_diverged"]:
            first_observation = row
        steps.append(row)
    return {"v1": {"utility_minor": v1["utility_minor"], "replay_hash": v1["replay_hash"]},
            "v2": {"utility_minor": v2["utility_minor"], "replay_hash": v2["replay_hash"]},
            "steps": steps, "first_state_divergence": first_state,
            "first_decision_divergence": first_decision,
            "first_observation_divergence": first_observation,
            "final_utility_divergence_minor": v2["utility_minor"] - v1["utility_minor"]}
