import { useEffect, useState } from "react"

/**
 * A persistent rail of the site's other pages, so they are visible for the
 * whole scroll rather than only at the bottom of it. Hidden until the reader
 * is past the hero (it has nothing to say while the navbar is still the
 * obvious way around) and hidden below lg, where it would compete with the
 * content for width — on small screens the destination cards carry this job
 * on their own.
 */
const LINKS = [
  { href: "/signals/", label: "Signals" },
  { href: "/explore/", label: "Explore" },
  { href: "/playbook/", label: "Playbook" },
  { href: "/methodology/", label: "Methodology" },
  { href: "/removal/", label: "Removal" },
]

export function SiteRail() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      aria-label="Site sections"
      className={`fixed top-1/2 left-5 z-40 hidden -translate-y-1/2 lg:block ${
        shown ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      } transition-opacity duration-500`}
    >
      <ul className="flex flex-col gap-1 border-l border-border pl-4">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="group flex items-center gap-2.5 py-1 text-[12px] text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:text-foreground"
            >
              <span className="h-px w-3 bg-border transition-all duration-200 group-hover:w-5 group-hover:bg-foreground" />
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
