import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TransactionPreview, RecordedTransactionPreview } from './TransactionPreview'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('combines products and accepts a custom recipient and address', () => {
 render(<TransactionPreview />)
 fireEvent.change(screen.getByRole('spinbutton', { name: 'Camera quantity' }), { target: { value: '1' } })
 fireEvent.change(screen.getByRole('spinbutton', { name: 'Headphones quantity' }), { target: { value: '2' } })
 fireEvent.change(screen.getByRole('textbox', { name: 'Recipient' }), { target: { value: 'Jordan Lee' } })
 fireEvent.change(screen.getByRole('textbox', { name: 'Delivery address' }), { target: { value: '9 New Street' } })
 const review = screen.getByRole('region', { name: 'Combination to test' })
 expect(review).toHaveTextContent('1 × Camera')
 expect(review).toHaveTextContent('2 × Headphones')
 expect(review).toHaveTextContent('$2,100')
 expect(review).toHaveTextContent('Jordan Lee')
 expect(review).toHaveTextContent('9 New Street')
})
it('shows only observed transaction feedback and advances the recording without changing an attempt', async () => {
 const view = { time: 0, budget: 6, authenticated: true, address: 'Studio 8', orders: [{ id: 'NS-1042', amount_minor: 150000, address: 'Studio 8', status: 'accepted' }], messages: [{ time: 0, text: 'Address saved.' }, { time: 0, text: 'Order accepted. Preparing for dispatch.' }] }
 vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ provenance: 'Scripted illustration; not agent-discovered.', steps: [0, 1, 2, 3].map(i => ({ action: { type: 'recorded', timestamp: 0 }, public: i < 3 ? view : { ...view, time: 120, orders: [{ ...view.orders[0], status: 'dispatched' }], messages: [...view.messages, { time: 120, text: 'Your parcel has been dispatched.' }] } })) }) }))
 localStorage.setItem('northstar-attempt', 'keep-this-attempt')
 render(<RecordedTransactionPreview />)
 fireEvent.click(await screen.findByRole('button', { name: /Save shipping address/ }))
 fireEvent.click(screen.getByRole('button', { name: /Place.*order/ }))
 expect(await screen.findByText('accepted')).toBeVisible()
 expect(screen.queryByText('Your parcel has been dispatched.')).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button', { name: /Advance time/ }))
 expect(screen.getByText('dispatched')).toBeVisible()
 expect(screen.getByText('Your parcel has been dispatched.')).toBeVisible()
 expect(fetch).toHaveBeenCalledTimes(1)
 expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/bounty/recorded/finding'), undefined)
 expect(localStorage.getItem('northstar-attempt')).toBe('keep-this-attempt')
})

it('starts a newly selected recording before checkout without retaining the previous outcome', async () => {
 const initial = { time: 0, budget: 11, authenticated: true, address: 'Saved home', orders: [], messages: [{ time: 0, text: 'Signed in.' }] }
 vi.stubGlobal('fetch', vi.fn(async (url: string) => {
  const address = url.endsWith('/apparent') ? 'Collection point 14' : 'Studio 8'
  const order = { id: 'NS-1042', amount_minor: 150000, address, status: 'accepted' }
  const views = [initial, { ...initial, address }, { ...initial, address, orders: [order] }, { ...initial, address, time: 120, orders: [{ ...order, status: address === 'Studio 8' ? 'dispatched' : 'cancelled' }] }]
  return { ok: true, json: async () => ({ provenance: 'Scripted', steps: views.map(publicView => ({ action: { type: 'recorded', timestamp: publicView.time }, public: publicView })) }) }
 }))
 render(<RecordedTransactionPreview />)
 fireEvent.click(await screen.findByRole('button', { name: /Save shipping address/ }))
 expect(screen.queryByText('accepted')).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button', { name: /Place.*order/ }))
 fireEvent.click(screen.getByRole('button', { name: /Advance time/ }))
 expect(screen.getByText('dispatched')).toBeVisible()
 fireEvent.change(screen.getByRole('combobox', { name: 'Destination to try' }), { target: { value: 'apparent' } })
 expect(screen.queryByText('dispatched')).not.toBeInTheDocument()
 fireEvent.click(await screen.findByRole('button', { name: /Save shipping address/ }))
 fireEvent.click(screen.getByRole('button', { name: /Place.*order/ }))
 expect(screen.getByText('accepted')).toBeVisible()
 fireEvent.click(screen.getByRole('button', { name: /Advance time/ }))
 expect(screen.getByText('cancelled')).toBeVisible()
 expect(screen.queryByText('dispatched')).not.toBeInTheDocument()
})

