import { describe, expect, it } from 'vitest'
import { money, percent } from './format'
describe('formatting',()=>{it('formats money and percentages',()=>{expect(money(150000)).toBe('$1,500');expect(money(-10000)).toBe('-$100');expect(percent(.375)).toBe('38%')})})
