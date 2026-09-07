import { expect, test } from "bun:test"
import { getCadModelPlacement } from "@tscircuit/circuit-json-util"
import type { CadComponent, CadModelAxisDirection } from "circuit-json"
import * as THREE from "three"
import {
  getCadModelObjectMatrix,
  getCadModelTransform,
} from "../src/utils/cad-model-transform"

test("native origin, raw size and all normals share one matrix on both layers", () => {
  const orientedMarkers: Record<CadModelAxisDirection, number[]> = {
    "z+": [1, 2, 3],
    "z-": [1, -2, -3],
    "x+": [-3, 2, 1],
    "x-": [3, 2, -1],
    "y+": [1, -3, 2],
    "y-": [1, 3, -2],
  }
  const geometry = new THREE.BoxGeometry(6, 4, 20).translate(13, 22, 40)
  for (const [normal, oriented] of Object.entries(orientedMarkers)) {
    for (const layer of ["top", "bottom"]) {
      for (const degrees of [0, 90, 180, 270]) {
        const cad: CadComponent = {
          type: "cad_component",
          cad_component_id: "cad",
          pcb_component_id: "pcb",
          source_component_id: "source",
          anchor_alignment: "center",
          position: { x: 7, y: -5, z: layer === "top" ? 2 : -2 },
          rotation: { x: 0, y: layer === "bottom" ? 180 : 0, z: degrees },
          model_board_normal_direction: normal as CadModelAxisDirection,
          model_origin_position: { x: 10, y: 20, z: 30 },
          model_object_fit: "contain_within_bounds",
          size: { x: 6, y: 4, z: 20 },
        }
        const mesh = new THREE.Mesh(geometry)
        const transform = getCadModelTransform(cad, {
          layer,
          pcbThickness: 1.6,
          modelType: "obj",
        })
        const group = new THREE.Group()
        group.matrixAutoUpdate = false
        group.matrix.copy(getCadModelObjectMatrix(mesh, transform.placement))
        group.add(mesh)
        group.updateMatrixWorld(true)
        const marker = new THREE.Vector3(11, 22, 33).applyMatrix4(
          mesh.matrixWorld,
        )
        const radians = (degrees * Math.PI) / 180
        const x =
          oriented[0]! * Math.cos(radians) - oriented[1]! * Math.sin(radians)
        const y =
          oriented[0]! * Math.sin(radians) + oriented[1]! * Math.cos(radians)
        expect(marker.x).toBeCloseTo(7 + (layer === "bottom" ? -x : x), 4)
        expect(marker.y).toBeCloseTo(-5 + y, 4)
        expect(marker.z).toBeCloseTo(
          cad.position.z + (layer === "bottom" ? -oriented[2]! : oriented[2]!),
          4,
        )
        const origin = new THREE.Vector3(10, 20, 30).applyMatrix4(
          mesh.matrixWorld,
        )
        expect(
          origin.distanceTo(new THREE.Vector3(7, -5, cad.position.z)),
        ).toBeLessThan(1e-4)
        const shared = getCadModelPlacement(cad, {
          nativeBounds: {
            min: { x: 10, y: 20, z: 30 },
            max: { x: 16, y: 24, z: 50 },
          },
          nativeToCanonicalModel: new THREE.Matrix4().elements,
          sizeSpace: "native",
        })
        for (let i = 0; i < 16; i++)
          expect(mesh.matrixWorld.elements[i]).toBeCloseTo(
            shared.nativeToWorld[i]!,
            4,
          )
      }
    }
  }
})
