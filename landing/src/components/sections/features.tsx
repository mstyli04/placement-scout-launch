import { Database, Mail, BookOpen } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    icon: Database,
    title: "The curated database",
    description:
      "100 boutique firms scored and filtered from 73,000 candidates — sector, city, website, careers page, and FCA authorisation status for every row. Refreshed weekly, forever.",
  },
  {
    icon: Mail,
    title: "New firms every week",
    description:
      "A short weekly email of firms that just entered the register. Newly-authorised firms have no application backlog — a good email to a founder often gets a reply in days.",
  },
  {
    icon: BookOpen,
    title: "The outreach playbook",
    description:
      "How to pick your 30 firms, find the right partner to write to, and structure a 4-line email that gets replies — from someone who ran this exact campaign.",
  },
]

export function Features() {
  return (
    <section className="border-y border-border bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium text-brand">What you get</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            A campaign, not a job board
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to run structured outreach to firms nobody else is contacting.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="gap-3">
              <CardHeader>
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                  <feature.icon className="size-4.5 stroke-[1.5] text-foreground" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
