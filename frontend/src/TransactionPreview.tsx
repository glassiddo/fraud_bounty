import { useState } from 'react'
import { LoadState } from './Hunter'
import { type Recorded, usd, useResource } from './bountyClient'

export function TransactionPreview() {
 const { data, error, reload } = useResource<Recorded>('/recorded/finding')
 const [later, setLater] = useState(false)
 const view = data?.steps[later ? 3 : 2].public
 const order = view?.orders[0]
 return <div className="transaction-boundary">
  <section className="transaction-preview" aria-label="Recorded hunter transaction">
   <header><h2>Hunter sees</h2><span>RECORDED · SYNTHETIC</span></header>
   {!view || !order ? <LoadState error={error} reload={reload} /> : <>
    <div className="transaction-title"><h3>Order {order.id}</h3><span className="transaction-status" role="status">{order.status}</span></div>
    <dl className="transaction-fields"><div><dt>Order total</dt><dd>{usd(order.amount_minor)}</dd></div><div><dt>Destination</dt><dd>{order.address}</dd></div></dl>
    <h3 className="transaction-history-title">Activity visible to this account</h3>
    <ol className="transaction-history">{view.messages.map((message, i) => <li key={i}><time>+{message.time}s</time><span>{message.text}</span></li>)}</ol>
    <button className="b-primary" disabled={later} onClick={() => setLater(true)}>{later ? 'Later outcome shown' : 'Advance time · 120 seconds →'}</button>
    <p className="b-caption">{later ? 'Dispatch is observable. Whether this qualifies for a bounty is a separate validation.' : 'An accepted order is only the response so far. Check what happens next.'}</p>
   </>}
  </section>
  <aside className="transaction-private"><p className="b-kicker">OUTSIDE THE HUNTER VIEW</p><h2>Company retains</h2><p>Internal rules, risk scores and private investigation records.</p><p>The hunter receives the response, not the reason behind it.</p></aside>
  <p className="b-caption transaction-provenance">Scripted recording, not an agent discovery. This shows one short sequence; the proposed platform would support a wider search.</p>
 </div>
}
