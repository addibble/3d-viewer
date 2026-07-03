import { expect, test } from "bun:test"
import { nextPartOpacity } from "../src/contexts/PartAppearanceContext"

test("cycles visible -> 50% -> hidden -> visible", () => {
  expect(nextPartOpacity(1)).toBe(0.5)
  expect(nextPartOpacity(0.5)).toBe(0)
  expect(nextPartOpacity(0)).toBe(1)
})

test("any partially-visible opacity advances to hidden", () => {
  expect(nextPartOpacity(0.75)).toBe(0)
  expect(nextPartOpacity(0.05)).toBe(0)
})

test("returns a valid tri-state after three clicks (full loop)", () => {
  let o = 1
  o = nextPartOpacity(o) // 0.5
  o = nextPartOpacity(o) // 0
  o = nextPartOpacity(o) // 1
  expect(o).toBe(1)
})