it('keeps a combined checkout draft available without the API or affecting a saved attempt', () => {
 const request = vi.fn(() => Promise.reject(Error('offline')))
 vi.stubGlobal('fetch', request)
 localStorage.setItem('northstar-attempt', 'existing-attempt')
 render(<TransactionPreview />)
 fireEvent.change(screen.getByRole('combobox', { name: 'Network / IP profile' }), { target: { value: '198.51.100.24 · Mobile' } })
 fireEvent.change(screen.getByRole('combobox', { name: 'Delivery method' }), { target: { value: 'Pickup' } })
 fireEvent.change(screen.getByRole('spinbutton', { name: 'Camera quantity' }), { target: { value: '0' } })
 fireEvent.change(screen.getByRole('spinbutton', { name: 'Headphones quantity' }), { target: { value: '2' } })
 const summary = screen.getByRole('region', { name: 'Combination to test' })
 expect(summary).toHaveTextContent('198.51.100.24 · Mobile')
 expect(screen.getByRole('textbox', { name: 'Pickup location' })).toHaveValue('')
 expect(summary).toHaveTextContent('2 × Headphones')
 expect(summary).toHaveTextContent('$600')
 expect(request).not.toHaveBeenCalled()
 expect(localStorage.getItem('northstar-attempt')).toBe('existing-attempt')
 fireEvent.change(screen.getByRole('spinbutton', { name: 'Camera quantity' }), { target: { value: '1' } })
 expect(screen.getByRole('region', { name: 'Combination to test' })).toHaveTextContent('$2,100')
})

it('clears the destination when switching delivery method', () => {
 render(<TransactionPreview />)
 expect(screen.getByRole('textbox', { name: 'Delivery address' })).toHaveValue('')
 fireEvent.change(screen.getByRole('combobox', { name: 'Delivery method' }), { target: { value: 'Pickup' } })
 expect(screen.getByRole('region', { name: 'Combination to test' })).not.toHaveTextContent('18 Willow Lane')
 expect(screen.queryByRole('textbox', { name: 'Delivery address' })).not.toBeInTheDocument()
 fireEvent.change(screen.getByRole('textbox', { name: 'Pickup location' }), { target: { value: 'Corner shop · 25 Market Street, Northbridge, NY 10004' } })
 const review = screen.getByRole('region', { name: 'Combination to test' })
 expect(review).toHaveTextContent('25 Market Street')
 expect(review).not.toHaveTextContent('18 Willow Lane')
 fireEvent.change(screen.getByRole('combobox', { name: 'Delivery method' }), { target: { value: 'Shipping' } })
 expect(screen.getByRole('textbox', { name: 'Delivery address' })).toHaveValue('')
})

it('recalculates the illustrative total when quantity changes', () => {
 render(<TransactionPreview />)
 fireEvent.change(screen.getByRole('spinbutton', { name: 'Camera quantity' }), { target: { value: '20' } })
 expect(screen.getByRole('spinbutton', { name: 'Camera quantity' })).toHaveValue(20)
 expect(screen.getByRole('region', { name: 'Combination to test' })).toHaveTextContent('$30,000')
})
