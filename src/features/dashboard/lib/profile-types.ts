// The player profile's shared display shapes — what the compute* seams
// (profile-header, profile-stats, profile-shape, profile-errors) hand to the
// presentational components. Born as the profile fixture's types; the
// fixture is gone, the shapes stayed.

export interface ProfileKpi {
  value: string
  label: string
  detail: string
  /** The hero number gets the accent colour. */
  accent?: boolean
}

export interface ProfileInsight {
  eyebrow: string
  title: string
  body: string
  /** One insight per group carries the highlight treatment. */
  highlight?: boolean
}

export interface CurveBucket {
  label: string
  rallies: number
  /** Win rate over the bucket, or null when it has no rallies to rate. */
  winRate: number | null
}

export interface PressureRow {
  label: string
  won: number
  of: number
}

export interface ShareRow {
  label: string
  count: number
  /** Share of the group, 0–100, for the bar width. */
  share: number
}

export interface ServeBoxes {
  left: { won: number; of: number }
  right: { won: number; of: number }
  aces: number
  doubleFaults: number
}
