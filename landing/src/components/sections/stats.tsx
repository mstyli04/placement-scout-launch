const stats = [
  { value: "73,080", label: "UK companies scanned from the registers" },
  { value: "15,792", label: "FCA-authorised firms identified" },
  { value: "100", label: "Curated boutiques in the database" },
  { value: "Weekly", label: "Automatic refresh — new firms flagged" },
]

export function Stats() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </div>
              <div className="mx-auto mt-2 max-w-40 text-xs leading-relaxed text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
