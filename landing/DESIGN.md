# Meridian — Design System

Clean, minimal landing page in the spirit of Linear/Vercel. Every section must draw
from these tokens only — no one-off colors, sizes, or shadows.

## Color

All colors flow through the shadcn CSS variables in `src/index.css` (zinc-based):

| Token | Use |
|---|---|
| `background` (white) | Page background |
| `muted` (zinc-50) | Alternating section bands, card footers |
| `foreground` (zinc-950) | Headings, primary buttons |
| `muted-foreground` (zinc-500) | Body copy, captions, nav links |
| `border` (zinc-200) | All hairline borders — never shadows for separation |
| `primary` (zinc-950) | Primary CTA (black button, Vercel-style) |
| `brand` (indigo `oklch(0.51 0.19 262)`) | The one accent: badge dot, check icons, highlighted pricing ring, small highlights. Used sparingly. |

No gradients except a faint radial wash behind the hero. No purple. No colored fills on large surfaces.

## Typography — Inter Variable

| Step | Size / weight / tracking | Use |
|---|---|---|
| Display | `text-5xl md:text-6xl`, semibold, `tracking-tighter` | Hero H1 only |
| H2 | `text-3xl md:text-4xl`, semibold, `tracking-tight` | Section headings |
| Eyebrow | `text-[13px]`, medium, brand color | Small label above H2 |
| Lead | `text-lg`, normal, `text-muted-foreground` | Hero/section subtitles |
| Body | `text-sm` / `text-[15px]`, `text-muted-foreground` | Card copy, lists |
| Caption | `text-xs`, `text-muted-foreground` | Fine print, stat labels |

## Spacing & layout

- 8-pt grid. Container: `max-w-6xl mx-auto px-6`.
- Sections: `py-24` (hero `pt-32 pb-24`). Heading block → content: `mt-16`.
- Grid gaps: `gap-6`.
- Radius: shadcn default (`--radius: 0.625rem`).

## Elevation

Borders instead of shadows. Cards keep shadcn's subtle `ring-foreground/10`; nothing heavier.
Sticky nav uses `border-b` + `backdrop-blur`.

## Components

All interactive elements are shadcn/ui: `Button`, `Card`, `Badge`, `Input`, `Separator`.
Icons: lucide-react, `size-4`/`size-5`, `stroke-[1.5]`.
