import { useEffect, useRef, useState } from 'react'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import * as d3 from 'd3'
import drop from './drop'
import { zoom, fillWrap, drawWrap } from './zoom'
import { createTessel } from './tessel'
import { getMandalaHelpers } from './getlocalcoordinates'
import { MandalaControls } from './MandalaControls'
import { createGrid } from './creategrid'
import { createMandalaDesign, renderMandala } from './randomdraw'
import { PALETTES, parsePalette } from './palettes'
import { downloadMandala } from './downloadmandala'
import { StudioIcon } from './StudioIcon'
import './App.css'

const numberParam = (min, max, fallback) => withDefault({
  encode: value => String(value),
  decode: value => {
    if (value == null) return fallback
    const n = Number(value)
    return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n))) : fallback
  },
}, fallback)
const choiceParam = (choices, fallback) => withDefault({
  encode: value => value,
  decode: value => choices.includes(value) ? value : fallback,
}, fallback)

const WIDTH = 1200
const cursors = { draw: 'crosshair', fill: "url('/fill.png') 1 24, crosshair", drop: "url('/dropper.png') 6 26, crosshair", zoom: 'zoom-in' }

function JustMandala() {
  const chartRef = useRef(null)
  const hideRef = useRef(null)
  const shrinkRef = useRef(null)
  const ctxRef = useRef(null)
  const canvasRef = useRef(null)
  const zoomCanvasRef = useRef(null)
  const zoomRef = useRef(null)
  const isZoomRef = useRef(false)
  const quxRef = useRef(0)
  const quyRef = useRef(0)
  const undoRef = useRef(null)
  const fileInputRef = useRef(null)
  const prevXY = useRef([600, 600])
  const drawingRef = useRef(false)
  const generatedRef = useRef(null)

  const [symmetrySlider, setSymmetrySlider] = useQueryParam('Symmetry', numberParam(2, 50, 12))
  const [brushSizeSlider, setBrushSizeSlider] = useQueryParam('Brushsize', numberParam(2, 24, 4))
  const [autoRepeatSlider, setAutoRepeatSlider] = useQueryParam('AutoRepeat', numberParam(2, 25, 8))
  const [fillOption, setFillOption] = useQueryParam('fillstyle', choiceParam(['fillAll', 'fillHalf', 'fillOne'], 'fillAll'))
  const [drawOption, setDrawOption] = useQueryParam('drawstyle', choiceParam(['draw', 'fill', 'drop', 'zoom'], 'draw'))
  const [myPalette, setMyPalette] = useQueryParam('palette', withDefault(StringParam, ''))
  const [designStyle, setDesignStyle] = useQueryParam('style', choiceParam(['lotus', 'rosette', 'geometry'], 'lotus'))
  const [finish, setFinish] = useQueryParam('finish', choiceParam(['color', 'line'], 'color'))
  const [seed, setSeed] = useQueryParam('seed', numberParam(0, 4294967295, 18732))
  const colors = useRef(parsePalette(myPalette))
  const [colorHelper, setColorHelper] = useState([...colors.current])
  const [selectedColor, setSelectedColor] = useState(0)
  const [currentColor, setCurrentColor] = useState(colors.current[0])
  const [gridVisible, setGridVisible] = useState(false)
  const [status, setStatus] = useState('A little inspiration to get you started.')
  const [canUndo, setCanUndo] = useState(false)
  const paletteName = PALETTES.find(palette => palette.colors.join() === colorHelper.join())?.name || 'Your palette'

  const fullCanvas = () => isZoomRef.current ? zoomCanvasRef.current : canvasRef.current
  const rememberCanvas = () => {
    if (!canvasRef.current) return
    undoRef.current = fullCanvas().toDataURL('image/png')
    setCanUndo(true)
  }
  const updateGrid = (symmetry = symmetrySlider) => createGrid(chartRef, symmetry, WIDTH, isZoomRef, quxRef, quyRef)
  const leaveZoom = () => {
    if (isZoomRef.current) ctxRef.current.drawImage(zoomCanvasRef.current, 0, 0)
    isZoomRef.current = false
    quxRef.current = 0
    quyRef.current = 0
    updateGrid()
  }

  const paintDesign = (options = {}) => {
    leaveZoom()
    const design = createMandalaDesign({ symmetry: symmetrySlider, style: designStyle, seed, ...options })
    renderMandala(ctxRef.current, WIDTH, design, {
      palette: colors.current, colored: finish === 'color', ...options,
    })
    generatedRef.current = design
  }
  const refreshDesign = options => {
    if (generatedRef.current) {
      rememberCanvas()
      paintDesign(options)
    }
  }

  const resetCanvas = (remember = true) => {
    if (remember) rememberCanvas()
    isZoomRef.current = false
    quxRef.current = 0
    quyRef.current = 0
    for (const [ref, id, target] of [[chartRef, 'drawcanvas', canvasRef], [zoomRef, 'zoomcanvas', zoomCanvasRef]]) {
      d3.select(ref.current).selectAll('canvas').remove()
      const canvas = document.createElement('canvas')
      canvas.id = id
      canvas.width = WIDTH
      canvas.height = WIDTH
      ref.current.appendChild(canvas)
      target.current = canvas
    }
    ctxRef.current = canvasRef.current.getContext('2d')
    ctxRef.current.fillStyle = '#FFFFFF'
    ctxRef.current.fillRect(0, 0, WIDTH, WIDTH)
    canvasRef.current.style.cursor = cursors[drawOption]
    generatedRef.current = null
    updateGrid()
    if (remember) setStatus('A fresh canvas. Make the first mark.')
  }

  useEffect(() => {
    resetCanvas(false)
    paintDesign()
  }, [])

  useEffect(() => {
    if (canvasRef.current) canvasRef.current.style.cursor = cursors[drawOption]
  }, [drawOption])

  const handleGenerate = () => {
    rememberCanvas()
    const nextSeed = Math.floor(Math.random() * 4294967295)
    setSeed(nextSeed)
    paintDesign({ seed: nextSeed })
    setStatus('Something new, made just for this moment.')
  }
  const handleStyleChange = style => {
    setDesignStyle(style)
    refreshDesign({ style })
  }
  const handleFinishChange = value => {
    setFinish(value)
    refreshDesign({ colored: value === 'color' })
  }
  const handlePalettePreset = palette => {
    colors.current = [...palette.colors]
    setColorHelper([...palette.colors])
    setMyPalette(encodeURIComponent(JSON.stringify(palette.colors)))
    setSelectedColor(0)
    setCurrentColor(palette.colors[0])
    refreshDesign({ palette: palette.colors })
  }
  const handleSlider1Change = event => {
    const symmetry = Number(event.target.value)
    setSymmetrySlider(symmetry)
    refreshDesign({ symmetry })
    updateGrid(symmetry)
  }
  const handleUndo = () => {
    if (!undoRef.current) return
    const previous = undoRef.current
    rememberCanvas()
    leaveZoom()
    const img = new Image()
    img.onload = () => {
      ctxRef.current.drawImage(img, 0, 0, WIDTH, WIDTH)
      generatedRef.current = null
      setStatus('Back to your previous canvas.')
    }
    img.src = previous
  }
  const overDraw = event => {
    const active = event.buttons === 1 || event.type.includes('touch') || event.type === 'click'
    if (active && (drawOption === 'draw' || drawOption === 'fill' || event.ctrlKey)) generatedRef.current = null
    if (event.ctrlKey || drawOption === 'fill') {
      fillWrap(event, chartRef, ctxRef, currentColor, WIDTH, symmetrySlider, fillOption, isZoomRef, zoomCanvasRef, quxRef, quyRef)
    } else if (drawOption === 'draw') {
      drawWrap(event, chartRef, ctxRef, WIDTH, symmetrySlider, brushSizeSlider, currentColor, prevXY.current, isZoomRef, zoomCanvasRef, quxRef, quyRef)
    } else if (drawOption === 'zoom') {
      zoom(event, isZoomRef, canvasRef, chartRef, zoomCanvasRef, WIDTH, quxRef, quyRef, symmetrySlider)
    } else {
      drop(event, chartRef, ctxRef.current, selectedColor, colors, setColorHelper, setCurrentColor, setMyPalette)
    }
  }
  const startStroke = event => {
    if (event.button !== 0) return
    drawingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    if (drawOption === 'draw' || drawOption === 'fill' || event.ctrlKey) rememberCanvas()
    prevXY.current = getMandalaHelpers.getLocalCoordinates(event, chartRef)
    overDraw({ type: 'click', buttons: 0, clientX: event.clientX, clientY: event.clientY, ctrlKey: event.ctrlKey })
  }
  const moveStroke = event => {
    if (drawingRef.current && (drawOption === 'draw' || drawOption === 'drop')) overDraw(event)
  }
  const endStroke = event => {
    drawingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const handleMandalaFileInput = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = event => {
      const img = new Image()
      img.onload = () => {
        rememberCanvas()
        leaveZoom()
        ctxRef.current.fillStyle = '#FFFFFF'
        ctxRef.current.fillRect(0, 0, WIDTH, WIDTH)
        const scale = Math.min(WIDTH / img.width, WIDTH / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctxRef.current.drawImage(img, (WIDTH - w) / 2, (WIDTH - h) / 2, w, h)
        generatedRef.current = null
        setStatus('Your saved mandala, ready for a little more.')
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <div className="studio-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Just Mandala home"><span className="brand-mark"><StudioIcon name="rosette" size={35} /></span><span>just<span className="brand-italic">mandala</span><small>A SPACE TO CREATE</small></span></a>
        <div className="header-actions"><span className="private-note"><span />A little time for yourself.</span><button className="button button-dark" onClick={() => downloadMandala({ current: fullCanvas() }, `justmandala-${seed}.png`)}><StudioIcon name="download" />Download PNG</button></div>
      </header>

      <main>
        <div className="intro"><div><p className="eyebrow">THE MANDALA STUDIO</p><h1>Find your center<span>.</span></h1><p>A little symmetry. A little serenity. Something entirely yours.</p></div><div className="intro-note"><span className="note-line" />No perfect strokes needed.<br />Just a little curiosity.</div></div>

        <div className="studio-layout">
          <aside className="controls-panel" aria-label="Mandala settings">
            <MandalaControls slider1={symmetrySlider} handleSlider1Change={handleSlider1Change} slider2={brushSizeSlider} handleSlider2Change={event => setBrushSizeSlider(Number(event.target.value))}
              slider3={autoRepeatSlider} handleSlider3Change={event => setAutoRepeatSlider(Number(event.target.value))} myLightDark={1} myPalette={myPalette} setMyPalette={setMyPalette}
              setCurrentColor={setCurrentColor} toastId="" resetCanvas={() => resetCanvas()} ctxRef={ctxRef} color={currentColor} width={WIDTH}
              radioValue={fillOption} handleRadioChange={setFillOption} handleMandalaFileInput={handleMandalaFileInput} fileInputRef={fileInputRef}
              canvasRef={canvasRef} undoRef={undoRef} fillOption={fillOption} colors={colors} setColorHelper={setColorHelper} colorHelper={colorHelper}
              selectedColor={selectedColor} setSelectedColor={setSelectedColor} isZoomRef={isZoomRef} zoomCanvasRef={zoomCanvasRef} quxRef={quxRef} quyRef={quyRef}
              handleTesselate={() => createTessel(d3, hideRef, shrinkRef, WIDTH)} onGenerate={handleGenerate} onBeforeFill={() => { rememberCanvas(); generatedRef.current = null }}
              designStyle={designStyle} onStyleChange={handleStyleChange} finish={finish} onFinishChange={handleFinishChange} paletteName={paletteName} onPalettePreset={handlePalettePreset}
            />
          </aside>

          <section className="canvas-panel" aria-label="Drawing studio">
            <div className="canvas-toolbar">
              <div className="tool-group" role="group" aria-label="Drawing tools">
                {[['draw', 'Draw'], ['fill', 'Fill'], ['drop', 'Pick color'], ['zoom', 'Zoom']].map(([value, label]) => <button key={value} className={`tool-button ${drawOption === value ? 'is-active' : ''}`} aria-label={`${label} mode`} aria-pressed={drawOption === value} title={`${label} mode`} onClick={() => setDrawOption(value)}><StudioIcon name={value} /><span>{label}</span></button>)}
              </div>
              <div className="tool-group canvas-actions"><button className="tool-button icon-only" aria-label="Undo" title="Undo" disabled={!canUndo} onClick={handleUndo}><StudioIcon name="undo" /></button><span className="toolbar-divider" /><button className={`tool-button icon-only ${gridVisible ? 'is-active' : ''}`} aria-label="Show symmetry guides" title="Symmetry guides" aria-pressed={gridVisible} onClick={() => setGridVisible(value => !value)}><StudioIcon name="grid" /></button></div>
            </div>

            <div className="canvas-stage"><div className={`artwork-paper ${gridVisible ? 'show-guides' : ''}`}>
              <div id="drawCanvas" ref={chartRef} onPointerDown={startStroke} onPointerMove={moveStroke} onPointerUp={endStroke} onPointerCancel={endStroke} aria-label="Mandala drawing canvas" role="img" />
            </div></div>

            <div className="canvas-caption"><div><span className="live-dot" /><span>Your moment of symmetry</span></div><span>1200 × 1200 <span className="caption-format">/ PNG</span></span></div>
            <p className="canvas-hint" role="status" aria-live="polite">{status} <span>Click and drag to add your own touch.</span></p>
          </section>
        </div>
      </main>
      <footer className="site-footer"><span>Less noise. More possibility.</span><span>Made for the joy of making.<StudioIcon name="lotus" size={18} /></span></footer>
      <div ref={hideRef} hidden /><div ref={zoomRef} hidden />
    </div>
  )
}

export default JustMandala
