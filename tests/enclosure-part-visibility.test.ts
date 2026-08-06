import { expect, test } from "bun:test"
import {
  PART_VISIBILITY_CYCLE,
  nextPartVisibility,
} from "../src/contexts/LayerVisibilityContext"

/**
 * An enclosure part is not usefully on-or-off. Three states earn their keep:
 * see-through to check openings against the parts behind them, solid to judge
 * the print itself, hidden when it is simply in the way.
 *
 * The starting state is see-through, because the first thing anyone does with
 * an enclosure on screen is look at the board inside it, and an opaque box
 * hides exactly what it was generated from.
 */
test("the cycle starts see-through and reaches every state", () => {
  expect(PART_VISIBILITY_CYCLE[0]).toBe("translucent")
  expect(new Set(PART_VISIBILITY_CYCLE)).toEqual(
    new Set(["translucent", "opaque", "hidden"]),
  )
})

test("clicking cycles, and returns to where it started", () => {
  const start = PART_VISIBILITY_CYCLE[0]!
  const seen = [start]

  let current = start
  for (let i = 0; i < PART_VISIBILITY_CYCLE.length; i++) {
    current = nextPartVisibility(current)
    if (i < PART_VISIBILITY_CYCLE.length - 1) seen.push(current)
  }

  expect(new Set(seen)).toEqual(new Set(PART_VISIBILITY_CYCLE))
  // A full lap is a no-op: no state is a dead end you cannot click out of.
  expect(current).toBe(start)
})

/**
 * The menu draws the state from the value alone, so an unknown value must not
 * strand the item: anything unrecognised has to still advance.
 */
test("an unrecognised state still advances", () => {
  expect(PART_VISIBILITY_CYCLE).toContain(
    nextPartVisibility("something-else" as any),
  )
})
