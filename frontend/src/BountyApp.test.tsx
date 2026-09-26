import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BountyApp } from './BountyApp'

beforeEach(() => { localStorage.clear(); location.hash = ''; vi.stubGlobal('scrollTo', vi.fn()); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(Error('offline')))) })
afterEach(cleanup)
it('starts with the bounty without loading privileged information', () => {
 render(<BountyApp />)
 expect(screen.getByRole('heading', { name: 'Could bounty hunting work for fraud prevention?' })).toBeVisible()
 expect(fetch).not.toHaveBeenCalled()
})
it('requires an explicit reveal before fetching merchant evidence', async () => {
 render(<BountyApp />)
 fireEvent.click(screen.getByRole('button', { name: /04 Company value/ }))
 fireEvent.click(screen.getByRole('button', { name: 'Inspect one simulated finding' }))
 expect(fetch).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button', { name: 'Reveal merchant evidence' }))
 await waitFor(() => expect(fetch).toHaveBeenCalled())
 expect(localStorage.getItem('northstar-informed')).toBe('yes')
 expect(await screen.findByRole('alert')).toHaveTextContent('Could not load')
})

it('keeps the main story short and the playable details optional', () => {
 render(<BountyApp />)
 expect(screen.getByRole('navigation', { name: 'Case chapters' }).querySelectorAll('button')).toHaveLength(5)
 expect(screen.queryByText('NORTHSTAR')).not.toBeInTheDocument()
 expect(screen.queryByText(/12 action credits/)).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button', { name: /02 What hunters find/ }))
 expect(screen.getByRole('button', { name: 'Try the optional challenge' })).toBeVisible()
 expect(screen.queryByRole('button', { name: 'Start my attempt' })).not.toBeInTheDocument()
})
it('guards direct privileged links and remembers informed exploration', () => {
 location.hash = '#responses'
 render(<BountyApp />)
 expect(screen.getByRole('heading', { name: 'Find gaps the company has not tested.' })).toBeVisible()
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

it('opens with the AI hypothesis without branding or reading-time labels', () => {
 render(<BountyApp />)
 expect(screen.queryByRole('banner')).not.toBeInTheDocument()
 expect(screen.queryByText(/minute|reading time/i)).not.toBeInTheDocument()
 expect(screen.getByText(/If AI makes root-cause analysis easier/)).toBeVisible()
})

it('explains the platform boundary without loading privileged evidence', () => {
 location.hash = '#investigation'
 render(<BountyApp />)
 expect(screen.getByRole('heading', { name: 'What should the hunter be able to see?' })).toBeVisible()
 expect(screen.getByText('Hunter sees')).toBeVisible()
 expect(screen.getByText('Company retains')).toBeVisible()
 expect(fetch).toHaveBeenCalledTimes(1)
 expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/bounty/recorded/finding'), undefined)
})
