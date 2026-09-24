"""Case routes with explicit hunter, merchant and evaluator projections."""
import json
import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text

from app.bounty import evaluation, investigation, public_view, recorded, replay


class Command(BaseModel):
    model_config = ConfigDict(extra='forbid')
    request_id: str = Field(min_length=1, max_length=80)
    kind: Literal['authenticate', 'change_address', 'attempt_purchase', 'advance_time']
    address: Literal['studio', 'collect'] | None = None
    seconds: int | None = None


def routes(engine):
    router = APIRouter(prefix='/api/bounty')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE IF NOT EXISTS bounty_attempts (id TEXT PRIMARY KEY, body TEXT NOT NULL)'))

    def load(connection, attempt_id):
        row = connection.execute(text('SELECT body FROM bounty_attempts WHERE id=:id'), {'id': attempt_id}).first()
        if row is None:
            raise HTTPException(404, 'Attempt not found. Start a new attempt.')
        return json.loads(row[0])

    @router.get('/recorded/{name}')
    def recording(name: str):
        try:
            run = recorded(name)
        except ValueError as error:
            raise HTTPException(404, str(error))
        return {'name': name, 'provenance': 'Scripted illustration; not agent-discovered.', 'steps': run['steps']}

    @router.post('/attempts')
    def start():
        attempt_id = str(uuid.uuid4())
        with engine.begin() as connection:
            connection.execute(text('INSERT INTO bounty_attempts (id, body) VALUES (:id, :body)'), {'id': attempt_id, 'body': '[]'})
        return {'id': attempt_id, 'view': public_view(replay([])['state'])}

    @router.get('/attempts/{attempt_id}')
    def get(attempt_id: str):
        with engine.connect() as connection:
            commands = load(connection, attempt_id)
        return {'id': attempt_id, 'view': public_view(replay(commands)['state'])}

    @router.post('/attempts/{attempt_id}/actions')
    def act(attempt_id: str, body: Command):
        # SQLite's reserved writer lock makes budget checks and append atomic.
        with engine.connect() as connection:
            connection.execute(text('BEGIN IMMEDIATE'))
            commands = load(connection, attempt_id)
            command = body.model_dump(exclude_none=True)
            previous = next((c for c in commands if c['request_id'] == body.request_id), None)
            if previous and previous != command:
                raise HTTPException(409, 'Request key already used for another action.')
            if not previous:
                commands.append(command)
            try:
                result = replay(commands)
            except ValueError as error:
                raise HTTPException(422, str(error))
            connection.execute(text('UPDATE bounty_attempts SET body=:body WHERE id=:id'), {'id': attempt_id, 'body': json.dumps(commands)})
            connection.commit()
        return {'id': attempt_id, 'view': public_view(result['state'])}

    @router.get('/merchant/investigation')
    def investigate():
        return investigation()

    @router.get('/merchant/attempts/{attempt_id}')
    def validate(attempt_id: str):
        with engine.connect() as connection:
            commands = load(connection, attempt_id)
        return replay(commands)

    @router.get('/evaluator')
    def evaluate(completion: int = Query(80, ge=0, le=100), attacker_completion: int = Query(0, ge=0, le=100)):
        return evaluation(completion, attacker_completion)

    return router
