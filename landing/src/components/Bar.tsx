import { useEffect, useRef } from "react"

// Sets width via a ref + effect (CSSOM property assignment) rather than the
// style prop — prerendering (react-dom/server) would otherwise serialize a
// literal style="" attribute, which vercel.json's style-src 'self' CSP
// blocks. Same fix as region-map.tsx's inline styles, but this bar's width
// is a genuinely continuous 0-100 value (not a binary choice), so a fixed
// set of CSS classes doesn't cover it the way it did there.
export function Bar({ pct }: { pct: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.style.width = `${pct}%`
  }, [pct])
  return <div ref={ref} className="h-2 w-0 rounded-full bg-brand" />
}
