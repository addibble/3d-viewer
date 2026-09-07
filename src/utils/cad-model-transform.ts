import {
  composeMat4,
  getCadModelBoardNormalQuaternion,
  getCadModelPlacement,
  mat4,
} from "@tscircuit/circuit-json-util"
import type { CadComponent, Point3 } from "circuit-json"
import * as THREE from "three"
import { getObjectBoundsRelativeToParent } from "./cad-model-fit"
import {
  getCadLoaderTransformConfig,
  getCadLoaderTransformMatrix,
} from "./cad-model-loader-transform"
import type { RenderedCadModelType } from "./get-cad-model-type"

type Layer = "top" | "bottom" | string

/** Decoded asset coordinates -> Circuit JSON Z-up model coordinates. */
export type CadModelPlacementInput = {
  cad: CadComponent
  nativeToCanonicalModel: THREE.Matrix4
  /** Known loader board datum, in native coordinates and units. */
  boardContactPoint?: Point3
}

export type CadModelTransform = {
  position?: [number, number, number]
  rotation: [number, number, number]
  modelPosition: [number, number, number]
  modelRotation: [number, number, number]
  scale?: number
  fitMode: "contain_within_bounds" | "fill_bounds"
  size?: [number, number, number]
}

export function getCadModelTransform(
  cadComponent: CadComponent,
  options: {
    layer: Layer
    pcbThickness: number
    modelType: RenderedCadModelType
  },
): CadModelTransform & { placement: CadModelPlacementInput } {
  const position: [number, number, number] | undefined = cadComponent.position
    ? [
        cadComponent.position.x,
        cadComponent.position.y,
        options.layer === "bottom" && cadComponent.position.z >= 0
          ? -(cadComponent.position.z + options.pcbThickness)
          : cadComponent.position.z,
      ]
    : undefined
  const rotationDegrees = cadComponent.rotation ?? {
    x: options.layer === "bottom" ? 180 : 0,
    y: 0,
    z: 0,
  }
  const rotation: [number, number, number] = [
    THREE.MathUtils.degToRad(rotationDegrees.x),
    THREE.MathUtils.degToRad(rotationDegrees.y),
    THREE.MathUtils.degToRad(rotationDegrees.z),
  ]
  const nativeToCanonicalModel =
    getCadLoaderTransformMatrix(
      getCadLoaderTransformConfig(cadComponent, options.modelType),
    ) ?? new THREE.Matrix4()

  // Retain the public split position/Euler interface at this boundary only.
  // The scene graph below consumes placement.nativeToWorld, not these fields.
  const origin = new THREE.Vector3(
    cadComponent.model_origin_position?.x ?? 0,
    cadComponent.model_origin_position?.y ?? 0,
    cadComponent.model_origin_position?.z ?? 0,
  ).applyMatrix4(nativeToCanonicalModel)
  const legacyMatrix = new THREE.Matrix4().fromArray(
    mat4.fromQuat(
      new Float64Array(16),
      getCadModelBoardNormalQuaternion(
        cadComponent.model_board_normal_direction,
      ),
    ),
  )
  legacyMatrix.setPosition(origin.applyMatrix4(legacyMatrix).multiplyScalar(-1))
  const modelEuler = new THREE.Euler().setFromRotationMatrix(
    legacyMatrix,
    "XYZ",
  )

  return {
    position,
    rotation,
    modelPosition: new THREE.Vector3()
      .setFromMatrixPosition(legacyMatrix)
      .toArray(),
    modelRotation: [modelEuler.x, modelEuler.y, modelEuler.z],
    scale: cadComponent.model_unit_to_mm_scale_factor ?? undefined,
    fitMode: cadComponent.model_object_fit ?? "contain_within_bounds",
    size: cadComponent.size
      ? [cadComponent.size.x, cadComponent.size.y, cadComponent.size.z]
      : undefined,
    placement: {
      cad: {
        ...cadComponent,
        position: {
          x: position?.[0] ?? 0,
          y: position?.[1] ?? 0,
          z: position?.[2] ?? 0,
        },
        rotation: rotationDegrees,
      },
      // The direct footprinter loader produces Z-up JSCAD, not the exporter's
      // serialized GLB frame. Its board datum is zero even when pins extend below.
      nativeToCanonicalModel:
        options.modelType === "footprinter"
          ? new THREE.Matrix4()
          : nativeToCanonicalModel,
      boardContactPoint:
        options.modelType === "footprinter" ? { x: 0, y: 0, z: 0 } : undefined,
    },
  }
}

/**
 * Measure the decoded Three subtree in its parent's native asset frame, then
 * place it once in the viewer's Circuit JSON Z-up world (mm). Node transforms
 * stay on the loaded subtree; they are included in measurement, not reapplied.
 */
export function getCadModelObjectMatrix(
  model: THREE.Object3D,
  {
    cad,
    nativeToCanonicalModel,
    boardContactPoint: knownBoardContactPoint,
  }: CadModelPlacementInput,
): THREE.Matrix4 {
  const bounds = getObjectBoundsRelativeToParent(model)
  if (!bounds) throw new Error("Cannot place a CAD model without mesh bounds")
  const nativeBounds = { min: bounds.min, max: bounds.max }
  const alignment = cad.model_origin_alignment ?? cad.anchor_alignment
  let boardContactPoint = knownBoardContactPoint

  if (
    !cad.model_origin_position &&
    !boardContactPoint &&
    alignment === "center_of_component_on_board_surface"
  ) {
    const alignmentMatrix = new THREE.Matrix4().fromArray(
      composeMat4(
        mat4.fromQuat(
          new Float64Array(16),
          getCadModelBoardNormalQuaternion(
            cad.model_board_normal_direction,
            nativeToCanonicalModel.elements,
          ),
        ),
        nativeToCanonicalModel.elements,
      ),
    )
    const parentInverse = model.parent
      ? model.parent.matrixWorld.clone().invert()
      : new THREE.Matrix4()
    const points: THREE.Vector3[] = []
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      const positions = node.geometry.getAttribute("position")
      if (!positions) return
      const matrix = alignmentMatrix
        .clone()
        .multiply(parentInverse)
        .multiply(node.matrixWorld)
      const index = node.geometry.getIndex()
      const count = index?.count ?? positions.count
      for (let i = 0; i < count; i++) {
        points.push(
          new THREE.Vector3()
            .fromBufferAttribute(positions, index ? index.getX(i) : i)
            .applyMatrix4(matrix),
        )
      }
    })
    const alignedBounds = new THREE.Box3().setFromPoints(points)
    const tolerance = Math.max(
      1e-6,
      (alignedBounds.max.z - alignedBounds.min.z) * 1e-5,
    )
    const contactBounds = new THREE.Box3().setFromPoints(
      points.filter(
        (point) => Math.abs(point.z - alignedBounds.min.z) <= tolerance,
      ),
    )
    if (contactBounds.isEmpty())
      throw new Error("Cannot measure the CAD model's board contact patch")
    boardContactPoint = contactBounds
      .getCenter(new THREE.Vector3())
      .applyMatrix4(alignmentMatrix.invert())
  }

  const placement = getCadModelPlacement(cad, {
    nativeBounds,
    nativeToCanonicalModel: nativeToCanonicalModel.elements,
    sizeSpace: "native",
    boardContactPoint,
  })
  return new THREE.Matrix4().fromArray(placement.nativeToWorld)
}
