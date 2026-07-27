import { Navbar } from "@/components/sections/navbar"
import { Hero } from "@/components/sections/hero"
import { Preview } from "@/components/sections/preview"
import { Features } from "@/components/sections/features"
import { Stats } from "@/components/sections/stats"
import { RegionMap } from "@/components/sections/region-map"
import { Pricing } from "@/components/sections/pricing"
import { Faq } from "@/components/sections/faq"
import { Footer } from "@/components/sections/footer"

export default function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main>
        <Hero />
        <Preview />
        <Features />
        <Stats />
        <RegionMap />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
