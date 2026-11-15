import { useEffect, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import { parsePalette } from './palettes'

function resetPalette(colors, setMyPalette) {
  setMyPalette(encodeURIComponent(JSON.stringify(colors.current)))
}

export function ColorChooser({ myPalette, setMyPalette, handleFileInput, setCurrentColor, skipPalButton, colors, colorHelper,
  setColorHelper, selectedColor, setSelectedColor }) {
  const fileInputRef = useRef(null)

  useEffect(() => {
    const next = parsePalette(myPalette, colors.current)
    if (next.join() !== colors.current.join()) {
      colors.current = next
      setColorHelper(next)
      const index = Math.min(selectedColor, next.length - 1)
      setSelectedColor(index)
      setCurrentColor?.(next[index])
    }
  }, [myPalette])

  const newSelectColor = index => {
    setSelectedColor(index)
    setCurrentColor?.(colors.current[index])
  }

  return <div className="color-chooser">
    <p className="field-label">Your drawing colors</p>
    <div className="color-grid" role="group" aria-label="Drawing colors">
      {colorHelper.map((color, index) => <button type="button" key={index} aria-label={`Select color ${index + 1}: ${color}`} aria-pressed={index === selectedColor} title={color} onClick={() => newSelectColor(index)} className={`color-swatch ${index === selectedColor ? 'is-selected' : ''}`} style={{ backgroundColor: color }} />)}
    </div>
    <details className="color-editor"><summary>Fine-tune a color<code>{colorHelper[selectedColor]}</code></summary>
      <HexColorPicker data-testid="color-picker" color={colorHelper[selectedColor]} onChange={newColor => updateColor(selectedColor, newColor, colors, setColorHelper, setCurrentColor, skipPalButton, setMyPalette)} />
    </details>
    {!skipPalButton && <button type="button" className="button button-secondary" onClick={() => resetPalette(colors, setMyPalette)}>Update Palette</button>}
    <label className="file-label" htmlFor="palette-file">Choose Colors from a file</label>
    <input id="palette-file" accept="image/jpeg,image/png" onChange={handleFileInput} ref={fileInputRef} type="file" />
  </div>
}

export function updateColor(index, newColor, colors, setColorHelper, setCurrentColor, skipPalButton, setMyPalette) {
  colors.current = colors.current.map((color, i) => i === index ? newColor : color)
  setColorHelper([...colors.current])
  setCurrentColor?.(newColor)
  if (skipPalButton) resetPalette(colors, setMyPalette)
}
