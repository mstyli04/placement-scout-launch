import overview from "@/data/overview.json"
import signals from "@/data/signals.json"

/**
 * The four real numbers the journey narrates, in their own module so the
 * copy can import them without pulling Three.js into the homepage bundle.
 * Kept as live reads from the data files, so the section can never drift
 * from what the rest of the site reports.
 */
export const TOTALS = {
  firms: overview.totalFirms,
  websites: overview.websiteCount,
  watched: signals.watchedCount,
  moved: signals.publishableCount,
}
