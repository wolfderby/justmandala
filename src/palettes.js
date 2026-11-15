export const PALETTES = [
  {
    name: 'Botanical',
    colors: ['#244C46', '#507D70', '#91AF99', '#DCE4D2', '#C8A363', '#F1E4CC', '#BF8065', '#FFFFFF'],
  },
  {
    name: 'Terracotta',
    colors: ['#633F36', '#AA6550', '#D29A79', '#F0D8C3', '#BD994E', '#F6EBDD', '#7C8D73', '#FFFFFF'],
  },
  {
    name: 'Indigo',
    colors: ['#283A5B', '#526D96', '#A0B8CB', '#DEE8ED', '#BD9C62', '#F1E7D3', '#8D789A', '#FFFFFF'],
  },
  {
    name: 'Rosewood',
    colors: ['#583A4C', '#926479', '#C39BA7', '#EDDADE', '#B69A64', '#F4E9D9', '#7C9184', '#FFFFFF'],
  },
]

// Shared URLs can contain either JSON or an encoded JSON string.
export function parsePalette(value, fallback = PALETTES[0].colors) {
  try {
    let decoded = value
    for (let i = 0; i < 3 && typeof decoded === 'string'; i++) {
      if (decoded.startsWith('%')) decoded = decodeURIComponent(decoded)
      else decoded = JSON.parse(decoded)
    }
    if (Array.isArray(decoded)) {
      const colors = decoded.filter(color => typeof color === 'string' && /^#([\da-f]{3}|[\da-f]{6})$/i.test(color))
      if (colors.length) return colors.slice(0, 25)
    }
  } catch {
    // A malformed link should still open a usable studio.
  }
  return [...fallback]
}
