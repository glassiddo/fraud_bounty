from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import StrEnum
from typing import Any, TypedDict


class AuthenticatePayload(TypedDict):
    device_id: str


class ChangeAddressPayload(TypedDict):
    address_id: str
    label: str


class PurchasePayload(TypedDict):
    device_id: str
    address_id: str
    payment_instrument_id: str
    amount_minor: int
    currency: str


class AdvanceTimePayload(TypedDict):
    seconds: int


class ActionType(StrEnum):
    AUTHENTICATE = "authenticate"
    CHANGE_ADDRESS = "change_address"
    ATTEMPT_PURCHASE = "attempt_purchase"
    ADVANCE_TIME = "advance_time"


class Decision(StrEnum):
    ALLOW = "allow"
    BLOCK = "block"
    CHALLENGE = "challenge"
    REVIEW = "review"
    ACCEPT = "accept"
    INVALID = "invalid"


@dataclass(frozen=True)
class Action:
    action_id: str
    type: ActionType
    timestamp: int
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class Address:
    address_id: str
    label: str
    added_at: int


@dataclass
class CampaignState:
    account_id: str = "acct_demo"
    trusted_device_id: str = "device_trusted"
    device_trusted_since: int = -10_000
    authenticated: bool = False
    addresses: dict[str, Address] = field(default_factory=lambda: {
        "address_home": Address("address_home", "Established home", -10_000)
    })
    active_address_id: str = "address_home"
    payment_instrument_id: str = "card_existing"
    purchases: list[dict[str, Any]] = field(default_factory=list)
    logical_time: int = 0
    remaining_budget: int = 10
    campaign_status: str = "active"
    seen_action_ids: set[str] = field(default_factory=set)

    def public_dict(self) -> dict[str, Any]:
        value = asdict(self)
        value["seen_action_ids"] = sorted(self.seen_action_ids)
        return value


@dataclass(frozen=True)
class DefenderResult:
    decision: Decision
    rule_id: str
    internal_reason: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Event:
    action_id: str
    action_type: str
    timestamp: int
    status: str
    decision: str
    rule_id: str
    internal_reason: str
    cost: int
    state_changed: bool
    details: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class StepResult:
    event: Event
    observation: dict[str, Any]
    state: CampaignState
