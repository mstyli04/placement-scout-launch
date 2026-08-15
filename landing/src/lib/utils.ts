import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import freshness from "@/data/freshness.json"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Dates from the pipeline are plain calendar dates ("YYYY-MM-DD"), not
// timestamps — format from the string parts directly rather than going
// through Date/toLocaleDateString, which applies the viewer's timezone and
// can roll the date back a day for anyone west of UTC. It also keeps the
// server-rendered and hydrated markup identical, which a locale-dependent
// formatter would not: Node's ICU and the browser's need not agree.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`
}

export function lastUpdated(): string {
  return formatDate(freshness.last_updated)
}
