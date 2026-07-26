import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { lastUpdated } from "@/lib/utils"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] [background:radial-gradient(60%_100%_at_50%_0%,--alpha(var(--color-brand)/6%),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-8 text-center md:pt-28">
        <Badge
          variant="secondary"
          className="gap-2 rounded-full px-3 py-1 font-normal text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-brand" />
          100 curated firms · last checked {lastUpdated()}
        </Badge>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold tracking-tighter text-balance text-foreground md:text-6xl">
          The finance firms job boards never show you
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-balance text-muted-foreground">
          Every student fights for the same 50 names. Placement Scout maps the boutique
          M&amp;A shops, wealth managers, and prop firms across the UK that hire quietly —
          straight from the Companies House and FCA registers.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" className="px-4" asChild>
            <a href="#access">
              Get free access
              <ArrowRight className="size-4" data-icon="inline-end" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="px-4" asChild>
            <a href="#preview">See what&apos;s inside</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          100% free. Built by a finance student who used it first.
        </p>
      </div>
    </section>
  )
}
