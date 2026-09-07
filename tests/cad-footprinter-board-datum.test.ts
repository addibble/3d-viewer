import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import * as THREE from "three"
import { renderComponent } from "../src/utils/render-component"
import {
  getCadModelObjectMatrix,
  getCadModelTransform,
} from "../src/utils/cad-model-transform"

test("footprinter surface alignment preserves zero board datum with through-hole pins", async () => {
  const cad: CadComponent = {
    type: "cad_component",
    cad_component_id: "cad",
    pcb_component_id: "pcb",
    source_component_id: "source",
    anchor_alignment: "center_of_component_on_board_surface",
    position: { x: 7, y: -5, z: 0.8 },
    footprinter_string: "dip8",
    model_object_fit: "contain_within_bounds",
  }
  const inferred = new THREE.Scene()
  const explicit = new THREE.Scene()
  await renderComponent(cad, inferred)
  await renderComponent(
    { ...cad, model_origin_position: { x: 0, y: 0, z: 0 } },
    explicit,
  )
  const actualBounds = new THREE.Box3().setFromObject(inferred)
  const expectedBounds = new THREE.Box3().setFromObject(explicit)
  expect(expectedBounds.min.z).toBeLessThan(cad.position.z)
  for (const axis of ["x", "y", "z"] as const) {
    expect(actualBounds.min[axis]).toBeCloseTo(expectedBounds.min[axis], 4)
    expect(actualBounds.max[axis]).toBeCloseTo(expectedBounds.max[axis], 4)
  }
  const authoredOrigin = { x: 1, y: 2, z: 3 }
  const model = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6))
  const transform = getCadModelTransform(
    { ...cad, model_origin_position: authoredOrigin },
    {
      layer: "top",
      pcbThickness: 1.6,
      modelType: "footprinter",
    },
  )
  const placedOrigin = new THREE.Vector3(1, 2, 3).applyMatrix4(
    getCadModelObjectMatrix(model, transform.placement),
  )
  expect(placedOrigin.distanceTo(new THREE.Vector3(7, -5, 0.8))).toBeLessThan(
    1e-4,
  )
})
