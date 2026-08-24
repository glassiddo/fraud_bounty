from typing import Annotated, Literal, Union
from pydantic import BaseModel, ConfigDict, Field

class StrictModel(BaseModel): model_config = ConfigDict(extra="forbid")
class AuthenticatePayload(StrictModel): device_id: str
class ChangeAddressPayload(StrictModel):
    address_id: str
    label: str = "New address"
class PurchasePayload(StrictModel):
    device_id: str
    address_id: str
    payment_instrument_id: str
    amount_minor: int = Field(gt=0)
    currency: Literal["USD"] = "USD"
class AdvanceTimePayload(StrictModel): seconds: int = Field(gt=0)
class AuthenticateAction(StrictModel):
    action_id: str; type: Literal["authenticate"]; timestamp: int = Field(ge=0); payload: AuthenticatePayload
class ChangeAddressAction(StrictModel):
    action_id: str; type: Literal["change_address"]; timestamp: int = Field(ge=0); payload: ChangeAddressPayload
class PurchaseAction(StrictModel):
    action_id: str; type: Literal["attempt_purchase"]; timestamp: int = Field(ge=0); payload: PurchasePayload
class AdvanceTimeAction(StrictModel):
    action_id: str; type: Literal["advance_time"]; timestamp: int = Field(ge=0); payload: AdvanceTimePayload
ActionInput = Annotated[Union[AuthenticateAction,ChangeAddressAction,PurchaseAction,AdvanceTimeAction], Field(discriminator="type")]
class CampaignInput(StrictModel): actions: list[ActionInput]
class PublicTransaction(StrictModel): amount_minor: int; currency: str
class PublicObservation(StrictModel):
    action_id: str; action_type: str; timestamp: int; acknowledged: bool; outcome: str; remaining_budget: int
    error: str | None = None
    transaction: PublicTransaction | None = None
class SubmitActionRequest(StrictModel): scenario_id: str; action: ActionInput
