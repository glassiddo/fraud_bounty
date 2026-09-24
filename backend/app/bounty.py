"""Versioned fictional case. Controls are executable; external events are assumptions.

No public result contains labels, internal decisions, economic estimates or qualification.
The original engine supplies action costs, state transitions and policy decisions.
"""
from __future__ import annotations

import hashlib
import copy
from dataclasses import asdict

from app.engine.models import Action, ActionType
from app.engine.fixtures import initial_state
from app.engine.runtime import execute_action, canonical_json

VERSION = 'northstar-1'
POLICIES = ('v1', 'blunt', 'v2')
ADDRESSES = {'address_home': 'Saved home', 'studio': 'Studio 8', 'collect': 'Collection point 14'}
LOSS_MINOR = 92_000  # Inventory $900 + delivery $20; no retail-value double counting.


def action_for(command: dict, state, index: int) -> Action:
    kind = command.get('kind')
    payload = {}
    if kind == 'authenticate':
        payload = {'device_id': 'device_trusted'}
    elif kind == 'change_address':
        address = command.get('address')
        if address not in {'studio', 'collect'}:
            raise ValueError('Choose an available destination.')
        payload = {'address_id': address, 'label': ADDRESSES[address]}
    elif kind == 'attempt_purchase':
        payload = {'device_id': 'device_trusted', 'address_id': state.active_address_id,
                   'payment_instrument_id': 'card_existing', 'amount_minor': 150_000, 'currency': 'USD'}
    elif kind == 'advance_time':
        seconds = command.get('seconds')
        if type(seconds) is not int or seconds not in {30, 60, 120, 180, 300} or state.logical_time + seconds > 600:
            raise ValueError('Choose a time step within the 600-second horizon.')
        payload = {'seconds': seconds}
    else:
        raise ValueError('Action is not available.')
    return Action(f'case-{index}', ActionType(kind), state.logical_time, payload)


def public_view(state: dict) -> dict:
    return {key: state[key] for key in ('time', 'budget', 'address', 'authenticated', 'messages')} | {
        'orders': [{key: order[key] for key in ('id', 'amount_minor', 'address', 'status')}
                   for order in state['orders']]}


