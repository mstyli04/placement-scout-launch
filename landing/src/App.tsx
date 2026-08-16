import { Navbar } from "@/components/sections/navbar"
import { Hero } from "@/components/sections/hero"
import { ScrollJourney } from "@/components/journey/scroll-journey"
import { Preview } from "@/components/sections/preview"
import { Features } from "@/components/sections/features"
import { Stats } from "@/components/sections/stats"
import { RegionMap } from "@/components/sections/region-map"
import { Pages } from "@/components/sections/pages"
import { Pricing } from "@/components/sections/pricing"
import { Faq } from "@/components/sections/faq"
import { Footer } from "@/components/sections/footer"
import { SiteRail } from "@/components/site-rail"

export default function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <SiteRail />
      <main>
        <Hero />
        {/* The funnel, before the numbers are restated as text below — it
            argues for the product, the sections then evidence it. */}
        <ScrollJourney />
        <Preview />
        <Features />
        <Stats />
        <RegionMap />
        <Pages />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
