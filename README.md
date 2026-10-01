# Could bounty hunting work for fraud prevention?

A thought exercise exploring whether authorized outside hunters could help fraud teams find unknown weaknesses. It presents a controlled test-shop concept, its privacy and operational constraints, and a small synthetic illustration.

Available in [https://fraudbounty.netlify.app/](https://fraudbounty.netlify.app/)

## Run locally

Requires Python 3.12 and Node.js 20+.

```powershell
./start-demo.ps1
```

The helper starts the API and frontend in the background. Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Logs are written to `.demo-logs/`.

For first-time setup:

```powershell
cd backend
py -3.12 -m pip install -e ".[dev]"
cd ..\frontend
npm ci
cd ..
./start-demo.ps1
```

## Checks

```powershell
cd backend
py -3.12 -m pytest -q -p no:cacheprovider
py -3.12 -m app.bounty_analysis
cd ..\frontend
npm test
npm run build
```

## Scope

Everything is synthetic. The broad bounty platform is a thought exercise, and the configurable checkout is a design illustration rather than a working fraud decision system. The local demonstration is not deployed or authenticated.
