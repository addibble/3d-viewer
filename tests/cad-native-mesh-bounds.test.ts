import { expect, test } from "bun:test"
import * as THREE from "three"
import { getCadModelFitScale } from "../src/utils/cad-model-fit"

test("native bounds measure rotated mesh vertices instead of empty AABB corners", () => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0, 2, 0, 0, 0, 2, 0], 3),
  )
  const model = new THREE.Mesh(geometry)
  model.rotation.z = Math.PI / 4
  const group = new THREE.Group()
  group.add(model)
  const scale = getCadModelFitScale(group, [2 * Math.SQRT2, Math.SQRT2, 1])
  for (const axisScale of scale) expect(axisScale).toBeCloseTo(1)
})
