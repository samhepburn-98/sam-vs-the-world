import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The scaffolding every form in the app is built from — match setup, the
// login pair, the Manage edit dialogs. Field stacks label, control, hint and
// error at the right rhythm; `data-invalid` on the Field turns the whole
// group destructive, so nothing has to be coloured by hand at the call site.

const meta = {
  title: "Primitives/Field",
  component: Field,
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="story-field-venue">Venue (optional)</FieldLabel>
      <Input id="story-field-venue" defaultValue="Local courts" />
      <FieldDescription>
        It shows in the match row, beside the date.
      </FieldDescription>
    </Field>
  ),
}

// A FieldSet inside a FieldGroup, the way the Manage edit dialog nests them:
// loose fields first, then a named subject with a legend of its own.
export const Fieldset: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="story-field-notes">Notes (optional)</FieldLabel>
        <Textarea
          id="story-field-notes"
          rows={3}
          placeholder="Anything worth remembering about the match."
        />
      </Field>
      <FieldSet>
        <FieldLegend>House rules</FieldLegend>
        <FieldDescription>
          Recorded per match — a night played to nine doesn&rsquo;t rewrite last
          month&rsquo;s.
        </FieldDescription>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="story-field-target">
                Points per game
              </FieldLabel>
              <Input
                id="story-field-target"
                type="number"
                min={1}
                max={99}
                defaultValue={11}
              />
            </Field>
            <Field>
              {/* A composite control has no single input to point at, so the
                  label carries no htmlFor — the toggle group names itself. */}
              <FieldLabel>At 10–10</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                className="flex-wrap"
                defaultValue="win_by_2"
                aria-label="At 10–10"
              >
                <ToggleGroupItem value="win_by_2">Win by 2</ToggleGroupItem>
                <ToggleGroupItem value="sudden_death">
                  Sudden death
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  ),
}

export const Invalid: Story = {
  render: () => (
    <FieldGroup>
      <Field data-invalid>
        <FieldLabel htmlFor="story-field-email">Email</FieldLabel>
        <Input
          id="story-field-email"
          type="email"
          defaultValue="sam@"
          aria-invalid
        />
        <FieldError>Enter a valid email address.</FieldError>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="story-field-password">Password</FieldLabel>
        {/* Several messages at once come in as an array and render as a list. */}
        <Input id="story-field-password" type="password" aria-invalid />
        <FieldError
          errors={[
            { message: "At least eight characters." },
            { message: "One number." },
          ]}
        />
      </Field>
    </FieldGroup>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Key hints</FieldTitle>
          <FieldDescription>
            Paints the hotkey letter on every logger control.
          </FieldDescription>
        </FieldContent>
        <Toggle variant="outline" defaultPressed aria-label="Key hints">
          On
        </Toggle>
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Detail zone</FieldTitle>
          <FieldDescription>
            Keeps the where, why and shot count open between rallies.
          </FieldDescription>
        </FieldContent>
        <Toggle variant="outline" aria-label="Detail zone">
          Off
        </Toggle>
      </Field>
    </FieldGroup>
  ),
}
