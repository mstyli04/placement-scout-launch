import { Button } from "@/components/ui/button"

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-md bg-foreground">
        <svg viewBox="0 0 16 16" className="size-3.5 fill-background">
          <path d="M7 2a5 5 0 1 0 3.1 8.9l3 3 1.4-1.4-3-3A5 5 0 0 0 7 2Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Placement Scout
      </span>
    </a>
  )
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="#preview" className="text-muted-foreground">
              Preview
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/explore/" className="text-muted-foreground">
              Explore
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="#faq" className="text-muted-foreground">
              FAQ
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="#access">Get free access</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
