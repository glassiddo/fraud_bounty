from .models import CampaignState

FIXTURE_ID = "established_account"
FIXTURE_VERSION = "1"
ENGINE_VERSION = "1"
DISCLOSURE_POLICY_VERSION = "transaction_context.v1"
SCORING_POLICY_VERSION = "utility.v1"


def initial_state(budget: int = 10) -> CampaignState:
    return CampaignState(remaining_budget=budget)
