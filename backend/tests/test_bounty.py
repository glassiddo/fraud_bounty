from app.bounty import recorded, evaluation, public_view, replay
import pytest
from fastapi.testclient import TestClient
from app.main import create_app


def test_delayed_outcomes_and_validation():
    good = recorded('finding')
    false = recorded('apparent')
    assert good['steps'][2]['public']['orders'][0]['status'] == 'accepted'
    assert good['steps'][-1]['public']['orders'][0]['status'] == 'dispatched'
    assert good['qualified'] is True
    assert false['steps'][-1]['public']['orders'][0]['status'] == 'cancelled'
    assert false['qualified'] is False
    assert good['loss_minor'] == 92000


def test_public_projection_and_replay():
    run = recorded('finding')
    visible = public_view(run['state'])
    assert set(visible) == {'time', 'budget', 'address', 'authenticated', 'orders', 'messages'}
    assert all(set(o) == {'id', 'amount_minor', 'address', 'status'} for o in visible['orders'])
    assert replay(run['actions'], 'v1') == run
    for policy in ('blunt', 'v2'):
        changed = replay(run['actions'], policy)
        assert not changed['qualified']
        assert changed['loss_minor'] == 0
        assert changed['state']['orders'][0]['status'] in ('declined', 'verification required')


def test_shared_population_and_sensitivity():
    data = evaluation(80, 0)
    assert [r['customers'] for r in data['policies']] == [100, 100, 100]
    current, blunt, targeted = data['policies']
    assert current['legit_challenges'] == 0
    assert blunt['legit_declines'] == 40
    assert targeted['legit_challenges'] == 15
    assert targeted['expected_abandonments'] == 3
    assert evaluation(100, 0)['policies'][2]['expected_abandonments'] == 0
    assert evaluation(80, 100)['policies'][2]['expected_fraud_dispatches'] == 1
    assert [r['fulfillment_delay_minutes'] for r in data['policies']] == [0, 0, 5]
    assert targeted['challenge_operations_minor'] == 3200
    assert len({r['account_id'] for r in targeted['rows']}) == 100


def test_timing_no_future_leak_and_adaptive_gap():
    commands = recorded('finding')['actions'][:3]
    assert replay(commands)['loss_minor'] == 0
    assert replay(commands)['qualified'] is False
    assert all(e['time'] == 0 for e in replay(commands)['timeline'])
    commands.insert(2, {'kind': 'advance_time', 'seconds': 60})
    commands.append({'kind': 'advance_time', 'seconds': 300})
    assert replay(commands, 'v2')['qualified'] is True  # regression is not adaptive resistance
    apparent = recorded('apparent')['actions'][:3] + [{'kind': 'advance_time', 'seconds': 300}]
    assert replay(apparent)['state']['orders'][0]['status'] == 'cancelled'


def test_persistence_budget_and_idempotency(tmp_path):
    url = f'sqlite:///{tmp_path / "bounty.db"}'
    client = TestClient(create_app(url))
    attempt = client.post('/api/bounty/attempts').json()
    path = f'/api/bounty/attempts/{attempt["id"]}'
    command = {'kind': 'authenticate', 'request_id': 'once'}
    first = client.post(path + '/actions', json=command).json()
    assert first == client.post(path + '/actions', json=command).json()
    assert first['view']['budget'] == 11
    assert TestClient(create_app(url)).get(path).json() == first
    assert client.post(path + '/actions', json=command | {'kind': 'attempt_purchase'}).status_code == 409
    for i in range(5):
        response = client.post(path + '/actions', json={'kind': 'change_address', 'address': 'studio', 'request_id': f'change{i}'})
        assert response.status_code == 200
    assert client.post(path + '/actions', json={'kind': 'attempt_purchase', 'request_id': 'over'}).status_code == 422
    assert client.get(path).json()['view']['budget'] == 1
    public_record = client.get('/api/bounty/recorded/finding').json()
    assert set(public_record) == {'name', 'provenance', 'steps'}
    assert 'qualified' not in str(public_record)
    assert 'owner_report' not in str(public_record)


def test_bounded_actions():
    with pytest.raises(ValueError):
        replay([{'kind': 'attempt_purchase'}])
    with pytest.raises(ValueError):
        replay([{'kind': 'authenticate'}, {'kind': 'advance_time', 'seconds': -1}])
    with pytest.raises(ValueError):
        replay(recorded('finding')['actions'] + [{'kind': 'attempt_purchase'}])
