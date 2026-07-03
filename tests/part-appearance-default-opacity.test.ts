import { expect, test } from "bun:test"
import {
  BOARD_PART_KEY,
  DEFAULT_ENCLOSURE_PART_OPACITY,
  getDefaultOpacity,
  getPartKey,
} from "../src/contexts/PartAppearanceContext"

test("enclosure parts default to 50% visible on load", () => {
  expect(DEFAULT_ENCLOSURE_PART_OPACITY).toBe(0.5)
  expect(getDefaultOpacity("enc:EN1-lid")).toBe(0.5)
  // The key produced by getPartKey for an enclosure part must resolve to 0.5.
  expect(getDefaultOpacity(getPartKey({ enclosure_part_id: "EN1-base" }))).toBe(
    0.5,
  )
})

test("the board and regular cad_components default to fully visible", () => {
  expect(getDefaultOpacity(BOARD_PART_KEY)).toBe(1)
  expect(getDefaultOpacity("cad:cad_0")).toBe(1)
  expect(getDefaultOpacity(getPartKey({ cad_component_id: "cad_0" }))).toBe(1)
})

test("unknown keys default to fully visible", () => {
  expect(getDefaultOpacity("something-else")).toBe(1)
  expect(getDefaultOpacity("")).toBe(1)
})
