import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import * as THREE from "three"
import {
  getCadModelObjectMatrix,
  getCadModelTransform,
} from "../src/utils/cad-model-transform"

test("a native unit cube with scale two is 2mm unsized and 1mm with a 1mm target", () => {
  const cad: CadComponent = {
    type: "cad_component",
    cad_component_id: "cad",
    pcb_component_id: "pcb",
    source_component_id: "source",
    anchor_alignment: "center",
    model_object_fit: "contain_within_bounds",
    model_origin_position: { x: 0, y: 0, z: 0 },
    position: { x: 3, y: 5, z: 7 },
    model_unit_to_mm_scale_factor: 2,
  }
  for (const [size, expectedSize] of [
    [undefined, 2],
    [{ x: 1, y: 1, z: 1 }, 1],
  ] as const) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5),
    )
    const input = getCadModelTransform(
      { ...cad, size },
      { layer: "top", pcbThickness: 1.6, modelType: "obj" },
    ).placement
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(getCadModelObjectMatrix(mesh, input))
    const bounds = new THREE.Box3().setFromObject(mesh)
    const marker = new THREE.Vector3(1, 1, 1).applyMatrix4(mesh.matrix)
    for (const axis of ["x", "y", "z"] as const) {
      expect(bounds.min[axis]).toBeCloseTo(cad.position[axis], 12)
      expect(bounds.max[axis]).toBeCloseTo(
        cad.position[axis] + expectedSize,
        12,
      )
      expect(marker[axis]).toBeCloseTo(cad.position[axis] + expectedSize, 12)
    }
  }
})
