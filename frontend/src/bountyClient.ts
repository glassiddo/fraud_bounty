import { useEffect, useState } from 'react'
export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
export async function request<T>(path: string, body?: unknown): Promise<T> {
 const response = await fetch(`${API}/bounty${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
 if (!response.ok) {
  const error = await response.json().catch(() => ({}))
  throw Error(error.message ?? 'Request could not be completed.')
 }
 return response.json()
}
export function useResource<T>(path: string) {
 const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0)
 useEffect(() => { let live = true; setError(''); setData(null); request<T>(path).then(value => { if (live) setData(value) }).catch(() => { if (live) setError('Could not load the local API. Start the backend and retry.') }); return () => { live = false } }, [path, retry])
 return { data, error, reload: () => setRetry(n => n + 1) }
}
export const usd = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value / 100)
export type PublicView = { time: number; budget: number; authenticated: boolean; address: string; orders: { id: string; amount_minor: number; address: string; status: string }[]; messages: { time: number; text: string }[] }
export type Recorded = { provenance: string; steps: { action: { type: string; timestamp: number }; public: PublicView }[] }
export type Run = { hash: string; qualified: boolean; loss_minor: number; timeline: { time: number; event: string; known: string; rule: string }[]; state: PublicView }
export type Investigation = { finding: Run; apparent: Run; control_source: string; records: { entity: string; history: string; available_at: number }[]; analysis: { formula: string; qualified_findings: number; total_submitted: number; realized_loss_minor: number } }
export type Policy = { policy: string; customers: number; legit_challenges: number; legit_declines: number; expected_abandonments: number; expected_fraud_dispatches: number; expected_fraud_loss_minor: number; challenge_operations_minor: number; fulfillment_delay_minutes: number; groups: { group: string; count: number; decision: string }[]; rows: unknown[]; replay: { hash: string; status: string; qualified: boolean } }
export type Evaluation = { policies: Policy[] }
