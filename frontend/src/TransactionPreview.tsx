import { useState } from 'react'
import { LoadState } from './Hunter'
import { type Recorded, usd, useResource } from './bountyClient'

const catalog = [
 { id: 'camera', name: 'Camera', price: 150000 },
 { id: 'headphones', name: 'Headphones', price: 30000 },
]
const checkoutChoices = {
 'Payment': ['Visa •••• 4242 · Alex Morgan · exp. 08/29', 'Mastercard •••• 5556 · Sam Patel · exp. 11/29'],
}
const shippingAddresses = ['18 Willow Lane, Apt 4, Northbridge, NY 10001', '72 Cedar Street, Apt 8, Northbridge, NY 10002']
const contextChoices = {
  'Account access': ['morgan_al@ex.test', 'sam.patel@ex.test'],
  'Network / IP profile': ['192.0.2.10 · Broadband', '198.51.100.24 · Mobile'],
  'Browser and cookie profile': ['Chrome · returning browser · cookie demo-A17', 'Firefox · fresh browser · cookie demo-B24'],
}

export function TransactionPreview() {
 const [quantities, setQuantities] = useState<Record<string, number>>({ camera: 0, headphones: 0 })
 const [recipient, setRecipient] = useState('')
 const cart = catalog.filter(item => quantities[item.id] > 0)
 const total = cart.reduce((sum, item) => sum + item.price * quantities[item.id], 0)
 const cartDescription = cart.map(item => `${quantities[item.id]} × ${item.name}`).join(' + ')
 const [deliveryMethod, setDeliveryMethod] = useState('')
 const [destination, setDestination] = useState('')
 const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(Object.keys({ ...checkoutChoices, ...contextChoices }).map(label => [label, ''])))
 function fields(choices: Record<string, string[]>) {
  return Object.entries(choices).map(([label, values]) => <label className="field" key={label}>{label}<select name={label} value={draft[label]} onChange={event => setDraft(previous => ({ ...previous, [label]: event.target.value }))}><option value="">Choose…</option>{values.map(value => <option key={value}>{value}</option>)}</select></label>)
 }
 return <div className="transaction-boundary checkout-boundary">
  <section className="transaction-preview" aria-label="Illustrative hunter checkout">
   <header><h2>Build an illustrative test combination</h2><span>DESIGN ILLUSTRATION</span></header>
   <p className="b-caption">Choose the inputs a hunter could combine. This illustration uses fictional data and does not run a fraud decision system.</p>
   <details className="test-context"><summary>What the hunter receives</summary>
    <p>Approved hunters would receive test credentials for accounts and their associated payment details.</p>
    <div className="b-table starting-accounts"><table aria-label="Supplied accounts and their data"><thead><tr><th scope="col">Provided data</th><th scope="col">Account 1</th><th scope="col">Account 2</th></tr></thead><tbody>
     <tr><th scope="row">Login</th><td>morgan_al@ex.test</td><td>sam.patel@ex.test</td></tr>
     <tr><th scope="row">Account status</th><td>Established account</td><td>New account</td></tr>
     <tr><th scope="row">Name</th><td>Alex Morgan</td><td>Sam Patel</td></tr>
     <tr><th scope="row">Address</th><td>{shippingAddresses[0]}</td><td>{shippingAddresses[1]}</td></tr>
     <tr><th scope="row">Card</th><td>{checkoutChoices.Payment[0]}</td><td>{checkoutChoices.Payment[1]}</td></tr>
    </tbody></table></div>
   </details>
   <form aria-label="Build a test combination" onSubmit={event => event.preventDefault()}>
    <fieldset className="test-context"><legend>Test setup outside checkout</legend><p className="b-caption"> These signals would come from the company’s usual collection mechanism. Hunters could inspect their own setup without knowing exactly which signals the company uses.</p><div className="checkout-fields">{fields(contextChoices)}</div></fieldset>
    <fieldset className="shop-catalog"><legend>Available products</legend>{catalog.map(item => <label className="field" key={item.id}><strong>{item.name}</strong><span className="product-price">{usd(item.price)} each</span><span>Quantity</span><input aria-label={`${item.name} quantity`} name={`${item.id}-quantity`} type="number" min="0" step="1" value={quantities[item.id]} onChange={event => { const quantity = Math.max(0, Math.trunc(Number(event.target.value)) || 0); setQuantities(previous => ({ ...previous, [item.id]: quantity })) }} /></label>)}</fieldset>
    <p className="cart-total">Cart: {cartDescription || 'Empty'} <strong>{usd(total)}</strong></p>
    <div className="checkout-fields"><label className="field">Recipient<input name="recipient" autoComplete="off" required value={recipient} onChange={event => { setRecipient(event.target.value) }} /></label>{fields(checkoutChoices)}
     <label className="field">Delivery method<select name="delivery-method" value={deliveryMethod} onChange={event => { const method = event.target.value; setDeliveryMethod(method); setDestination('') }}><option value="">Choose…</option><option>Shipping</option><option>Pickup</option></select></label>
     <label className="field">{deliveryMethod === 'Pickup' ? 'Pickup location' : 'Delivery address'}<input name="destination" autoComplete="off" required value={destination} onChange={event => { setDestination(event.target.value) }} /></label>
    </div>
    <p className="b-caption">Shipping and pickup have no fee in this illustration.</p>

   </form>
   <section className="combination-review" aria-label="Combination to test" aria-live="polite"><h3>Combination to test</h3><p>{cartDescription || 'No products selected'} · {usd(total)}</p><dl>{Object.entries({ 'Recipient': recipient, ...draft, 'Delivery method': deliveryMethod, [deliveryMethod === 'Pickup' ? 'Pickup location' : 'Delivery address']: destination }).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
  </section>
  <aside className="transaction-private" aria-label="Decision flow"><p className="b-kicker">DECISION FLOW</p><h2>From checkout to response</h2><h3>1 · Checkout input</h3><p>The platform sends the products, quantities, recipient, destination, payment token, delivery method, and calculated amount.</p><h3>2 · Background signals</h3><p>The company’s usual collection mechanism adds permitted connection, cookie, browser, device, and timing signals.</p><h3>3 · Company decision</h3><p>The decision system evaluates those inputs against earlier activity, linked entities, rules, and risk assessments. Its internal reasoning remains private.</p><h3>4 · Visible response</h3><p>The platform returns the order decision and later updates to the hunter, while preserving test history for subsequent attempts.</p></aside>
 </div>
}

