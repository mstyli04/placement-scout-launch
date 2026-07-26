import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import freshness from "@/data/freshness.json"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// freshness.last_updated is a plain calendar date ("YYYY-MM-DD"), not a
// timestamp — format from the string parts directly rather than going
// through Date/toLocaleDateString, which applies the viewer's timezone and
// can roll the date back a day for anyone west of UTC.
export function lastUpdated(): string {
  const [year, month, day] = freshness.last_updated.split("-")
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`
}
