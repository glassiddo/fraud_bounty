import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TransactionPreview } from './TransactionPreview'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('shows only observed transaction feedback and advances the recording without changing an attempt', async () => {
 const view = { time: 0, budget: 6, authenticated: true, address: 'Studio 8', orders: [{ id: 'NS-1042', amount_minor: 150000, address: 'Studio 8', status: 'accepted' }], messages: [{ time: 0, text: 'Address saved.' }, { time: 0, text: 'Order accepted. Preparing for dispatch.' }] }
 vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ provenance: 'Scripted illustration; not agent-discovered.', steps: [0, 1, 2, 3].map(i => ({ action: { type: 'recorded', timestamp: 0 }, public: i < 3 ? view : { ...view, time: 120, orders: [{ ...view.orders[0], status: 'dispatched' }], messages: [...view.messages, { time: 120, text: 'Your parcel has been dispatched.' }] } })) }) }))
 localStorage.setItem('northstar-attempt', 'keep-this-attempt')
 render(<TransactionPreview />)
 expect(await screen.findByText('accepted')).toBeVisible()
 expect(screen.queryByText('Your parcel has been dispatched.')).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button', { name: /Advance time/ }))
 expect(screen.getByText('dispatched')).toBeVisible()
 expect(screen.getByText('Your parcel has been dispatched.')).toBeVisible()
 expect(fetch).toHaveBeenCalledTimes(1)
 expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/bounty/recorded/finding'), undefined)
 expect(localStorage.getItem('northstar-attempt')).toBe('keep-this-attempt')
})