def replay(commands: list[dict], policy: str = 'v1') -> dict:
    if policy not in POLICIES:
        raise ValueError('Unknown policy')
    engine = initial_state(12)
    orders, timeline, steps, messages = [], [], [], []
    state = {}
    for index, command in enumerate(commands):
        action = action_for(command, engine, index)
        if action.type != ActionType.AUTHENTICATE and not engine.authenticated:
            raise ValueError('Sign in first.')
        if action.type == ActionType.AUTHENTICATE and engine.authenticated:
            raise ValueError('Already signed in.')
        if action.type == ActionType.ATTEMPT_PURCHASE and orders:
            raise ValueError('This attempt permits one order.')
        step = execute_action(engine, action, policy)
        if step.event.status != 'applied':
            raise ValueError('Action unavailable or budget exhausted.')
        engine = step.state
        timeline.append({'time': action.timestamp, 'event': action.type.value,
                         'known': step.event.internal_reason, 'rule': step.event.rule_id})
        message = {'authenticate': 'Signed in on your saved device.', 'change_address': 'Shipping address saved.',
                   'advance_time': 'Time advanced.', 'attempt_purchase': 'Order request received.'}[command['kind']]
        if action.type == ActionType.ATTEMPT_PURCHASE:
            decision = step.event.decision
            status = {'allow': 'accepted', 'block': 'declined', 'challenge': 'verification required'}[decision]
            orders.append({'id': 'NS-1042', 'amount_minor': 150_000, 'address': ADDRESSES[engine.active_address_id],
                           'address_id': engine.active_address_id, 'status': status, 'submitted_at': engine.logical_time,
                           'decision': decision, 'reputation_arrived': False, 'owner_report': False})
            message = {'accepted': 'Order accepted. Preparing for dispatch.', 'declined': 'Order could not be placed.',
                       'verification required': 'Verify with the original account owner to continue.'}[status]
        # Process each event at its scheduled time, even when the viewer advances over it.
        for order in orders:
            elapsed = engine.logical_time - order['submitted_at']
            if order['decision'] != 'allow':
                continue  # A challenged order never inherits the baseline dispatch/report path.
            if elapsed >= 30 and not order['reputation_arrived']:
                order['reputation_arrived'] = True
                linked = order['address_id'] == 'collect'
                timeline.append({'time': order['submitted_at'] + 30, 'event': 'reputation response',
                                 'known': 'Collection point 14 links to two prior confirmed disputes.' if linked else 'No prior disputed-account link for this destination.',
                                 'rule': 'simulated external response'})
                if linked:
                    order['status'] = 'cancelled'
                    messages.append({'time': order['submitted_at'] + 30, 'text': 'Order cancelled before dispatch. Payment authorization released.'})
            if elapsed >= 120 and order['status'] == 'accepted':
                order['status'] = 'dispatched'
                timeline.append({'time': order['submitted_at'] + 120, 'event': 'dispatch', 'known': 'Warehouse released parcel; no cancellation signal.', 'rule': 'simulated fulfillment'})
                messages.append({'time': order['submitted_at'] + 120, 'text': 'Your parcel has been dispatched.'})
            if elapsed >= 300 and order['status'] == 'dispatched' and not order['owner_report']:
                order['owner_report'] = True
                timeline.append({'time': order['submitted_at'] + 300, 'event': 'owner report', 'known': 'Original owner confirms the order was unauthorized.', 'rule': 'simulated confirmation'})
        messages.append({'time': engine.logical_time, 'text': message})
        state = {'time': engine.logical_time, 'budget': engine.remaining_budget,
                 'authenticated': engine.authenticated, 'address': ADDRESSES[engine.active_address_id],
                 'orders': orders, 'messages': sorted(messages, key=lambda m: m['time'])}
        # Freeze snapshots rather than sharing references with later outcomes.
        steps.append({'action': asdict(action), 'public': copy.deepcopy(public_view(state))})
    if not commands:
        state = {'time': 0, 'budget': 12, 'authenticated': False, 'address': 'Saved home', 'orders': [], 'messages': []}
    qualified = any(o['status'] == 'dispatched' and o['owner_report'] and o['address_id'] != 'address_home' for o in orders)
    loss = sum(LOSS_MINOR for o in orders if o['status'] == 'dispatched' and o['owner_report'])
    result = {'version': VERSION, 'policy': policy, 'actions': commands, 'steps': steps, 'state': state,
              'timeline': sorted(timeline, key=lambda e: e['time']), 'qualified': qualified, 'loss_minor': loss}
    result['hash'] = hashlib.sha256(canonical_json(result).encode()).hexdigest()
    return result


def recorded(name: str, policy: str = 'v1') -> dict:
    if name not in {'finding', 'apparent'}:
        raise ValueError('Unknown recording')
    return replay([{'kind': 'authenticate'}, {'kind': 'change_address', 'address': 'studio' if name == 'finding' else 'collect'},
                   {'kind': 'attempt_purchase'}, {'kind': 'advance_time', 'seconds': 120},
                   {'kind': 'advance_time', 'seconds': 180}], policy)


# Shared, deliberately constructed population: unique accounts, one order each.
# Every device is established; address ages are observed at checkout, not outcome-derived.
GROUPS = [
    ('Returning to saved home', 60, 150_000, False, 0),
    ('Moving home, high value', 10, 150_000, True, 0),
    ('Sending a gift, high value', 5, 150_000, True, 30),
    ('New address, small basket', 10, 30_000, True, 0),
    ('New address, later checkout', 15, 150_000, True, 120),
]


