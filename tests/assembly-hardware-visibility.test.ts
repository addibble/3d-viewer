import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import { getAssemblyHardwareModel } from "@tscircuit/jscad-assembly-hardware"
import {
  getAssemblyHardwareFamily,
  isAssemblyHardware,
} from "../src/utils/is-assembly-hardware"
import { getCadModelType } from "../src/utils/get-cad-model-type"

const cad = (extra: Partial<CadComponent>): CadComponent =>
  ({
    type: "cad_component",
    cad_component_id: "cad_1",
    pcb_component_id: "pcb_1",
    source_component_id: "source_1",
    position: { x: 0, y: 0, z: 0 },
    ...extra,
  }) as CadComponent

test("recognizes each assembly hardware family from its model string", () => {
  expect(
    getAssemblyHardwareFamily(
      cad({ modelprinter_string: "screw_m3_l6_socketcap" }),
    ),
  ).toBe("screw")
  expect(
    getAssemblyHardwareFamily(
      cad({ modelprinter_string: "bolt_m3_l12_socketcap" }),
    ),
  ).toBe("bolt")
  expect(
    getAssemblyHardwareFamily(
      cad({ modelprinter_string: "heatsetinsert_m3_l5.7" }),
    ),
  ).toBe("heatsetinsert")
  expect(
    getAssemblyHardwareFamily(
      cad({ modelprinter_string: "spacer_od5_id3_l6" }),
    ),
  ).toBe("spacer")
})

test("does not claim a model string that is not hardware", () => {
  expect(isAssemblyHardware(cad({ modelprinter_string: "flexscreen" }))).toBe(
    false,
  )
  expect(isAssemblyHardware(cad({ footprinter_string: "0402" }))).toBe(false)
  expect(isAssemblyHardware(cad({ model_jscad: { type: "cuboid" } }))).toBe(
    false,
  )
})

/**
 * The enclosure's placeholder PCB owner is do-not-place, off-board and
 * non-obstructing -- and so is every hardware piece's, because both need a
 * render frame without taking part in placement. A structural test would
 * therefore confuse the two, which is why this one reads the model string
 * instead. If that ever regresses, hardware starts obeying the enclosure's
 * visibility control and vanishes with it.
 */
test("is not confused by the enclosure's placeholder-owner shape", () => {
  const hardwareWithEnclosureLikeOwner = cad({
    modelprinter_string: "bolt_m3_l12_socketcap",
    model_origin_alignment: "bottom_center_of_component",
  })
  expect(isAssemblyHardware(hardwareWithEnclosureLikeOwner)).toBe(true)
})

/**
 * Recognizing a family and being able to build it are different questions, and
 * visibility only needs the first. `screw_m9_l8` names a screw perfectly well;
 * M9 simply is not a thread the catalogue stocks, which is the geometry layer's
 * problem and surfaces when the model is built. Conflating the two would make a
 * fastener disappear from the hardware control because of a spec typo.
 */
test("classifies by family, not by whether the part can be built", () => {
  expect(isAssemblyHardware(cad({ modelprinter_string: "screw_m9_l8" }))).toBe(
    true,
  )
  expect(() => getAssemblyHardwareModel("screw_m9_l8")).toThrow()
})

test("survives a malformed model string rather than throwing", () => {
  expect(isAssemblyHardware(cad({ modelprinter_string: "" }))).toBe(false)
  expect(isAssemblyHardware(cad({ modelprinter_string: "_" }))).toBe(false)
})

test("dispatches modelprinter strings, without displacing a baked plan", () => {
  expect(getCadModelType(cad({ modelprinter_string: "screw_m3_l6" }))).toBe(
    "modelprinter",
  )
  // A plan already built for this component is a decision that has been made;
  // the string is only the specification it was made from.
  expect(
    getCadModelType(
      cad({
        modelprinter_string: "screw_m3_l6",
        model_jscad: { type: "cuboid" },
      }),
    ),
  ).toBe("jscad")
})
