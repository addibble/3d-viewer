import { expect, test } from "bun:test"
import { getEnclosureExplodeZOffset } from "../src/contexts/EnclosureExplodedViewContext"

test("enclosure explode offsets apply only while exploded view is enabled", () => {
  const lid = { enclosure_explode_z_offset_mm: 12.5 }

  expect(getEnclosureExplodeZOffset(lid, false)).toBe(0)
  expect(getEnclosureExplodeZOffset(lid, true)).toBe(12.5)
  expect(getEnclosureExplodeZOffset({}, true)).toBe(0)
})