def population() -> list[dict]:
    return [{'account_id': f'legit-{group_index}-{i:02}', 'group': group, 'amount_minor': amount,
             'changed': changed, 'age': age, 'label': 'legitimate', 'history_orders': 8,
             'device_age_seconds': 10_000, 'prior_disputed_links': 0}
            for group_index, (group, count, amount, changed, age) in enumerate(GROUPS) for i in range(count)]


def population_decision(row: dict, policy: str) -> str:
    from app.defenders.rules import decide
    from app.engine.models import Address
    state = initial_state()
    state.authenticated = True
    state.logical_time = row['age']
    if row['changed']:
        state.addresses['new'] = Address('new', 'Unique legitimate destination', 0)
        state.active_address_id = 'new'
    action = Action('evaluation', ActionType.ATTEMPT_PURCHASE, state.logical_time,
                    {'device_id': state.trusted_device_id, 'address_id': state.active_address_id, 'amount_minor': row['amount_minor']})
    return decide(policy, state, action).decision.value


def evaluation(completion: int = 80, attacker_completion: int = 0) -> dict:
    if not 0 <= completion <= 100 or not 0 <= attacker_completion <= 100:
        raise ValueError('Completion rates must be percentages.')
    rows = population()
    policies = []
    for policy in POLICIES:
        evaluated = [row | {'decision': population_decision(row, policy)} for row in rows]
        challenges = sum(r['decision'] == 'challenge' for r in evaluated)
        declines = sum(r['decision'] == 'block' for r in evaluated)
        fraud = recorded('finding', policy)
        decision = fraud['state']['orders'][0]['decision']
        dispatches = 1 if decision == 'allow' else attacker_completion / 100 if decision == 'challenge' else 0
        # Sensitivity is an expected-outcome calculation, not an event replay.
        # Successful verification permits a fresh fulfillment path with an assumed
        # five-minute extra delay; it does not reuse the baseline dispatch event.
        policies.append({'policy': policy, 'customers': len(rows), 'legit_challenges': challenges,
                         'legit_declines': declines, 'expected_abandonments': round(challenges * (100 - completion) / 100, 2),
                         'expected_fraud_dispatches': dispatches, 'expected_fraud_loss_minor': round(dispatches * LOSS_MINOR),
                         'challenge_operations_minor': (challenges + (decision == 'challenge')) * 200,
                         'fulfillment_delay_minutes': 5 if challenges or decision == 'challenge' else 0, 'rows': evaluated,
                         'groups': [{'group': group, 'count': count, 'decision': next(r['decision'] for r in evaluated if r['group'] == group)} for group, count, *_ in GROUPS],
                         'replay': {'hash': fraud['hash'], 'status': fraud['state']['orders'][0]['status'], 'qualified': fraud['qualified']}})
    return {'version': VERSION, 'completion': completion, 'attacker_completion': attacker_completion, 'policies': policies}


def investigation() -> dict:
    import inspect
    from app.defenders.rules import decide
    good, apparent = recorded('finding'), recorded('apparent')
    return {'finding': good, 'apparent': apparent, 'control_source': inspect.getsource(decide),
            'records': [
                {'entity': 'acct_demo', 'history': '8 fulfilled orders; saved device and home established at t=-10000', 'available_at': 0},
                {'entity': 'Collection point 14', 'history': 'acct_prior_1 → confirmed dispute at t=-5000; acct_prior_2 → confirmed dispute at t=-2000', 'available_at': 30},
                {'entity': 'Studio 8', 'history': 'No prior account link in the synthetic reputation registry', 'available_at': 30},
                {'entity': 'NS-1042 / Studio 8', 'history': 'Owner denies purchase after dispatch', 'available_at': 300}],
            'analysis': {'formula': 'qualified = dispatched AND owner_report AND destination != saved_home',
                         'qualified_findings': int(good['qualified']) + int(apparent['qualified']),
                         'total_submitted': 2, 'realized_loss_minor': good['loss_minor'] + apparent['loss_minor']}}
