import { expect, test } from "bun:test"
import {
  ENCLOSURE_PART_KEY_PREFIX,
  getPartKey,
} from "../src/contexts/PartAppearanceContext"

test("keys enclosure parts by their stable enclosure_part_id", () => {
  expect(getPartKey({ enclosure_part_id: "EN1-lid" })).toBe("enc:EN1-lid")
  expect(getPartKey({ enclosure_part_id: "EN1-lid" })).toStartWith(
    ENCLOSURE_PART_KEY_PREFIX,
  )
})

test("prefers enclosure_part_id over cad_component_id", () => {
  expect(
    getPartKey({
      enclosure_part_id: "EN1-base",
      cad_component_id: "cad_0",
    }),
  ).toBe("enc:EN1-base")
})

test("keys non-enclosure cad_components by their cad_component_id", () => {
  expect(getPartKey({ cad_component_id: "cad_7" })).toBe("cad:cad_7")
})

test("does not throw for missing/undefined input", () => {
  expect(getPartKey(undefined)).toBe("cad:undefined")
  expect(getPartKey({})).toBe("cad:undefined")
})
