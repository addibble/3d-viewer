import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import * as THREE from "three"
import {
  getCadModelObjectMatrix,
  getCadModelTransform,
} from "../src/utils/cad-model-transform"

test("a measured source contact point lands on the target independently of source origin and scale", () => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [100, 100, -100, 4, 5, 6, 8, 5, 6, 4, 9, 6, 4, 5, 6, 20, 30, 14, 8, 5, 6],
      3,
    ),
  )
  geometry.setIndex([1, 2, 3, 4, 5, 6])
  const model = new THREE.Mesh(geometry)
  const cad: CadComponent = {
    type: "cad_component",
    cad_component_id: "cad",
    pcb_component_id: "pcb",
    source_component_id: "source",
    anchor_alignment: "center",
    position: { x: 7, y: -5, z: 2 },
    rotation: { x: 17, y: 31, z: 47 },
    model_origin_alignment: "center_of_component_on_board_surface",
    model_unit_to_mm_scale_factor: 2,
    model_object_fit: "contain_within_bounds",
  }
  const matrix = getCadModelObjectMatrix(
    model,
    getCadModelTransform(cad, {
      layer: "top",
      pcbThickness: 1.6,
      modelType: "obj",
    }).placement,
  )
  const contact = new THREE.Vector3(6, 7, 6).applyMatrix4(matrix)
  expect(contact.distanceTo(new THREE.Vector3(7, -5, 2))).toBeLessThan(1e-4)
  expect(
    new THREE.Vector3().applyMatrix4(matrix).distanceTo(contact),
  ).toBeGreaterThan(10)
})
