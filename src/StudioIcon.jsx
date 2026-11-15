export function StudioIcon({ name, size = 18, ...props }) {
  const paths = {
    sparkle: <><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z" /><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6Z" /></>,
    draw: <><path d="m15 4 5 5M4 20l5-1 12-12a2.1 2.1 0 0 0-5-5L4 14Z" /><path d="m4 14 5 5" /></>,
    fill: <><path d="m5 4 11 11M12 3l8 8-9 9-8-8Z" /><path d="M3 12h16M20 16s-2 2.5-2 3.5a2 2 0 0 0 4 0c0-1-2-3.5-2-3.5Z" /></>,
    drop: <><path d="m14 4 6 6M13 9 4 18v3h3l9-9M13 9l3 3M13 9l-1-1 5-5a2 2 0 0 1 3 3l-5 5-1-1" /></>,
    zoom: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M7 10.5h7M10.5 7v7" /></>,
    undo: <><path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12" /></>,
    grid: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
    arrow: <><path d="M4 12h16m-5-5 5 5-5 5" /></>,
    reset: <><path d="M4 8a9 9 0 1 1-1 8M4 3v5h5" /></>,
    lotus: <><path d="M12 21C2 18 1 11 3 7c5 0 9 5 9 14Zm0 0c10-3 11-10 9-14-5 0-9 5-9 14Z" /><path d="M12 21C5 13 7 5 12 2c5 3 7 11 0 19Z" /></>,
    rosette: <><circle cx="12" cy="12" r="3" />{[0, 60, 120, 180, 240, 300].map(angle => <ellipse key={angle} cx="12" cy="6" rx="3" ry="4" transform={`rotate(${angle} 12 12)`} />)}</>,
    geometry: <><path d="m12 2 8 5v10l-8 5-8-5V7Zm0 0v20M4 7l16 10M4 17 20 7" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.sparkle}</svg>
}
