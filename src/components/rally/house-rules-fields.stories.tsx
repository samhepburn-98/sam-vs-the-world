import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { HouseRulesFields } from "@/components/rally/house-rules-fields"
import { houseRulesSchema } from "@/lib/schemas/match"
import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"

import type { HouseRulesForm } from "@/components/rally/house-rules-fields"
import type { HouseRulesInput } from "@/lib/schemas/match"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The house-rules block (§7.7) — format, points per game, the 10–10 rule,
// serves per point, what a let does to the serve number, and the ball, all
// recorded per match so a night played to a different target still reads
// honestly a season later. Reach for it in any form holding a `houseRules`
// object: match setup and the /manage edit dialog both do, which is why the
// rules a match starts with and the rules it is later corrected to can't
// drift apart.

const SAMS_RULES: HouseRulesInput = {
  format: null,
  targetScore: DEFAULT_HOUSE_RULES.targetScore,
  tiebreak: DEFAULT_HOUSE_RULES.tiebreak,
  servesPerPoint: DEFAULT_HOUSE_RULES.servesPerPoint,
  letResetsServe: DEFAULT_HOUSE_RULES.letResetsServe,
  ballType: "double_yellow",
}

/** The fields are a section of somebody else's form, so a story has to be
 *  that form: useForm supplies the control, register and errors they read,
 *  and the real schema supplies the messages. */
function HouseRulesInAForm({
  houseRules,
  validateOnMount = false,
}: {
  houseRules: HouseRulesInput
  /** run the resolver on mount, to show what an invalid field looks like */
  validateOnMount?: boolean
}) {
  const form = useForm<HouseRulesForm>({
    resolver: zodResolver(z.object({ houseRules: houseRulesSchema })),
    defaultValues: { houseRules },
  })

  useEffect(() => {
    if (validateOnMount) void form.trigger()
  }, [validateOnMount, form])

  return (
    <HouseRulesFields
      control={form.control}
      register={form.register}
      errors={form.formState.errors}
    />
  )
}

const meta = {
  title: "Forms/House rules fields",
  component: HouseRulesInAForm,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: { houseRules: SAMS_RULES },
} satisfies Meta<typeof HouseRulesInAForm>

export default meta
type Story = StoryObj<typeof meta>

// Sam's rules, and the exact values match setup opens on: a casual session of
// games to 11, win by two, two serves a point, double yellow.
export const Default: Story = {}

// Somebody else's court, same block: a best-of-five to 15, sudden death
// rather than win by two, one serve a point, the serve number reset after
// every let, and a red ball. Every control here can disagree with the
// defaults at once, which is the whole point of recording them per match.
export const BestOfFive: Story = {
  name: "Best of five",
  args: {
    houseRules: {
      format: 5,
      targetScore: 15,
      tiebreak: "sudden_death",
      servesPerPoint: 1,
      letResetsServe: true,
      ballType: "red",
    },
  },
}

// The ball is the one optional rule — nothing is selected until somebody
// says which ball came out of the bag.
export const NoBallRecorded: Story = {
  name: "No ball recorded",
  args: { houseRules: { ...SAMS_RULES, ballType: null } },
}

// Points per game is the only free-typed number here, so it is the only one
// that can be wrong: the schema rejects it and the whole Field turns
// destructive around the message.
export const InvalidPointsPerGame: Story = {
  name: "Invalid points per game",
  args: {
    houseRules: { ...SAMS_RULES, targetScore: 0 },
    validateOnMount: true,
  },
}
