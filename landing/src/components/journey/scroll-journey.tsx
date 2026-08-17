import { useEffect, useRef, useState } from "react"

import { TOTALS } from "./totals"
import type { JourneyHandle } from "./engine"

const nf = new Intl.NumberFormat("en-GB")

/** Each act of the funnel, and the real number it lands on. */
const ACTS = [
  {
    from: 0.00,
    kicker: "The census",
    value: TOTALS.firms,
    line: "Every company on the Companies House register matching the SIC codes for finance. Most of them are not what you are looking for.",
  },
  {
    from: 0.20,
    kicker: "Landfall",
    value: TOTALS.firms,
    line: "Placed by registered office, region by region. Half of the whole register sits in London and the South East.",
  },
  {
    from: 0.42,
    kicker: "With a website",
    value: TOTALS.websites,
    line: "A firm with no site cannot be read, and cannot be written to. The rest of the register falls away here.",
  },
  {
    from: 0.60,
    kicker: "Careers pages watched",
    value: TOTALS.watched,
    line: "Each one fingerprinted and re-checked every night. The sweep crossing the map is that recheck.",
  },
  {
    from: 0.82,
    kicker: "Moved in the last 90 days",
    value: TOTALS.moved,
    line: "A firm that edits its careers page has usually just decided to hire. These are the ones worth writing to this week.",
    signal: true,
  },
]

export function ScrollJourney() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [act, setAct] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

    let handle: JourneyHandle | null = null
    let cancelled = false

    // Progress is read from layout every time, never accumulated. Scrubbing
    // backwards has to produce exactly the frame that scrubbing forwards did,
    // which is what makes the piece feel attached to the page — and what
    // makes it testable, since a headless check can set a scroll position and
    // assert on the settled frame.
    const readProgress = () => {
      const r = section.getBoundingClientRect()
      const scrollable = r.height - window.innerHeight
      if (scrollable <= 0) return 0
      return Math.min(1, Math.max(0, -r.top / scrollable))
    }

    const onScroll = () => {
      const p = readProgress()
      handle?.setProgress(p)
      let i = 0
      for (let k = 0; k < ACTS.length; k++) if (p >= ACTS[k].from) i = k
      setAct(i)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    // Three.js is loaded after the page has painted, not bundled into it.
    import("./engine").then(({ startJourney }) => {
      if (cancelled) return
      handle = startJourney(canvas, reduced)
      handle?.setProgress(readProgress())
      canvas.dataset.journeyReady = handle ? "1" : "0"
    })

    return () => {
      cancelled = true
      window.removeEventListener("scroll", onScroll)
      handle?.dispose()
    }
  }, [])

  const current = ACTS[act]

  return (
    <section
      ref={sectionRef}
      aria-label="How the database narrows, from the full register to the firms hiring now"
      className="relative h-[520vh] bg-[#070a12]"
      data-journey
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />

        {/* A class, not a style attribute: vercel.json sets `style-src 'self'`
            with no unsafe-inline, and prerendering serialises React style
            props into real attributes the CSP then blocks. Same trap that bit
            region-map.tsx in W-1. */}
        <div aria-hidden className="journey-vignette pointer-events-none absolute inset-0" />

        {/* pl-44 at lg, not px-12: the site rail is fixed at the left edge and
            is roughly 140px wide, so a centred max-w-6xl box put this copy
            straight underneath it at 1280px. The rail stays visible through
            the journey — that is the point of it — so the copy moves. */}
        <div className="pointer-events-none absolute inset-0 flex items-end px-6 pb-16 sm:items-center sm:pb-0 lg:pr-12 lg:pl-44">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-md">
              <p
                key={`k-${act}`}
                className="animate-[fadeUp_600ms_ease-out] font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase"
              >
                {String(act + 1).padStart(2, "0")} — {current.kicker}
              </p>
              <p
                key={`v-${act}`}
                className={`animate-[fadeUp_600ms_ease-out_60ms] mt-3 font-mono text-[clamp(2.6rem,7vw,4.5rem)] leading-none tabular-nums ${
                  current.signal ? "text-[#48c07a]" : "text-white"
                }`}
              >
                {nf.format(current.value)}
              </p>
              <p
                key={`l-${act}`}
                className="animate-[fadeUp_600ms_ease-out_120ms] mt-5 text-[15px] leading-relaxed text-white/65"
              >
                {current.line}
              </p>
            </div>
          </div>
        </div>

        {/* Act ticks: where you are in the funnel, and something for the eye
            to track as the numbers change. */}
        <div className="pointer-events-none absolute top-1/2 right-6 flex -translate-y-1/2 flex-col gap-2.5 lg:right-10">
          {ACTS.map((a, i) => (
            <span
              key={a.kicker}
              className={`h-6 w-px transition-colors duration-500 ${
                i === act ? "bg-white/80" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
