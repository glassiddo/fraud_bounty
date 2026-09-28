import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BountyApp } from './BountyApp'

beforeEach(() => { localStorage.clear(); location.hash = ''; vi.stubGlobal('scrollTo', vi.fn()); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(Error('offline')))) })
afterEach(cleanup)
it('starts with the bounty without loading privileged information', () => {
 render(<BountyApp />)
 expect(screen.getByRole('heading', { name: 'Could bounty hunting work for fraud prevention?' })).toBeVisible()
 expect(fetch).not.toHaveBeenCalled()
})
it('removes the optional evidence and challenge entry points', () => {
 render(<BountyApp />)
 expect(screen.queryByRole('button', { name: 'Inspect one simulated finding' })).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('link', { name: /02 The bounty environment/ }))
 expect(screen.queryByRole('button', { name: 'Try the optional challenge' })).not.toBeInTheDocument()
 expect(fetch).not.toHaveBeenCalled()
})
it('guards direct privileged links and remembers informed exploration', () => {
 location.hash = '#responses'
 render(<BountyApp />)
 expect(screen.getByRole('heading', { name: 'What would the company learn?' })).toBeVisible()
 expect(fetch).not.toHaveBeenCalled()
})

it('can restore a saved attempt after a temporary API failure', async () => {
 localStorage.setItem('northstar-attempt', 'saved-id')
 location.hash = '#hunter'
 render(<BountyApp />)
 fireEvent.click(screen.getByRole('button', { name: 'Try the challenge ↗' }))
 const retry = await screen.findByRole('button', { name: 'Retry saved attempt' })
 vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id: 'saved-id', view: { time: 30, budget: 8, authenticated: true, address: 'Studio 8', orders: [], messages: [] } }) } as Response)
 fireEvent.click(retry)
 expect(await screen.findByText('8 / 12 credits left')).toBeVisible()
 expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/attempts/saved-id'), undefined)
})

it('keeps chapter navigation consistent after merging the introduction and company value', () => {
 render(<BountyApp />)
 fireEvent.click(screen.getByRole('link', { name: /Next: The bounty environment/ }))
 expect(location.hash).toBe('#invitation')
 expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
 expect(screen.getByRole('link', { name: /02 The bounty environment/ })).toHaveAttribute('aria-current', 'step')
 fireEvent.click(screen.getByRole('link', { name: /Previous/ }))
 expect(location.hash).toBe('#challenge')
 fireEvent.click(screen.getByRole('link', { name: /04 Privacy & realism/ }))
 expect(screen.queryByRole('button', { name: 'End of discussion' })).not.toBeInTheDocument()
})

it('opens the platform offline without the recording entry point', () => {
 location.hash = '#investigation'
 render(<BountyApp />)
 expect(screen.getByRole('form')).toBeVisible()
 expect(screen.queryByRole('button', { name: 'Open a recorded example of delayed outcomes' })).not.toBeInTheDocument()
 expect(fetch).not.toHaveBeenCalled()
})
