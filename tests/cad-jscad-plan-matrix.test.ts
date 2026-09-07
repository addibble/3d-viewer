import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import * as THREE from "three"
import { renderComponent } from "../src/utils/render-component"

test("the existing JSCAD interpreter places matrix plans through the actual viewer mesh", async () => {
  const cad: CadComponent = {
    type: "cad_component",
    cad_component_id: "cad",
    pcb_component_id: "pcb",
    source_component_id: "source",
    anchor_alignment: "center",
    position: { x: 7, y: -5, z: -3 },
    rotation: { x: 0, y: 180, z: 90 },
    model_origin_position: { x: 0, y: 0, z: 0 },
    model_object_fit: "contain_within_bounds",
    model_jscad: {
      type: "transform",
      matrix: [0, 2, 0, 0, -3, 0, 0, 0, 0, 0, 4, 0, 10, 20, 30, 1],
      shape: { type: "cuboid", size: [2, 4, 6] },
    },
  }
  const scene = new THREE.Scene()
  await renderComponent(cad, scene, { layer: "bottom", pcbThickness: 1.6 })
  scene.updateMatrixWorld(true)
  const actual: THREE.Vector3[] = []
  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const positions = node.geometry.getAttribute("position")
    for (let i = 0; i < positions.count; i++) {
      actual.push(
        new THREE.Vector3()
          .fromBufferAttribute(positions, i)
          .applyMatrix4(node.matrixWorld),
      )
    }
  })
  expect(actual.length).toBeGreaterThan(0)
  for (const x of [-1, 1])
    for (const y of [-2, 2])
      for (const z of [-3, 3]) {
        // Authored matrix first, then CAD Z rotation, then bottom Y flip, then target.
        const expected = new THREE.Vector3(2 * x + 27, -3 * y + 5, -4 * z - 33)
        expect(actual.some((point) => point.distanceTo(expected) < 1e-4)).toBe(
          true,
        )
      }
})
