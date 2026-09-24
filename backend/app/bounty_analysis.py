"""Reproduce the portfolio's qualification and policy tables without the UI.

Run: py -3.12 -m app.bounty_analysis
"""
import json
from app.bounty import evaluation, investigation

if __name__ == '__main__':
    evidence = investigation()
    print(json.dumps({'analysis': evidence['analysis'],
                      'replays': {key: evidence[key]['hash'] for key in ('finding', 'apparent')},
                      'evaluation': evaluation()}, indent=2))
