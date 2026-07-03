import { Controller } from "react-hook-form"

import { BallDots } from "@/components/ball-dots"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type { HouseRulesInput } from "@/lib/schemas/match"
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form"

// The grouped house-rules section (§7.7) — shared by match setup and the
// manage edit sheet so the two can't drift. Callers whose form type
// structurally contains { houseRules: HouseRulesInput } cast their control
// down to this shape.

export interface HouseRulesForm {
  houseRules: HouseRulesInput
}

const BALL_LABELS = {
  blue: "Blue",
  red: "Red",
  yellow: "Yellow",
  double_yellow: "Dbl yellow",
} as const

interface HouseRulesFieldsProps {
  control: Control<HouseRulesForm>
  register: UseFormRegister<HouseRulesForm>
  errors: FieldErrors<HouseRulesForm>
}

export function HouseRulesFields({
  control,
  register,
  errors,
}: HouseRulesFieldsProps) {
  return (
    <FieldSet>
      <FieldLegend>House rules</FieldLegend>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="houseRules.format"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="format">Format</FieldLabel>
                <Select
                  value={field.value === null ? "casual" : String(field.value)}
                  onValueChange={(v) =>
                    field.onChange(v === "casual" ? null : Number(v))
                  }
                >
                  <SelectTrigger id="format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="casual">
                        Casual — just play games
                      </SelectItem>
                      {[1, 3, 5, 7, 9].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          Best of {n}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Field data-invalid={errors.houseRules?.targetScore ? true : undefined}>
            <FieldLabel htmlFor="target">Points per game</FieldLabel>
            <Input
              id="target"
              type="number"
              min={1}
              max={99}
              {...register("houseRules.targetScore", {
                valueAsNumber: true,
              })}
            />
            {errors.houseRules?.targetScore && (
              <FieldError>{errors.houseRules.targetScore.message}</FieldError>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="houseRules.tiebreak"
            render={({ field }) => (
              <Field>
                <FieldLabel>At 10–10</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="flex-wrap"
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  <ToggleGroupItem value="win_by_2">Win by 2</ToggleGroupItem>
                  <ToggleGroupItem value="sudden_death">
                    Sudden death
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="houseRules.servesPerPoint"
            render={({ field }) => (
              <Field>
                <FieldLabel>Serves per point</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="flex-wrap"
                  value={String(field.value)}
                  onValueChange={(v) => v && field.onChange(Number(v))}
                >
                  <ToggleGroupItem value="2">Two serves</ToggleGroupItem>
                  <ToggleGroupItem value="1">Single serve</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="houseRules.letResetsServe"
            render={({ field }) => (
              <Field>
                <FieldLabel>After a let</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="flex-wrap"
                  value={field.value ? "reset" : "keep"}
                  onValueChange={(v) => v && field.onChange(v === "reset")}
                >
                  <ToggleGroupItem value="keep">Keep serve no.</ToggleGroupItem>
                  <ToggleGroupItem value="reset">
                    Reset to 1st serve
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="houseRules.ballType"
            render={({ field }) => (
              <Field>
                <FieldLabel>Ball</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="flex-wrap"
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v === "" ? null : v)}
                >
                  {(
                    Object.keys(BALL_LABELS) as Array<keyof typeof BALL_LABELS>
                  ).map((b) => (
                    <ToggleGroupItem key={b} value={b}>
                      <BallDots ball={b} />
                      {BALL_LABELS[b]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </FieldSet>
  )
}
