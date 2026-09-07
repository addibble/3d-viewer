import type {
  CadComponent,
  CadModelAxisDirection,
  CadModelFormat,
} from "circuit-json"
import type { CadModelType, RenderedCadModelType } from "./get-cad-model-type"
import * as THREE from "three"
import {
  applyMat4ToPoint3,
  composeMat4,
  mat4,
  quaternionFromEulerDegrees,
} from "@tscircuit/circuit-json-util"

export interface CoordinateTransformConfig {
  axisMapping?: { x?: string; y?: string; z?: string }
  flipX?: number
  flipY?: number
  flipZ?: number
  rotation?: { x?: number; y?: number; z?: number }
}

export interface GetDefaultModelTransformOptions {
  coordinateTransform?: CoordinateTransformConfig
  usingGlbCoordinates: boolean
  usingObjFormat: boolean
  usingStepFormat: boolean
  hasFootprinterModel: boolean
}

export function applyCoordinateTransform(
  point: { x: number; y: number; z: number },
  config: CoordinateTransformConfig,
): { x: number; y: number; z: number } {
  return applyMat4ToPoint3(getCadLoaderTransformMatrix(config)!.elements, point)
}

function getAxisValue(
  original: { x: number; y: number; z: number },
  mapping: string,
): number {
  switch (mapping) {
    case "x":
      return original.x
    case "y":
      return original.y
    case "z":
      return original.z
    case "-x":
      return -original.x
    case "-y":
      return -original.y
    case "-z":
      return -original.z
    default:
      throw new Error(`Invalid coordinate axis mapping: ${mapping}`)
  }
}

export const COORDINATE_TRANSFORMS = {
  Z_UP_TO_Y_UP: {
    axisMapping: { x: "x", y: "-z", z: "y" },
  } as CoordinateTransformConfig,

  Z_OUT_OF_TOP: {
    axisMapping: { x: "x", y: "z", z: "-y" },
  } as CoordinateTransformConfig,

  STEP_INVERTED: {
    axisMapping: { x: "-x", y: "z", z: "-y" },
  } as CoordinateTransformConfig,

  USB_PORT_FIX: {
    flipY: -1,
  } as CoordinateTransformConfig,

  Z_UP_TO_Y_UP_USB_FIX: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    flipZ: -1,
  } as CoordinateTransformConfig,

  FOOTPRINTER_MODEL_TRANSFORM: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    flipX: -1,
    rotation: { x: 180, y: 180 },
  } as CoordinateTransformConfig,

  IDENTITY: {} as CoordinateTransformConfig,

  TEST_ROTATE_X_90: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    rotation: { x: 90 },
  } as CoordinateTransformConfig,

  TEST_ROTATE_X_270: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    rotation: { x: 270 },
  } as CoordinateTransformConfig,

  TEST_ROTATE_Y_90: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    rotation: { y: 90 },
  } as CoordinateTransformConfig,

  TEST_ROTATE_Y_270: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    rotation: { y: 270 },
  } as CoordinateTransformConfig,

  TEST_ROTATE_Z_90: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    rotation: { z: 90 },
  } as CoordinateTransformConfig,

  TEST_ROTATE_Z_270: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    rotation: { z: 270 },
  } as CoordinateTransformConfig,

  TEST_FLIP_X: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    flipX: -1,
  } as CoordinateTransformConfig,

  TEST_FLIP_Z: {
    axisMapping: { x: "x", y: "-z", z: "y" },
    flipZ: -1,
  } as CoordinateTransformConfig,

  OBJ_Z_UP_TO_Y_UP: {
    axisMapping: { x: "x", y: "z", z: "y" },
  } as CoordinateTransformConfig,
} as const

export function getDefaultModelTransform(
  cad: CadComponent & {
    model_board_normal_direction?: CadModelAxisDirection
  },
  options: GetDefaultModelTransformOptions,
): CoordinateTransformConfig | undefined {
  if (options.coordinateTransform) {
    return options.coordinateTransform
  }

  if (options.usingGlbCoordinates) {
    return undefined
  }
  if (options.hasFootprinterModel) {
    return COORDINATE_TRANSFORMS.FOOTPRINTER_MODEL_TRANSFORM
  }
  if (options.usingObjFormat) {
    return undefined
  }
  if (options.usingStepFormat) {
    return COORDINATE_TRANSFORMS.STEP_INVERTED
  }
  return COORDINATE_TRANSFORMS.Z_UP_TO_Y_UP_USB_FIX
}

export function getCadLoaderTransformConfig(
  cad: CadComponent & {
    model_board_normal_direction?: CadModelAxisDirection
  },
  modelType: CadModelType | RenderedCadModelType,
): CoordinateTransformConfig | undefined {
  return getDefaultModelTransform(cad, {
    usingGlbCoordinates:
      modelType === "gltf" || modelType === "glb" || modelType === "jscad",
    usingObjFormat: modelType === "obj" || modelType === "wrl",
    usingStepFormat: modelType === "step",
    hasFootprinterModel: modelType === "footprinter",
  })
}

export function getCadLoaderTransformMatrix(
  config?: CoordinateTransformConfig,
): THREE.Matrix4 | undefined {
  if (!config) {
    return undefined
  }

  const basis = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ].map(
    (point) =>
      new THREE.Vector3(
        getAxisValue(point, config.axisMapping?.x ?? "x"),
        getAxisValue(point, config.axisMapping?.y ?? "y"),
        getAxisValue(point, config.axisMapping?.z ?? "z"),
      ),
  )
  const mapping = new THREE.Matrix4().makeBasis(basis[0]!, basis[1]!, basis[2]!)
  // Intrinsic ZYX is the old extrinsic X -> Y -> Z order, after map/flips.
  const rotation = quaternionFromEulerDegrees(
    {
      x: config.rotation?.x ?? 0,
      y: config.rotation?.y ?? 0,
      z: config.rotation?.z ?? 0,
    },
    "zyx",
  )
  return new THREE.Matrix4().fromArray(
    composeMat4(
      mat4.fromQuat(new Float64Array(16), rotation),
      mat4.fromScaling(new Float64Array(16), [
        config.flipX ?? 1,
        config.flipY ?? 1,
        config.flipZ ?? 1,
      ]),
      mapping.elements,
    ),
  )
}
