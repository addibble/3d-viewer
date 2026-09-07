import * as THREE from "three"
import { getCadModelFitScaleFromBounds } from "@tscircuit/circuit-json-util"

export type CadModelFitMode = "contain_within_bounds" | "fill_bounds"
export type CadModelSize = [number, number, number]

export function getObjectBoundsRelativeToParent(
  object: THREE.Object3D,
): THREE.Box3 | null {
  const bounds = new THREE.Box3()
  let hasBounds = false

  object.updateWorldMatrix(true, false)
  const parentInverseMatrix = object.parent
    ? object.parent.matrixWorld.clone().invert()
    : new THREE.Matrix4()

  object.traverse((node) => {
    node.updateWorldMatrix(true, false)
    if (!(node instanceof THREE.Mesh)) return
    const positions = node.geometry.getAttribute("position")
    if (!positions) return
    // Measure vertices in the native frame once. Transforming a child's AABB
    // instead would include empty corners and shrink rotated non-box models.
    const localMatrix = parentInverseMatrix.clone().multiply(node.matrixWorld)
    const point = new THREE.Vector3()
    const index = node.geometry.getIndex()
    const count = index?.count ?? positions.count
    for (let i = 0; i < count; i++) {
      point
        .fromBufferAttribute(positions, index ? index.getX(i) : i)
        .applyMatrix4(localMatrix)
      bounds.expandByPoint(point)
      hasBounds = true
    }
  })

  return hasBounds ? bounds : null
}

export function getCadModelFitScale(
  object: THREE.Object3D,
  targetSize?: CadModelSize,
  fitMode: CadModelFitMode = "contain_within_bounds",
): [number, number, number] {
  if (!targetSize) {
    return [1, 1, 1]
  }

  const bounds = getObjectBoundsRelativeToParent(object)
  // This legacy API assigns ratio 1 to absent/flat axes. Canonical placement
  // instead ignores flat axes for contain and rejects them for fill.
  if (!bounds) return [1, 1, 1]
  const size = bounds.getSize(new THREE.Vector3())
  if (size.x === 0 || size.y === 0 || size.z === 0) {
    const ratios: [number, number, number] = [
      size.x > 0 ? targetSize[0] / size.x : 1,
      size.y > 0 ? targetSize[1] / size.y : 1,
      size.z > 0 ? targetSize[2] / size.z : 1,
    ]
    if (fitMode === "fill_bounds") return ratios
    const uniform = Math.min(...ratios)
    return [uniform, uniform, uniform]
  }
  const fitScale = getCadModelFitScaleFromBounds(
    { min: bounds.min, max: bounds.max },
    { x: targetSize[0], y: targetSize[1], z: targetSize[2] },
    fitMode,
  )
  return [fitScale.x, fitScale.y, fitScale.z]
}
