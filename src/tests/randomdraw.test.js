import { createMandalaDesign, randomDraw, renderMandala } from '../randomdraw'
import { PALETTES, parsePalette } from '../palettes'

const rotate = (x, y, angle) => [
  500 + (x - 500) * Math.cos(angle) - (y - 500) * Math.sin(angle),
  500 + (x - 500) * Math.sin(angle) + (y - 500) * Math.cos(angle),
].map(value => Number(value.toFixed(3)))

function signature(shape, angle = 0) {
  if (shape.type === 'circle') return JSON.stringify([shape.type, ...rotate(shape.x, shape.y, angle), shape.radius, shape.fill])
  return JSON.stringify([shape.fill, shape.weight, shape.commands.map(([command, ...coords]) => {
    const transformed = []
    for (let i = 0; i < coords.length; i += 2) transformed.push(...rotate(coords[i], coords[i + 1], angle))
    return [command, ...transformed]
  })])
}

describe('mandala composition', () => {
  test('recreates a shared seed and produces different compositions for new seeds', () => {
    const first = createMandalaDesign({ seed: 42 })
    expect(createMandalaDesign({ seed: 42 })).toEqual(first)
    expect(createMandalaDesign({ seed: 43 }).shapes).not.toEqual(first.shapes)
  })

  test.each(['lotus', 'rosette', 'geometry'])('%s preserves rotational symmetry, closed fills, and a clear margin', style => {
    for (const symmetry of [2, 3, 12, 50]) {
      const design = createMandalaDesign({ style, symmetry, seed: 810 })
      const originals = new Set(design.shapes.map(shape => signature(shape)))
      for (const shape of design.shapes) {
        expect(originals.has(signature(shape, Math.PI * 2 / symmetry))).toBe(true)
        if (shape.type === 'circle') {
          expect(Math.hypot(shape.x - 500, shape.y - 500) + shape.radius).toBeLessThan(450)
        } else {
          if (shape.fill !== null) expect(shape.commands.at(-1)).toEqual(['Z'])
          for (const [, ...coords] of shape.commands) {
            for (const coordinate of coords) {
              expect(Number.isFinite(coordinate)).toBe(true)
              expect(coordinate).toBeGreaterThan(50)
              expect(coordinate).toBeLessThan(950)
            }
          }
        }
      }
    }
  })

  test('distinguishes curved florals from angular geometric patterns', () => {
    const lotus = createMandalaDesign({style: 'lotus'})
    const rosette = createMandalaDesign({style: 'rosette'})
    const geometric = createMandalaDesign({style: 'geometry'})
    expect(lotus.shapes).not.toEqual(rosette.shapes)
    expect(lotus.shapes.some(s => s.commands?.some(c => c[0] === 'C'))).toBe(true)
    expect(geometric.shapes.some(s => s.commands?.some(c => c[0] === 'C'))).toBe(false)
  })
})

describe('rendering', () => {
  const mockContext = () => {
    const fills = []
    const ctx = { fills, save: jest.fn(), restore: jest.fn(), setTransform: jest.fn(), fillRect: jest.fn(), beginPath: jest.fn(), arc: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), bezierCurveTo: jest.fn(), closePath: jest.fn(), stroke: jest.fn() }
    ctx.fill = () => fills.push(ctx.fillStyle)
    return ctx
  }

  test('scales the same composition for export and restores the drawing context', () => {
    const ctx = mockContext()
    renderMandala(ctx, 1200, createMandalaDesign())
    expect(ctx.setTransform).toHaveBeenCalledWith(1.2, 0, 0, 1.2, 0, 0)
    expect(ctx.restore).toHaveBeenCalledTimes(1)
    expect(new Set(ctx.fills).size).toBeGreaterThan(3)
  })

  test('leaves white interiors in line art, ready for coloring', () => {
    const ctx = mockContext()
    renderMandala(ctx, 600, createMandalaDesign(), { colored: false })
    expect(new Set(ctx.fills)).toEqual(new Set(['#FFFFFF', PALETTES[0].colors[0]]))
  })

  test('keeps the randomDraw entry point usable by zoom wrappers', () => {
    const ctx = mockContext()
    const result = randomDraw(400, 16, 4, ctx, 'purple')
    expect(result.symmetry).toBe(16)
    expect(ctx.restore).toHaveBeenCalled()
    expect(() => randomDraw(400, 16, 4, null, 'purple')).not.toThrow()
  })
})

describe('shared palettes', () => {
  test('reads legacy encoded palettes and safely handles malformed links', () => {
    const colors = ['#123456', '#abc']
    expect(parsePalette(encodeURIComponent(JSON.stringify(colors)))).toEqual(colors)
    expect(parsePalette(JSON.stringify(colors))).toEqual(colors)
    expect(parsePalette('invalid%')).toEqual(PALETTES[0].colors)
    expect(parsePalette('["oops",null]')).toEqual(PALETTES[0].colors)
  })
})
