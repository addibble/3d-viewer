import jscad from "@jscad/modeling"
import type { CadFdmEnclosure } from "circuit-json"
import { convertCSGToThreeGeom } from "jscad-electronics/vanilla"
import { executeJscadOperations } from "jscad-planner"
import * as THREE from "three"

/**
 * Render a generated FDM enclosure part into a headless scene.
 *
 * The JSCAD plan is authored by tscircuit in the Circuit world frame, so unlike
 * imported CAD assets there is no origin, up-axis, or fit normalization to
 * apply: `position` and `rotation` alone place it. `size` is a reported bounding
 * box, never a bound to scale into.
 */
export function renderFdmEnclosure(
  enclosure: CadFdmEnclosure,
  scene: THREE.Scene,
) {
  if (!enclosure.model_jscad) return

  const jscadObject = executeJscadOperations(
    jscad as any,
    enclosure.model_jscad,
  )
  if (!jscadObject || (!jscadObject.polygons && !jscadObject.sides)) return

  const threeGeom = convertCSGToThreeGeom(jscadObject)
  // See-through by default: this path has no menu to consult, and an opaque
  // shell hides the board it was generated from.
  const isTranslucent = true
  const material = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.5,
    roughness: 0.5,
    side: THREE.DoubleSide,
    transparent: isTranslucent,
    opacity: isTranslucent ? 0.3 : 1,
  })
  const mesh = new THREE.Mesh(threeGeom, material)

  const scale = enclosure.model_unit_to_mm_scale_factor ?? 1
  if (scale !== 1) mesh.scale.set(scale, scale, scale)

  mesh.position.set(
    enclosure.position.x ?? 0,
    enclosure.position.y ?? 0,
    enclosure.position.z ?? 0,
  )
  if (enclosure.rotation) {
    mesh.rotation.set(
      THREE.MathUtils.degToRad(enclosure.rotation.x ?? 0),
      THREE.MathUtils.degToRad(enclosure.rotation.y ?? 0),
      THREE.MathUtils.degToRad(enclosure.rotation.z ?? 0),
    )
  }

  scene.add(mesh)
}
