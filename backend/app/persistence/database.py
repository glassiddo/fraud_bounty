from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from sqlalchemy import ForeignKey, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class FixtureRow(Base):
    __tablename__ = "fixtures"
    key: Mapped[str] = mapped_column(String, primary_key=True)
    fixture_id: Mapped[str] = mapped_column(String)
    version: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(Text)


class CampaignRow(Base):
    __tablename__ = "campaigns"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    fixture_key: Mapped[str] = mapped_column(ForeignKey("fixtures.key"))
    defender_version: Mapped[str] = mapped_column(String)
    seed: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String)
    utility_minor: Mapped[int] = mapped_column(Integer)
    replay_hash: Mapped[str] = mapped_column(String)
    actions: Mapped[list[ActionRow]] = relationship(cascade="all, delete-orphan", order_by="ActionRow.position")
    comparison: Mapped[ComparisonRow | None] = relationship(cascade="all, delete-orphan", uselist=False)


class ActionRow(Base):
    __tablename__ = "submitted_actions"
    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[str] = mapped_column(ForeignKey("campaigns.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    idempotency_key: Mapped[str] = mapped_column(String, index=True)
    logical_timestamp: Mapped[int] = mapped_column(Integer)
    body: Mapped[str] = mapped_column(Text)
    event: Mapped[EventRow] = relationship(cascade="all, delete-orphan", uselist=False)
    observation: Mapped[ObservationRow] = relationship(cascade="all, delete-orphan", uselist=False)


class EventRow(Base):
    __tablename__ = "engine_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    action_row_id: Mapped[int] = mapped_column(ForeignKey("submitted_actions.id"), unique=True)
    body: Mapped[str] = mapped_column(Text)


class ObservationRow(Base):
    __tablename__ = "attacker_observations"
    id: Mapped[int] = mapped_column(primary_key=True)
    action_row_id: Mapped[int] = mapped_column(ForeignKey("submitted_actions.id"), unique=True)
    body: Mapped[str] = mapped_column(Text)


class ReplayRow(Base):
    __tablename__ = "replays"
    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[str] = mapped_column(ForeignKey("campaigns.id"), index=True)
    defender_version: Mapped[str] = mapped_column(String)
    identity: Mapped[str] = mapped_column(Text)
    result: Mapped[str] = mapped_column(Text)
    replay_hash: Mapped[str] = mapped_column(String)


class ComparisonRow(Base):
    __tablename__ = "defender_comparisons"
    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[str] = mapped_column(ForeignKey("campaigns.id"), unique=True)
    body: Mapped[str] = mapped_column(Text)


def database_url() -> str:
    return os.getenv("FRAUD_MARKET_DATABASE_URL", f"sqlite:///{Path(__file__).parents[2] / 'fraud_market.db'}")


class Repository:
    def __init__(self, url: str | None = None):
        self.engine = create_engine(url or database_url(), connect_args={"check_same_thread": False})
        Base.metadata.create_all(self.engine)

    def save(self, campaign_id: str, result: dict[str, Any], comparison: dict[str, Any] | None = None) -> dict[str, Any]:
        identity = result["identity"]
        fixture_key = f'{identity["fixture_id"]}:{identity["fixture_version"]}'
        with Session(self.engine) as session:
            fixture = session.get(FixtureRow, fixture_key)
            if fixture is None:
                fixture = FixtureRow(key=fixture_key, fixture_id=identity["fixture_id"], version=identity["fixture_version"], body=json.dumps(identity, sort_keys=True))
                session.add(fixture)
            existing = session.get(CampaignRow, campaign_id)
            if existing is not None:
                return self.get(campaign_id, session)
            row = CampaignRow(id=campaign_id, fixture_key=fixture_key, defender_version=identity["defender_version"], seed=identity["seed"], status=result["final_state"]["campaign_status"], utility_minor=result["utility_minor"], replay_hash=result["replay_hash"])
            session.add(row)
            for position, step in enumerate(result["steps"]):
                action = ActionRow(position=position, idempotency_key=step["action"]["action_id"], logical_timestamp=step["action"]["timestamp"], body=json.dumps(step["action"], sort_keys=True))
                action.event = EventRow(body=json.dumps(step["event"], sort_keys=True))
                action.observation = ObservationRow(body=json.dumps(step["observation"], sort_keys=True))
                row.actions.append(action)
            session.add(ReplayRow(campaign_id=campaign_id, defender_version=identity["defender_version"], identity=json.dumps(identity, sort_keys=True), result=json.dumps(result, sort_keys=True), replay_hash=result["replay_hash"]))
            if comparison is not None:
                row.comparison = ComparisonRow(body=json.dumps(comparison, sort_keys=True))
            session.commit()
            return self.get(campaign_id, session)

    def get(self, campaign_id: str, session: Session | None = None) -> dict[str, Any]:
        owns = session is None
        session = session or Session(self.engine)
        try:
            row = session.get(CampaignRow, campaign_id)
            if row is None:
                raise KeyError(campaign_id)
            return {"campaign_id": row.id, "status": row.status, "utility_minor": row.utility_minor,
                    "replay_hash": row.replay_hash, "actions": [json.loads(a.body) for a in row.actions],
                    "observations": [json.loads(a.observation.body) for a in row.actions],
                    "comparison": json.loads(row.comparison.body) if row.comparison else None}
        finally:
            if owns:
                session.close()

    def save_replay(self, campaign_id: str, result: dict[str, Any]) -> None:
        with Session(self.engine) as session:
            session.add(ReplayRow(campaign_id=campaign_id, defender_version=result["identity"]["defender_version"], identity=json.dumps(result["identity"], sort_keys=True), result=json.dumps(result, sort_keys=True), replay_hash=result["replay_hash"]))
            session.commit()
