import { cn } from "@/lib/utils"

import type { BallType } from "@/lib/schemas/enums"

// A squash ball is known by its dot(s) — one coloured dot, two for double
// yellow. Shared by the setup form's chips and the manage browser.

const BALL_DOTS: Record<BallType, Array<string>> = {
  blue: ["bg-blue-500"],
  red: ["bg-red-500"],
  yellow: ["bg-yellow-400"],
  double_yellow: ["bg-yellow-400", "bg-yellow-400"],
}

export function BallDots({
  ball,
  className,
}: {
  ball: BallType
  className?: string
}) {
  return (
    <span
      aria-label={ball.replace("_", " ")}
      title={ball.replace("_", " ")}
      className={cn("flex items-center gap-0.5", className)}
    >
      {BALL_DOTS[ball].map((color, i) => (
        <span key={i} className={`size-2 rounded-full ${color}`} />
      ))}
    </span>
  )
}
