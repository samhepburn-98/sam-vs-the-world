import { SyncIndicator } from "@/features/logger/components/sync-indicator"
import { WriteQueue } from "@/lib/api/write-queue"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { WriteOp } from "@/lib/api/write-queue"

// The logger's footer conscience: quiet while the FIFO write queue is keeping
// up, loud the moment it isn't. Reach for it on any screen that writes in the
// background — it subscribes to the real queue, so the state on screen is the
// queue's own, never a prop somebody remembered to update.

// Real queues, not mocks: a never-settling op holds the queue mid-flight, and
// a rejecting op classified as permanent pauses it exactly as a failed save
// would. Retry re-runs the same failing op, so the alert comes back.
function queueOf(op?: WriteOp) {
  const queue = new WriteQueue({ classify: () => "permanent" })
  if (op) queue.enqueue(op)
  return queue
}

const IDLE = queueOf()

const IN_FLIGHT = queueOf({
  id: "rally-12",
  label: "save rally 12",
  run: () => new Promise<never>(() => undefined),
})

const FAILED = queueOf({
  id: "rally-13",
  label: "save rally 13",
  run: () => Promise.reject(new Error("Network request failed")),
})

const meta = {
  title: "Logger/Sync indicator",
  component: SyncIndicator,
  args: { queue: IDLE },
} satisfies Meta<typeof SyncIndicator>

export default meta
type Story = StoryObj<typeof meta>

// Nothing outstanding. A single dot and a word, right-aligned — the resting
// state has to be ignorable or it stops meaning anything.
export const Synced: Story = {}

// An op in flight. The count is the honest one: ops not yet confirmed,
// including the one being sent.
export const Syncing: Story = { args: { queue: IN_FLIGHT } }

// A permanent failure hard-pauses the queue, and this is the one state that
// shouts. The queue never logs past a hole — op 13 landing after op 14 would
// shift every derived score — so the user has to resolve it before logging on.
export const Paused: Story = { args: { queue: FAILED } }
