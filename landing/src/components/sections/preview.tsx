import { Check, Lock } from "lucide-react"

const realRows = [
  {
    name: "Olympia Wealth Management",
    sector: "Asset & wealth mgmt",
    city: "London",
    fca: true,
    careers: true,
  },
  {
    name: "Sumerian Partners",
    sector: "M&A / advisory",
    city: "London",
    fca: true,
    careers: true,
  },
  {
    name: "Collins Dale Capital Partners",
    sector: "M&A / advisory",
    city: "London",
    fca: true,
    careers: true,
  },
  {
    name: "Blackwood Capital Group",
    sector: "M&A / advisory",
    city: "London",
    fca: true,
    careers: true,
  },
]

const blurredNames = [
  "Meridian Rock Capital",
  "Ashworth & Vane Advisory",
  "Caldera Point Partners",
  "Northgate Quant Trading",
]

export function Preview() {
  return (
    <section id="preview" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium text-brand">Preview</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            What&apos;s inside
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One row per firm: sector, city, website, careers page, and FCA authorisation
            status — scored so the best-fit boutiques rise to the top.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Firm</th>
                <th className="px-4 py-3 font-medium">Sector</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 text-center font-medium">FCA</th>
                <th className="px-4 py-3 text-center font-medium">Careers page</th>
              </tr>
            </thead>
            <tbody>
              {realRows.map((row) => (
                <tr key={row.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.sector}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.city}</td>
                  <td className="px-4 py-3 text-center">
                    <Check className="mx-auto size-4 text-brand" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="mx-auto size-4 text-brand" />
                  </td>
                </tr>
              ))}
              {blurredNames.map((name) => (
                <tr key={name} className="border-b border-border last:border-0 select-none">
                  <td className="px-4 py-3 font-medium text-foreground blur-[5px]">{name}</td>
                  <td className="px-4 py-3 text-muted-foreground blur-[5px]">M&A / advisory</td>
                  <td className="px-4 py-3 text-muted-foreground blur-[5px]">Leeds</td>
                  <td className="px-4 py-3 text-center">
                    <Lock className="mx-auto size-3.5 text-muted-foreground" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Lock className="mx-auto size-3.5 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
            + 1,100 more curated firms across M&amp;A, asset &amp; wealth management, PE/VC, and
            quant trading
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-muted-foreground">
          Example rows show real firms from the database. Blurred rows are illustrative.
        </p>
      </div>
    </section>
  )
}
