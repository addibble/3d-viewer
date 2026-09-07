import { expect, test } from "bun:test"
import type { CadComponent } from "circuit-json"
import * as THREE from "three"
import {
  getCadModelObjectMatrix,
  getCadModelTransform,
} from "../src/utils/cad-model-transform"

test("Y-normal fitting uses native axes and mm targets independently of model units", () => {
  const cad: CadComponent = {
    type: "cad_component",
    cad_component_id: "cad",
    pcb_component_id: "pcb",
    source_component_id: "source",
    anchor_alignment: "center",
    position: { x: 3, y: 5, z: 7 },
    model_origin_position: { x: 10, y: 20, z: 30 },
    model_board_normal_direction: "y+",
    model_object_fit: "contain_within_bounds",
  }
  for (const [fit, target, dimensions] of [
    ["contain_within_bounds", undefined, [6, 20, 4]],
    ["contain_within_bounds", { x: 6, y: 4, z: 20 }, [6, 20, 4]],
    ["fill_bounds", { x: 12, y: 12, z: 10 }, [12, 10, 12]],
  ] as const) {
    for (const unitScale of [1, 2, 25.4]) {
      const expected = dimensions.map((value) =>
        target ? value : value * unitScale,
      )
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 20).translate(13, 22, 40),
      )
      const input = getCadModelTransform(
        {
          ...cad,
          size: target,
          model_object_fit: fit,
          model_unit_to_mm_scale_factor: unitScale,
        },
        {
          layer: "top",
          pcbThickness: 1.6,
          modelType: "obj",
        },
      ).placement
      mesh.matrixAutoUpdate = false
      mesh.matrix.copy(getCadModelObjectMatrix(mesh, input))
      const bounds = new THREE.Box3().setFromObject(mesh)
      const size = bounds.getSize(new THREE.Vector3())
      expect(size.x).toBeCloseTo(expected[0]!, 8)
      expect(size.y).toBeCloseTo(expected[1]!, 8)
      expect(size.z).toBeCloseTo(expected[2]!, 8)
      expect(bounds.min.x).toBeCloseTo(cad.position.x, 8)
      expect(bounds.max.y).toBeCloseTo(cad.position.y, 8)
      expect(bounds.min.z).toBeCloseTo(cad.position.z, 8)
      const marker = new THREE.Vector3(11, 22, 33).applyMatrix4(mesh.matrix)
      expect(marker.x).toBeCloseTo(cad.position.x + expected[0]! / 6, 8)
      expect(marker.y).toBeCloseTo(cad.position.y - (expected[1]! * 3) / 20, 8)
      expect(marker.z).toBeCloseTo(cad.position.z + expected[2]! / 2, 8)
    }
  }
})
