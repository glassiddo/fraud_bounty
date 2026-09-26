import { useEffect, useRef, useState } from 'react'
import { type PublicView, type Recorded, request, useResource, usd } from './bountyClient'

export function LoadState({ error, reload }: { error: string; reload: () => void }) {
 return error ? <div role="alert" className="b-error">{error} <button onClick={reload}>Retry</button></div> : <p role="status">Loading the synthetic case…</p>
}
function CustomerView({ view }: { view: PublicView }) {
 return <div className="customer-view"><div className="console-top"><span>◈ FICTIONAL SHOP / CUSTOMER VIEW</span><span>t + {view.time}s</span></div><div className="console-body"><div className="status-row"><span>{view.authenticated ? 'Signed in' : 'Signed out'}</span><span>{view.budget} / 12 credits left</span></div><p>Ship to <strong>{view.address}</strong></p>{view.orders.map(order => <article className="order" key={order.id}><div><small>{order.id} · Field camera kit</small><strong>{usd(order.amount_minor)}</strong></div><span className={`b-badge ${order.status === 'dispatched' ? 'green' : ''}`}>{order.status}</span><p>{order.address}</p></article>)}<ol className="public-log" aria-label="Customer notifications">{view.messages.map((message, i) => <li key={i}><time>+{message.time}s</time><span>{message.text}</span></li>)}</ol></div></div>
}
export function Hunter({ informed }: { informed: boolean }) {
 const [mode, setMode] = useState<'recorded' | 'play'>('recorded')
 return <><div className="b-heading"><p className="b-kicker">02 / Hunter observations</p><h1>“Accepted” is where the story starts.</h1><p className="b-lead">Follow the customer-facing trail. The merchant’s private reasoning stays behind the next door.</p></div>{informed && <p className="b-notice">You have opened privileged material. Any subsequent play is informed exploration, not evidence of blind discovery.</p>}<div className="segmented" aria-label="Hunter mode"><button aria-pressed={mode === 'recorded'} onClick={() => setMode('recorded')}>Follow a recorded attempt</button><button aria-pressed={mode === 'play'} onClick={() => setMode('play')}>Try the challenge ↗</button></div>{mode === 'recorded' ? <Recording /> : <Play />}<p className="b-caption">Only customer responses and observable fulfillment updates appear here. Acceptance, dispatch, merchant harm, and reward qualification are separate events.</p></>
}
function Recording() {
 const [name, setName] = useState('finding'), [step, setStep] = useState(0)
 const { data, error, reload } = useResource<Recorded>(`/recorded/${name}`)
 return <div className="b-split"><div><p className="b-kicker">SCRIPTED WALKTHROUGH · NOT AGENT-DISCOVERED</p><h2>Two destinations. Follow what happens.</h2><p>Both recordings begin with access to an established account on its saved device. Neither includes access to the original owner’s verification channel.</p><label className="field">Recording<select value={name} onChange={e => { setName(e.target.value); setStep(0) }}><option value="finding">Attempt A · Studio 8</option><option value="apparent">Attempt B · Collection point 14</option></select></label><ol className="steps">{['Sign in', 'Change shipping address', 'Order the $1,500 kit', 'Advance time by 120 seconds', 'Advance time by 180 seconds'].map((label, i) => <li key={label} className={i <= step ? 'seen' : ''}><span>{i + 1}</span>{label}</li>)}</ol><button className="b-primary" disabled={!data || step === 4} onClick={() => setStep(i => i + 1)}>{step >= 2 && step < 4 ? 'Advance time →' : step === 4 ? 'Recording complete' : 'Next action →'}</button><button className="b-text" onClick={() => setStep(0)}>Rewind recording</button><p className="b-caption">Rewinding this authored illustration does not reset a playable attempt. Simulated seconds compress operational delays.</p></div>{data ? <CustomerView view={data.steps[step].public} /> : <LoadState error={error} reload={reload} />}</div>
}
function Play() {
 const [attempt, setAttempt] = useState<{ id: string; view: PublicView } | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false)
 const [address, setAddress] = useState('studio'), [seconds, setSeconds] = useState(120)
 const pending = useRef<{ key: string; body: Record<string, unknown> } | null>(null)
 async function restore() {
  const id = localStorage.getItem('northstar-attempt')
  if (!id) return
  setBusy(true); setError('')
  try { setAttempt(await request<{ id: string; view: PublicView }>(`/attempts/${id}`)) }
  catch (e) { setError((e as Error).message) }
  finally { setBusy(false) }
 }
 useEffect(() => { void restore() }, [])
 async function start() { setBusy(true); setError(''); try { const value = await request<{ id: string; view: PublicView }>('/attempts', {}); localStorage.setItem('northstar-attempt', value.id); setAttempt(value) } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }
 async function act(body: Record<string, unknown>) {
  if (!attempt) return
  setBusy(true); setError('')
  const signature = JSON.stringify(body)
  if (!pending.current || JSON.stringify(pending.current.body) !== signature) pending.current = { key: crypto.randomUUID(), body }
  try { const value = await request<{ id: string; view: PublicView }>(`/attempts/${attempt.id}/actions`, { ...body, request_id: pending.current.key }); setAttempt(value); pending.current = null } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
 }
 const view = attempt?.view
 return <div className="b-split"><div><p className="b-kicker">OPTIONAL · ONE PERSISTENT ATTEMPT</p><h2>Your approach, within the brief.</h2><p>12 credits, one $1,500 order, a 600-second horizon. Changes and time advances consume credits. State survives page reloads and API restarts; there is no in-attempt reset.</p>{error && <p className="b-error" role="alert">{error}{!view && localStorage.getItem('northstar-attempt') && <button disabled={busy} onClick={restore}>Retry saved attempt</button>}</p>}{!view ? <button className="b-primary" disabled={busy || !!localStorage.getItem('northstar-attempt')} onClick={start}>{busy ? 'Loading attempt…' : 'Start my attempt'}</button> : <div className="play-controls"><button disabled={busy || view.authenticated || view.budget < 1} onClick={() => act({ kind: 'authenticate' })}>Sign in · 1 credit</button><label className="field">Destination<select value={address} onChange={e => setAddress(e.target.value)}><option value="studio">Studio 8</option><option value="collect">Collection point 14</option></select></label><button disabled={busy || !view.authenticated || view.budget < 2} onClick={() => act({ kind: 'change_address', address })}>Save shipping address · 2 credits</button><button disabled={busy || !view.authenticated || view.budget < 3 || !!view.orders.length} onClick={() => act({ kind: 'attempt_purchase' })}>Place $1,500 order · 3 credits</button><label className="field">Advance simulated time<select value={seconds} onChange={e => setSeconds(Number(e.target.value))}>{[30, 60, 120, 180, 300].map(s => <option key={s} value={s}>{s} seconds</option>)}</select></label><button disabled={busy || !view.authenticated || view.budget < 1 || view.time + seconds > 600} onClick={() => act({ kind: 'advance_time', seconds })}>Advance time · 1 credit</button></div>}<p className="b-caption">You cannot complete an original-owner verification challenge. Reward validation is available only in the merchant perspective after you reveal it.</p></div>{view ? <CustomerView view={view} /> : <div className="b-card muted"><span className="b-large">12</span><h3>credits to investigate</h3><p>A saved device. An existing card. Two possible destinations. No internal rule explanations.</p></div>}</div>
}
