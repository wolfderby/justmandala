import { MandalaLib } from './mandalalibraries'
import { ColorChooser } from './ColorChooser'
import { autoFillWrap, randomDrawWrap } from './zoom'
import { PALETTES } from './palettes'
import { StudioIcon } from './StudioIcon'

export function MandalaControls({ slider1, handleSlider1Change, slider2, handleSlider2Change, slider3, handleSlider3Change, myLightDark, myPalette,
  setMyPalette, setCurrentColor, toastId, resetCanvas, ctxRef, color, width, radioValue, handleRadioChange, handleMandalaFileInput, fileInputRef,
  canvasRef, undoRef, fillOption, handleTesselate, colors, setColorHelper, colorHelper, selectedColor, setSelectedColor, isZoomRef, zoomCanvasRef, quxRef, quyRef,
  onGenerate, onBeforeFill, designStyle = 'lotus', onStyleChange, finish = 'color', onFinishChange, paletteName = 'Botanical', onPalettePreset }) {

  const generate = () => {
    if (onGenerate) return onGenerate()
    if (!isZoomRef.current) undoRef.current = canvasRef.current.toDataURL('image/png')
    randomDrawWrap(width, slider1, slider2, ctxRef, color, isZoomRef, zoomCanvasRef, quxRef, quyRef)
  }
  const fill = () => {
    if (onBeforeFill) onBeforeFill()
    else if (!isZoomRef.current) undoRef.current = canvasRef.current.toDataURL('image/png')
    autoFillWrap(ctxRef, width, myPalette, slider1, slider3, radioValue, isZoomRef, zoomCanvasRef, quxRef, quyRef)
  }

  return <>
    <div className="panel-heading"><span className="eyebrow">MAKE IT YOURS</span><span className="panel-number">01 — ∞</span></div>
    <div className="control-section">
      <h2>Choose a pattern</h2>
      <div className="pattern-options" role="group" aria-label="Pattern style">
        {[['lotus', 'Lotus'], ['rosette', 'Rosette'], ['geometry', 'Geometric']].map(([value, label]) => <button type="button" key={value} onClick={() => onStyleChange?.(value)} className={`pattern-option ${designStyle === value ? 'is-selected' : ''}`} aria-pressed={designStyle === value}><StudioIcon name={value} size={29} /><span>{label}</span></button>)}
      </div>
    </div>
    <div className="control-section palette-section">
      <div className="section-label"><h2>Set the mood</h2><span>{paletteName}</span></div>
      <div className="palette-options" role="group" aria-label="Color palettes">
        {PALETTES.map(palette => <button type="button" key={palette.name} className={`palette-option ${palette.name === paletteName ? 'is-selected' : ''}`} aria-label={`${palette.name} palette`} aria-pressed={palette.name === paletteName} onClick={() => onPalettePreset?.(palette)}><span className="palette-preview">{palette.colors.slice(0, 6).map(color => <span key={color} style={{ background: color }} />)}</span><span>{palette.name}</span></button>)}
      </div>
    </div>
    <div className="control-section symmetry-section">
      <div className="section-label"><label htmlFor="slider1">Symmetry <span className="sr-only">Degree</span></label><span className="range-value">{slider1}<small>fold</small></span></div>
      <input type="range" id="slider1" min="2" max="50" value={slider1} onChange={handleSlider1Change} style={{ '--range-progress': `${(slider1 - 2) / 48 * 100}%` }} />
      <div className="range-captions"><span>Simple</span><span>Intricate</span></div>
    </div>
    <div className="finish-options" role="group" aria-label="Artwork finish">
      <button type="button" className={finish === 'color' ? 'is-selected' : ''} aria-pressed={finish === 'color'} onClick={() => onFinishChange?.('color')}><span className="color-dot" />Full color</button>
      <button type="button" className={finish === 'line' ? 'is-selected' : ''} aria-pressed={finish === 'line'} onClick={() => onFinishChange?.('line')}><span className="line-dot" />Line art</button>
    </div>
    <button type="button" className="button button-generate" onClick={generate}><StudioIcon name="sparkle" />Generate mandala<StudioIcon name="arrow" size={17} /></button>
    <p className="generate-note">A new possibility, every time.</p>

    <details className="drawing-details">
      <summary>Add your own touch<span>+</span></summary>
      <div className="detail-content">
        <p className="detail-intro">Draw on the canvas, or switch to Fill above. Every stroke finds its symmetry.</p>
        <div className="section-label"><label htmlFor="slider2">Brush Size</label><span className="range-value">{slider2}<small>px</small></span></div>
        <input type="range" id="slider2" min="2" max="24" value={slider2} onChange={handleSlider2Change} />
        <ColorChooser myLightDark={myLightDark} myPalette={myPalette} setMyPalette={setMyPalette} setCurrentColor={setCurrentColor} skipPalButton
          handleFileInput={event => MandalaLib.handleFileInput(event, toastId, myPalette, setMyPalette, myLightDark)} colors={colors}
          colorHelper={colorHelper} setColorHelper={setColorHelper} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
        <label className="field-label" htmlFor="fill-behavior">Fill behavior</label>
        <select id="fill-behavior" value={fillOption} onChange={event => handleRadioChange(event.target.value)}>
          <option value="fillAll">Color all symmetrical</option><option value="fillHalf">Color every other symmetrical</option><option value="fillOne">Color One</option>
        </select>
        <div className="section-label repeat-label"><label htmlFor="slider3">Auto Fill Pattern Repeat</label><span className="range-value">{slider3}</span></div>
        <input type="range" id="slider3" min="2" max="25" value={slider3} onChange={handleSlider3Change} />
        <button type="button" className="button button-secondary" onClick={fill}>Automatically Fill Areas</button>
        <p className="field-note">Try this with line art. Zoom in to refine a detail; click again to zoom out.</p>
      </div>
    </details>
    <details className="drawing-details file-details">
      <summary>A fresh start<span>+</span></summary>
      <div className="detail-content"><div className="secondary-actions"><button type="button" className="button button-secondary" onClick={resetCanvas}><StudioIcon name="reset" size={15} />Reset Canvas</button><button type="button" className="button button-secondary" onClick={handleTesselate}>Tessellate</button></div>
        <label className="file-label" htmlFor="mandala-file">Reload a saved PNG Mandala</label><input id="mandala-file" accept="image/png" onChange={handleMandalaFileInput} ref={fileInputRef} type="file" />
      </div>
    </details>
  </>
}
