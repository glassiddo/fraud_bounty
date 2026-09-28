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
const pickupLocations = ['Parcel locker 14 · 6 Station Road, Northbridge, NY 10003', 'Corner shop · 25 Market Street, Northbridge, NY 10004']
const contextChoices = {
  'Account access': ['morgan_al@example.test · established account', 'sam.patel@example.test · new account'],
  'Network / IP profile': ['192.0.2.10 · Example Broadband · profile A', '198.51.100.24 · Example Mobile · profile B'],
  'Browser and cookie profile': ['Chrome · returning browser · cookie demo-A17', 'Firefox · fresh browser · cookie demo-B24'],
}

export function TransactionPreview() {
 const [quantities, setQuantities] = useState<Record<string, number>>({ camera: 1, headphones: 0 })
 const [recipient, setRecipient] = useState('Alex Morgan')
 const cart = catalog.filter(item => quantities[item.id] > 0)
 const total = cart.reduce((sum, item) => sum + item.price * quantities[item.id], 0)
 const cartDescription = cart.map(item => `${quantities[item.id]} × ${item.name}`).join(' + ')
 const [deliveryMethod, setDeliveryMethod] = useState('Shipping')
 const [destination, setDestination] = useState(shippingAddresses[0])
 const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries({ ...checkoutChoices, ...contextChoices }).map(([label, values]) => [label, values[0]])))
 const [reviewed, setReviewed] = useState(false)
 function fields(choices: Record<string, string[]>) {
  return Object.entries(choices).map(([label, values]) => <label className="field" key={label}>{label}<select name={label} value={draft[label]} onChange={event => { setDraft(previous => ({ ...previous, [label]: event.target.value })); setReviewed(false) }}>{values.map(value => <option key={value}>{value}</option>)}</select></label>)
 }
 return <div className="transaction-boundary checkout-boundary">
  <section className="transaction-preview" aria-label="Illustrative hunter checkout">
   <section className="test-context" aria-label="Supplied test resources">
    <p className="b-kicker">WHAT THE HUNTER RECEIVES</p><h2>Your starting data: two test accounts</h2>
    <p>Approved hunters receive test credentials for both accounts and their associated payment details.</p>
    <div className="b-table starting-accounts"><table aria-label="Supplied accounts and their data"><thead><tr><th scope="col">Provided data</th><th scope="col">Account 1 · Alex Morgan</th><th scope="col">Account 2 · Sam Patel</th></tr></thead><tbody>
     <tr><th scope="row">Login</th><td>morgan_al@example.test</td><td>sam.patel@example.test</td></tr>
     <tr><th scope="row">Account status</th><td>Established account</td><td>New account</td></tr>
     <tr><th scope="row">Usual recipient</th><td>Alex Morgan</td><td>Sam Patel</td></tr>
     <tr><th scope="row">Saved address</th><td>{shippingAddresses[0]}</td><td>{shippingAddresses[1]}</td></tr>
     <tr><th scope="row">Available card</th><td>{checkoutChoices.Payment[0]}</td><td>{checkoutChoices.Payment[1]}</td></tr>
    </tbody></table></div>
   </section>
   <form aria-label="Build a test combination" onSubmit={event => { event.preventDefault(); setReviewed(true) }}>
    <fieldset className="test-context"><legend>Test setup outside checkout</legend><p className="b-caption">In the proposed environment, these signals would come from the connection and the company’s usual browser collection mechanism. Hunters could inspect their own setup without knowing exactly which signals the company uses.</p><div className="checkout-fields">{fields(contextChoices)}</div></fieldset>
    <header><h2>A small test shop</h2><span>DESIGN ILLUSTRATION</span></header>
    <p className="b-caption">This is an illustrative prototype using fictional data; it does not run a fraud decision system. Review test checkout summarizes your choices.</p>
    <fieldset className="shop-catalog"><legend>Available products</legend>{catalog.map(item => <label className="field" key={item.id}><strong>{item.name}</strong><span className="product-price">{usd(item.price)} each</span><span>Quantity</span><input aria-label={`${item.name} quantity`} name={`${item.id}-quantity`} type="number" min="0" step="1" value={quantities[item.id]} onChange={event => { const quantity = Math.max(0, Math.trunc(Number(event.target.value)) || 0); setQuantities(previous => ({ ...previous, [item.id]: quantity })); setReviewed(false) }} /></label>)}</fieldset>
    <p className="cart-total">Cart: {cartDescription || 'Empty'} <strong>{usd(total)}</strong></p>
    <div className="checkout-fields"><label className="field">Recipient<input name="recipient" autoComplete="off" required value={recipient} onChange={event => { setRecipient(event.target.value); setReviewed(false) }} /></label>{fields(checkoutChoices)}
     <label className="field">Delivery method<select value={deliveryMethod} onChange={event => { const method = event.target.value; setDeliveryMethod(method); setDestination(method === 'Shipping' ? shippingAddresses[0] : pickupLocations[0]); setReviewed(false) }}><option>Shipping</option><option>Pickup</option></select></label>
     <label className="field">{deliveryMethod === 'Shipping' ? 'Delivery address' : 'Pickup location'}<input name="destination" autoComplete="off" required value={destination} onChange={event => { setDestination(event.target.value); setReviewed(false) }} /></label>
    </div>
    <p className="b-caption">Shipping and pickup have no fee in this illustration.</p>

    <button className="b-primary" type="submit" disabled={total === 0}>Review test checkout</button>
   </form>
   {reviewed && <section className="combination-review" aria-label="Combination to test" aria-live="polite"><h3>Checkout and associated context</h3><p>{cartDescription} · {usd(total)}</p><dl>{Object.entries({ 'Recipient': recipient, ...draft, 'Delivery method': deliveryMethod, [deliveryMethod === 'Shipping' ? 'Delivery address' : 'Pickup location']: destination }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>The platform would record the attempt and pass the agreed signals to the company’s decision system. The website would show the customer response; the company would retain the decision record.</p></section>}
  </section>
  <aside className="transaction-private"><p className="b-kicker">BEHIND THE WEBSITE</p><h2>Platform and company</h2><h3>The platform records</h3><p>Products, quantities, recipient, destination, payment token, and delivery method. The shop server calculates the amount.</p><h3>It collects agreed background signals</h3><p>The company or fraud provider’s collection mechanism could capture connection details, cookies, browser/device signals, and activity timestamps, as on its regular checkout website.</p><h3>The company’s system evaluates</h3><p>The transaction and permitted signals alongside earlier activity, linked entities, rules, and risk assessments. Broader associations and internal reasoning remain private.</p><h3>The platform returns the response</h3><p>The hunter sees the order response and later updates. The platform maintains the test history through the agreed integration so subsequent decisions reflect earlier attempts.</p></aside>
 </div>
}

export function RecordedTransactionPreview() {
 const [recording, setRecording] = useState('finding')
 return <div className="transaction-boundary">
  <section className="transaction-preview" aria-label="Recorded hunter transaction">
   <header><h2>Hunter actions & feedback</h2><span>RECORDED · SYNTHETIC</span></header>
   <p className="b-caption">Assumed starting access: signed in to someone else’s established account on a saved device, with an existing card. No access to the owner’s verification channel.</p>
   <label className="field">Destination to try<select value={recording} onChange={event => setRecording(event.target.value)}><option value="finding">Studio 8</option><option value="apparent">Collection point 14</option></select></label>
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
