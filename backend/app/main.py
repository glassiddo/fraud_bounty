from __future__ import annotations
import os, uuid
from dataclasses import asdict
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.schemas import CampaignInput, PublicObservation, SubmitActionRequest
from app.attackers.heuristic import discover
from app.engine.fixtures import initial_state
from app.engine.models import Action, ActionType
from app.engine.runtime import execute_action, run_campaign
from app.evaluation.corpus import evaluate_versions
from app.persistence.database import Repository
from app.replay import compare

def to_actions(body: CampaignInput) -> list[Action]:
    return [Action(a.action_id, ActionType(a.type), a.timestamp, a.payload.model_dump()) for a in body.actions]

def create_app(database_url: str | None = None) -> FastAPI:
    app = FastAPI(title="Adversarial Fraud Testing Demo", version="1.0.0")
    app.state.repository, app.state.scenarios = Repository(database_url), {}
    app.add_middleware(CORSMiddleware, allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+", allow_methods=["*"], allow_headers=["*"])
    @app.exception_handler(RequestValidationError)
    async def invalid(_: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"code":"invalid_request","message":"Request validation failed"})
    @app.exception_handler(HTTPException)
    async def public_http_error(_: Request, exc: HTTPException):
        detail = exc.detail if isinstance(exc.detail, dict) else {"code":"invalid_request","message":str(exc.detail)}
        return JSONResponse(status_code=exc.status_code, content=detail)
    @app.get("/api/scenario")
    def scenario(): return {"name":"Trusted-device account takeover","fixture_id":"established_account","fixture_version":"1","budget":10,"currency":"USD","utility_coefficients":{"purchase_success_cost_minor":10_000,"action_cost_minor":100}}
    @app.post("/api/scenario/reset")
    def reset():
        scenario_id = str(uuid.uuid4()); app.state.scenarios[scenario_id] = initial_state()
        return {"scenario_id":scenario_id,"status":"active","remaining_budget":10}
    @app.post("/api/actions", response_model=PublicObservation, response_model_exclude_none=True)
    def submit(body: SubmitActionRequest):
        state = app.state.scenarios.get(body.scenario_id)
        if state is None: raise HTTPException(404, detail={"code":"not_found","message":"Scenario not found"})
        a=body.action; step=execute_action(state, Action(a.action_id,ActionType(a.type),a.timestamp,a.payload.model_dump()),"v1")
        app.state.scenarios[body.scenario_id]=step.state; return step.observation
    @app.post("/api/attacker/run")
    def run_attacker():
        actions, trace=discover(); result=run_campaign(actions,"v1"); result["search_trace"]=trace; comparison=compare(actions)
        campaign_id=f'campaign-{result["replay_hash"][:12]}'; stored=app.state.repository.save(campaign_id,result,comparison)
        return {"campaign_id":campaign_id,"campaign":[asdict(a) for a in actions],"result":result,"comparison":comparison,"stored":stored}
    @app.post("/api/campaigns")
    def save(body: CampaignInput):
        actions=to_actions(body); result=run_campaign(actions,"v1"); campaign_id=f'campaign-{result["replay_hash"][:12]}'
        return app.state.repository.save(campaign_id,result,compare(actions))
    @app.get("/api/campaigns/{campaign_id}")
    def get(campaign_id: str):
        try: return app.state.repository.get(campaign_id)
        except KeyError: raise HTTPException(404,detail={"code":"not_found","message":"Campaign not found"})
    @app.post("/api/campaigns/{campaign_id}/replay/{version}")
    def replay_stored(campaign_id: str, version: str):
        if version not in {"v1","v2"}: raise HTTPException(422,detail={"code":"invalid_request","message":"Unknown defender version"})
        stored=get(campaign_id); actions=[Action(a["action_id"],ActionType(a["type"]),a["timestamp"],a["payload"]) for a in stored["actions"]]
        result=run_campaign(actions,version); app.state.repository.save_replay(campaign_id,result); return result
    @app.get("/api/campaigns/{campaign_id}/comparison")
    def comparison_stored(campaign_id: str): return get(campaign_id)["comparison"]
    @app.post("/api/replay/{version}")
    def replay(version: str, body: CampaignInput):
        if version not in {"v1","v2"}: raise HTTPException(422,detail={"code":"invalid_request","message":"Unknown defender version"})
        return run_campaign(to_actions(body),version)
    @app.post("/api/comparison")
    def comparison(body: CampaignInput): return compare(to_actions(body))
    @app.get("/api/evaluation")
    def evaluation(): return evaluate_versions()
    return app

app=create_app(os.getenv("FRAUD_MARKET_DATABASE_URL"))
