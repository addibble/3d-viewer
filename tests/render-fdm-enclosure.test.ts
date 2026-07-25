import { expect, test } from "bun:test"
import * as THREE from "three"
import { renderFdmEnclosure } from "../src/utils/render-fdm-enclosure"

const boxPlan = {
  type: "subtract",
  shapes: [
    {
      type: "translate",
      vector: [0, 0, 5],
      shape: { type: "cuboid", size: [20, 12, 10] },
    },
    {
      type: "translate",
      vector: [0, 0, 7],
      shape: { type: "cuboid", size: [16, 8, 10] },
    },
  ],
}

const enclosure = (overrides: Record<string, unknown> = {}) =>
  ({
    type: "cad_fdm_enclosure",
    cad_fdm_enclosure_id: "cad_enclosure_1",
    source_fdm_enclosure_id: "enclosure_1",
    name: "EN1.base",
    position: { x: 1, y: 2, z: -3 },
    size: { x: 20, y: 12, z: 10 },
    model_jscad: boxPlan,
    ...overrides,
  }) as any

test("an enclosure part is placed by position alone, with no asset normalization", () => {
  const scene = new THREE.Scene()
  renderFdmEnclosure(enclosure(), scene)

  expect(scene.children).toHaveLength(1)
  const mesh = scene.children[0] as THREE.Mesh
  expect(mesh.geometry.attributes.position!.count).toBeGreaterThan(0)

  // The viewer is Circuit Z-up, so position maps straight through.
  expect(mesh.position.toArray()).toEqual([1, 2, -3])
  expect(mesh.rotation.toArray().slice(0, 3)).toEqual([0, 0, 0])
  expect(mesh.scale.toArray()).toEqual([1, 1, 1])

  // `size` must not scale the plan: the geometry already carries true extents.
  mesh.geometry.computeBoundingBox()
  const bounds = mesh.geometry.boundingBox!
  expect(bounds.max.x - bounds.min.x).toBeCloseTo(20)
  expect(bounds.max.y - bounds.min.y).toBeCloseTo(12)
  expect(bounds.max.z - bounds.min.z).toBeCloseTo(10)
})

test("show_as_translucent_model makes a single part see-through", () => {
  const opaqueScene = new THREE.Scene()
  renderFdmEnclosure(enclosure(), opaqueScene)
  const opaque = (opaqueScene.children[0] as THREE.Mesh)
    .material as THREE.MeshStandardMaterial
  expect(opaque.transparent).toBe(false)
  expect(opaque.opacity).toBe(1)

  const lidScene = new THREE.Scene()
  renderFdmEnclosure(
    enclosure({ show_as_translucent_model: true, name: "EN1.lid" }),
    lidScene,
  )
  const lid = (lidScene.children[0] as THREE.Mesh)
    .material as THREE.MeshStandardMaterial
  expect(lid.transparent).toBe(true)
  expect(lid.opacity).toBeLessThan(1)
})

test("rotation is interpreted in degrees, matching cad_component", () => {
  const scene = new THREE.Scene()
  renderFdmEnclosure(enclosure({ rotation: { x: 0, y: 0, z: 180 } }), scene)

  const mesh = scene.children[0] as THREE.Mesh
  expect(mesh.rotation.z).toBeCloseTo(Math.PI)
})

test("a record without a plan renders nothing rather than throwing", () => {
  const scene = new THREE.Scene()
  renderFdmEnclosure(enclosure({ model_jscad: undefined }), scene)
  expect(scene.children).toHaveLength(0)
})
