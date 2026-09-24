from __future__ import annotations

from app.engine.models import Action, ActionType, CampaignState, Decision, DefenderResult

HIGH_VALUE = 100_000
RECENT_CHANGE_WINDOW = 60


def decide(version: str, state: CampaignState, action: Action) -> DefenderResult:
    if action.type != ActionType.ATTEMPT_PURCHASE:
        return DefenderResult(Decision.ACCEPT, "action.accepted", "Non-purchase action accepted")

    amount = int(action.payload["amount_minor"])
    if not state.authenticated:
        return DefenderResult(Decision.BLOCK, "auth.required", "Purchase requires authentication")
    if action.payload.get("device_id") != state.trusted_device_id:
        return DefenderResult(Decision.CHALLENGE, "device.unrecognized", "Device is not trusted")

    active_address = state.addresses[action.payload['address_id']]
    recently_changed = state.logical_time - active_address.added_at < RECENT_CHANGE_WINDOW
    if version == "blunt" and active_address.address_id != "address_home" and state.logical_time - active_address.added_at < 86_400:
        return DefenderResult(Decision.BLOCK, "address.cooldown", "Decline orders to addresses added in the last day")
    if version == "v2" and amount >= HIGH_VALUE and recently_changed:
        return DefenderResult(
            Decision.CHALLENGE,
            "profile_change.high_value",
            "Recent shipping-address change temporarily reduces device trust",
            {"change_age": state.logical_time - active_address.added_at},
        )
    return DefenderResult(
        Decision.ALLOW,
        "trusted_device.allow",
        "Trusted device receives streamlined approval",
        {"device_trusted_since": state.device_trusted_since},
    )