export function RecordedTransactionPreview() {
 const [recording, setRecording] = useState('finding')
 return <div className="transaction-boundary">
  <section className="transaction-preview" aria-label="Recorded hunter transaction">
   <header><h2>Hunter actions & feedback</h2><span>RECORDED · SYNTHETIC</span></header>
   <p className="b-caption">Assumed starting access: signed in to someone else’s established account on a saved device, with an existing card. No access to the owner’s verification channel.</p>
   <label className="field">Destination to try<select name="recorded-destination" value={recording} onChange={event => setRecording(event.target.value)}><option value="finding">Studio 8</option><option value="apparent">Collection point 14</option></select></label>
   <RecordedActions key={recording} recording={recording} />
  </section>
  <aside className="transaction-private"><p className="b-kicker">OUTSIDE THE HUNTER VIEW</p><h2>Company retains</h2><p>Internal rules, risk scores and private investigation records.</p><p>The hunter receives the response, not the reason behind it.</p></aside>
  <p className="b-caption transaction-provenance">Two scripted recordings. Choosing a destination restarts the walkthrough; it does not create or reset a live attempt. Simulated seconds compress operational delays.</p>
 </div>
}

function RecordedActions({ recording }: { recording: string }) {
 const { data, error, reload } = useResource<Recorded>(`/recorded/${recording}`)
 const [step, setStep] = useState(0)
 const view = data?.steps[step].public
 if (!view) return <LoadState error={error} reload={reload} />
 const order = view.orders[0]
 const actions = ['Save shipping address →', 'Place $1,500 order →', 'Advance time · 120 seconds →', 'Later outcome shown']
 return <>
  {order ? <><div className="transaction-title"><h3>Order {order.id}</h3><span className="transaction-status" role="status">{order.status}</span></div>
   <dl className="transaction-fields"><div><dt>Order total</dt><dd>{usd(order.amount_minor)}</dd></div><div><dt>Destination</dt><dd>{order.address}</dd></div></dl></> : <p className="b-caption">Current shipping address: {view.address}. No order placed yet.</p>}
  <h3 className="transaction-history-title">Activity visible to this account</h3>
  <ol className="transaction-history" aria-live="polite">{view.messages.map((message, i) => <li key={i}><time>+{message.time}s</time><span>{message.text}</span></li>)}</ol>
  <button className="b-primary" disabled={step === 3} onClick={() => setStep(value => value + 1)}>{actions[step]}</button>
  {step === 2 && <p className="b-caption">An accepted order is only the response so far. Check what happens next.</p>}
  {step === 3 && <p className="b-caption">Would you vary the destination or timing next? Compare the other recording. This outcome alone does not establish bounty eligibility.</p>}
 </>
}
