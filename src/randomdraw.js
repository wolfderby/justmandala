import { PALETTES } from './palettes'

const TAU = Math.PI * 2
const point = (radius, angle) => [500 + Math.sin(angle) * radius, 500 - Math.cos(angle) * radius]
const move = (radius, angle) => ['M', ...point(radius, angle)]
const line = (radius, angle) => ['L', ...point(radius, angle)]
const curve = (r1, a1, r2, a2, r3, a3) => ['C', ...point(r1, a1), ...point(r2, a2), ...point(r3, a3)]

function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let t = state
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Build closed motifs in a resolution-independent space. Choose variation once
// per ring, so every petal keeps exact rotational symmetry at any canvas size.
export function createMandalaDesign({ symmetry = 12, style = 'lotus', seed = 18732 } = {}) {
  const count = Math.round(Math.min(50, Math.max(2, Number(symmetry) || 12)))
  const random = seededRandom(seed)
  const step = TAU / count
  const shapes = []
  const circle = (radius, fill = null, weight = 1.3, stroke = 0, x = 500, y = 500) => {
    shapes.push({ type: 'circle', x, y, radius, fill, weight, stroke })
  }
  const path = (commands, fill = null, weight = 1.4, stroke = 0) => {
    shapes.push({ type: 'path', commands, fill, weight, stroke })
  }
  const dots = (radius, amount, size, fill, phase = 0) => {
    for (let i = 0; i < amount; i++) {
      const [x, y] = point(radius, phase + TAU * i / amount)
      circle(size, fill, 0, null, x, y)
    }
  }
  const petal = (base, tip, halfAngle, angle, fill, weight = 1.5) => {
    if (style === 'geometry') {
      path([
        move(base, angle), line((base + tip) * 0.53, angle - halfAngle),
        line(tip, angle), line((base + tip) * 0.53, angle + halfAngle), ['Z'],
      ], fill, weight)
    } else {
      const fullness = style === 'rosette' ? 1.32 : 1
      path([
        move(base, angle),
        curve(base + (tip - base) * 0.3, angle - halfAngle * fullness,
          tip - (tip - base) * 0.12, angle - halfAngle * fullness, tip, angle),
        curve(tip - (tip - base) * 0.12, angle + halfAngle * fullness,
          base + (tip - base) * 0.3, angle + halfAngle * fullness, base, angle), ['Z'],
      ], fill, weight)
    }
  }
  const ringOfPetals = (base, tip, fill, phase, insetFill, width = 0.43) => {
    for (let i = 0; i < count; i++) {
      const angle = step * i + phase
      petal(base, tip, step * width, angle, fill, 1.7)
      petal(base + (tip - base) * 0.18, tip - (tip - base) * 0.12, step * width * 0.62, angle, insetFill, 0.9)
      if (tip - base > 65) path([move(base + (tip - base) * 0.34, angle), line(tip - (tip - base) * 0.25, angle)], null, 0.8, 0)
    }
  }

  const phase = random() > 0.5 ? step / 2 : 0
  const middlePhase = phase + (random() > 0.5 ? step / 2 : 0)
  const innerPhase = phase + (random() > 0.5 ? step / 2 : 0)
  const middleTip = 309 + random() * 18
  const innerTip = 200 + random() * 16
  const width = 0.32 + random() * 0.17
  const innerFill = random() > 0.65 ? 6 : 4

  // Alternate ornamental petals, quiet space, and beaded bands, working inward.
  circle(443, null, 0.9, 4)
  circle(438, null, 1.3)
  ringOfPetals(350, 427, 3, phase, 5, width)
  for (let i = 0; i < count; i++) {
    const angle = step * i + phase + step / 2
    petal(360, 415, step * 0.15, angle, 1, 1.1)
    const [x, y] = point(424, angle)
    circle(2.5, 4, 0, null, x, y)
  }
  circle(345, 5, 1.8)
  circle(333, 7, 1.1)
  dots(339, count * 3, 2.2, 4, phase)

  ringOfPetals(237, middleTip, 1, middlePhase, 3, width)
  for (let i = 0; i < count; i++) {
    const angle = step * i + middlePhase + step / 2
    petal(251, middleTip - 17, step * 0.17, angle, 5, 1)
    const [x, y] = point(307, angle)
    circle(2.2, 4, 0, null, x, y)
  }
  circle(231, 5, 1.5)
  circle(219, 7, 1.3)
  dots(225, count * 2, 2.4, 4, middlePhase)

  ringOfPetals(125, innerTip, innerFill, innerPhase, 5, width)
  for (let i = 0; i < count; i++) {
    const angle = step * i + innerPhase + step / 2
    petal(138, innerTip - 12, step * 0.19, angle, 3, 1.2)
  }
  circle(119, 5, 1.5)
  circle(107, 7, 1.3)
  dots(113, count * 2, 1.9, 4, phase)
  ringOfPetals(19, 99, 2, phase + step / 2, 5, 0.47)
  circle(26, 4, 1.7)
  circle(18, 0, 0)
  circle(7, 5, 0)

  return { symmetry: count, style, seed: seed >>> 0, shapes }
}

export function renderMandala(ctx, width, design, { palette = PALETTES[0].colors, colored = true, lineWeight = 1 } = {}) {
  if (!ctx || !width) return
  const colors = palette.length ? palette : PALETTES[0].colors
  const colorAt = index => colors[index % colors.length]
  ctx.save()
  ctx.setTransform(width / 1000, 0, 0, width / 1000, 0, 0)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 1000, 1000)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const shape of design.shapes) {
    ctx.beginPath()
    if (shape.type === 'circle') {
      ctx.arc(shape.x, shape.y, shape.radius, 0, TAU)
    } else {
      for (const [command, ...coords] of shape.commands) {
        if (command === 'M') ctx.moveTo(...coords)
        else if (command === 'L') ctx.lineTo(...coords)
        else if (command === 'C') ctx.bezierCurveTo(...coords)
        else if (command === 'Z') ctx.closePath()
      }
    }
    if (shape.fill !== null) {
      ctx.fillStyle = colored ? colorAt(shape.fill) : shape.weight === 0 ? colorAt(0) : '#FFFFFF'
      ctx.fill()
    }
    if (shape.weight > 0 && shape.stroke !== null) {
      ctx.strokeStyle = colorAt(colored ? shape.stroke : 0)
      ctx.lineWidth = shape.weight * lineWeight
      ctx.stroke()
    }
  }
  ctx.restore()
}

export function randomDraw(width, symmetry, brushSize, ctx, color, options = {}) {
  if (!ctx) return
  const design = createMandalaDesign({ symmetry, seed: Math.floor(Math.random() * 0xFFFFFFFF), ...options })
  renderMandala(ctx, width, design, { lineWeight: Math.max(0.7, Math.min(2, Number(brushSize) / 4)), ...options })
  return design
}
