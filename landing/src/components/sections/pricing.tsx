import { Check, ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const included = [
  "Full database — 1,100+ curated boutique firms",
  "Weekly refresh with new firms flagged",
  "“New firms this week” email every Monday",
  "The Boutique Outreach Playbook",
  "Filters by sector and city",
]

export function Pricing() {
  return (
    <section id="access" className="border-y border-border bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium text-brand">Access</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Free. The whole thing.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No card, no trial, no catch — drop your email and the full database is yours.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-xl">
          <Card className="gap-4 ring-2 ring-brand">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Full access
                </CardTitle>
                <Badge className="rounded-full bg-brand text-brand-foreground">Free</Badge>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-foreground">£0</span>
                <span className="text-xs text-muted-foreground">forever</span>
              </div>
              <CardDescription className="mt-1">
                You&apos;ll get the access link by email, plus the Monday new-firms digest.
                Unsubscribe anytime and keep the database.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2.5">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 stroke-[2] text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
              <form
                action="https://buttondown.com/api/emails/embed-subscribe/michaelstylianou"
                method="post"
                target="popupwindow"
                onSubmit={() =>
                  window.open(
                    "https://buttondown.com/confirmation?tag=michaelstylianou",
                    "popupwindow"
                  )
                }
                className="mt-5 flex gap-2"
              >
                <Input type="email" name="email" placeholder="university email" required className="flex-1" />
                <input type="hidden" name="embed" value="1" />
                <Button type="submit" size="lg">
                  Get free access
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Your email is used for the access link and the weekly digest — nothing else, ever.
        </p>
      </div>
    </section>
  )
}
