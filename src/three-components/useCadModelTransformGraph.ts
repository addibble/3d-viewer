import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { mat4, quaternionFromEulerDegrees } from "@tscircuit/circuit-json-util"
import { useThree } from "src/react-three/ThreeContext"
import {
  getCadModelObjectMatrix,
  type CadModelPlacementInput,
} from "src/utils/cad-model-transform"
import {
  getCadModelFitScale,
  type CadModelFitMode,
  type CadModelSize,
} from "src/utils/cad-model-fit"

interface UseCadModelTransformGraphOptions {
  model: THREE.Object3D | null
  position?: [number, number, number]
  rotation?: [number, number, number]
  modelOffset?: [number, number, number]
  modelRotation?: [number, number, number]
  sourceCoordinateTransform?: THREE.Matrix4
  modelSize?: CadModelSize
  modelFitMode?: CadModelFitMode
  scale?: number
  cadPlacement?: CadModelPlacementInput
}

export const useCadModelTransformGraph = ({
  model,
  position,
  rotation,
  modelOffset = [0, 0, 0],
  modelRotation = [0, 0, 0],
  sourceCoordinateTransform,
  modelSize,
  modelFitMode = "contain_within_bounds",
  scale,
  cadPlacement,
}: UseCadModelTransformGraphOptions) => {
  const { rootObject } = useThree()
  const boardTransformGroup = useMemo(() => new THREE.Group(), [])
  const fitTransformGroup = useMemo(() => new THREE.Group(), [])
  const modelTransformGroup = useMemo(() => new THREE.Group(), [])
  const loaderTransformGroup = useMemo(() => new THREE.Group(), [])

  useEffect(() => {
    boardTransformGroup.add(fitTransformGroup)
    return () => {
      boardTransformGroup.remove(fitTransformGroup)
    }
  }, [boardTransformGroup, fitTransformGroup])

  useEffect(() => {
    fitTransformGroup.add(modelTransformGroup)
    return () => {
      fitTransformGroup.remove(modelTransformGroup)
    }
  }, [fitTransformGroup, modelTransformGroup])

  useEffect(() => {
    modelTransformGroup.add(loaderTransformGroup)
    return () => {
      modelTransformGroup.remove(loaderTransformGroup)
    }
  }, [modelTransformGroup, loaderTransformGroup])

  useEffect(() => {
    while (loaderTransformGroup.children.length > 0) {
      const firstChild = loaderTransformGroup.children[0]
      if (!firstChild) break
      loaderTransformGroup.remove(firstChild)
    }
    if (model) {
      loaderTransformGroup.add(model)
    }
  }, [loaderTransformGroup, model])

  useEffect(() => {
    loaderTransformGroup.matrixAutoUpdate = false
    if (sourceCoordinateTransform && !cadPlacement) {
      loaderTransformGroup.matrix.copy(sourceCoordinateTransform)
    } else {
      loaderTransformGroup.matrix.identity()
    }
    loaderTransformGroup.matrixWorldNeedsUpdate = true
  }, [loaderTransformGroup, sourceCoordinateTransform, cadPlacement])

  useEffect(() => {
    if (!rootObject) return

    rootObject.add(boardTransformGroup)
    return () => {
      rootObject.remove(boardTransformGroup)
    }
  }, [rootObject, boardTransformGroup])

  useEffect(() => {
    if (cadPlacement && model) {
      const matrix = getCadModelObjectMatrix(model, cadPlacement)
      boardTransformGroup.matrixAutoUpdate = false
      boardTransformGroup.matrix.copy(matrix)
      boardTransformGroup.matrixWorldNeedsUpdate = true
      fitTransformGroup.scale.set(1, 1, 1)
      modelTransformGroup.matrixAutoUpdate = false
      modelTransformGroup.matrix.identity()
      modelTransformGroup.matrixWorldNeedsUpdate = true
      return
    }
    const degrees = 180 / Math.PI
    const boardQuaternion = quaternionFromEulerDegrees(
      {
        x: (rotation?.[0] ?? 0) * degrees,
        y: (rotation?.[1] ?? 0) * degrees,
        z: (rotation?.[2] ?? 0) * degrees,
      },
      "xyz",
    )
    const modelQuaternion = quaternionFromEulerDegrees(
      {
        x: modelRotation[0] * degrees,
        y: modelRotation[1] * degrees,
        z: modelRotation[2] * degrees,
      },
      "xyz",
    )
    boardTransformGroup.matrixAutoUpdate = false
    boardTransformGroup.matrix.fromArray(
      mat4.fromRotationTranslation(
        new Float64Array(16),
        boardQuaternion,
        position ?? [0, 0, 0],
      ),
    )
    boardTransformGroup.matrixWorldNeedsUpdate = true
    modelTransformGroup.matrixAutoUpdate = false
    modelTransformGroup.matrix.fromArray(
      mat4.fromRotationTranslationScale(
        new Float64Array(16),
        modelQuaternion,
        modelOffset,
        [scale ?? 1, scale ?? 1, scale ?? 1],
      ),
    )
    modelTransformGroup.matrixWorldNeedsUpdate = true

    if (!model) {
      fitTransformGroup.scale.set(1, 1, 1)
      return
    }

    fitTransformGroup.scale.set(1, 1, 1)
    fitTransformGroup.updateWorldMatrix(true, true)
    const fitScale = getCadModelFitScale(
      modelTransformGroup,
      modelSize,
      modelFitMode,
    )
    fitTransformGroup.scale.set(fitScale[0], fitScale[1], fitScale[2])
  }, [
    boardTransformGroup,
    cadPlacement,
    fitTransformGroup,
    model,
    modelFitMode,
    modelOffset,
    loaderTransformGroup,
    modelTransformGroup,
    modelRotation,
    modelSize,
    position,
    rotation,
    scale,
    sourceCoordinateTransform,
  ])

  return { boardTransformGroup }
}
