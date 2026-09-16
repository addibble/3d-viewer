import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { convertCircuitJsonTo3dSvg } from "../src/convert-circuit-json-to-3d-svg"

test("public SVG conversion retains black-oxide and brass hardware colors", async () => {
  const dom = new JSDOM()
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
  })
  try {
    for (const footprint of [
      "bolt_m3_l12_socketcap",
      "heatsetinsert_m3_l5.7",
    ]) {
      const svg = await convertCircuitJsonTo3dSvg(
        [
          {
            type: "cad_component",
            cad_component_id: "hardware",
            pcb_component_id: "hardware_owner",
            source_component_id: "hardware_source",
            footprinter_string: footprint,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            anchor_alignment: "center",
            model_object_fit: "contain_within_bounds",
          },
        ],
        { camera: { position: { x: 12, y: -30, z: 20 } } },
      )
      const svgDocument = new dom.window.DOMParser().parseFromString(
        svg,
        "image/svg+xml",
      )
      const colors = [...svgDocument.querySelectorAll("path")]
        .map((path) =>
          path.getAttribute("style")?.match(/fill:rgb\((\d+),(\d+),(\d+)\)/),
        )
        .filter((match) => match !== null && match !== undefined)
        .map((match) => match.slice(1).map(Number))
      expect(colors.length).toBeGreaterThan(0)
      // White lighting preserves the material's channel ordering. The old
      // THREE.Color(array) path rendered both parts with equal RGB channels.
      expect(
        colors.some(([red, green, blue]) =>
          footprint.startsWith("bolt")
            ? blue! > red! + 3
            : red! > green! + 10 && green! > blue! + 20,
        ),
      ).toBe(true)
    }
  } finally {
    Object.assign(globalThis, {
      window: previousWindow,
      document: previousDocument,
    })
    dom.window.close()
  }
})
