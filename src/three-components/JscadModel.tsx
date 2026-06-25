import type { JscadOperation } from "jscad-planner"
import { executeJscadOperations } from "jscad-planner"
import jscad from "@jscad/modeling"
import { convertCSGToThreeGeom } from "jscad-electronics/vanilla"
import * as THREE from "three"
import { useMemo, useEffect } from "react"
import ContainerWithTooltip from "src/ContainerWithTooltip"
import type { CadModelFitMode, CadModelSize } from "src/utils/cad-model-fit"
import { configureObjectShadows } from "src/utils/configure-object-shadows"
import { useCadModelTransformGraph } from "./useCadModelTransformGraph"

export const JscadModel = ({
  jscadPlan,
  positionOffset,
  rotationOffset,
  modelOffset = [0, 0, 0],
  modelRotation = [0, 0, 0],
  sourceCoordinateTransform,
  modelSize,
  modelFitMode = "contain_within_bounds",
  onHover,
  onUnhover,
  isHovered,
  scale,
  isTranslucent = false,
  opacity = 1,
}: {
  jscadPlan: JscadOperation
  positionOffset?: [number, number, number]
  rotationOffset?: [number, number, number]
  modelOffset?: [number, number, number]
  modelRotation?: [number, number, number]
  sourceCoordinateTransform?: THREE.Matrix4
  modelSize?: CadModelSize
  modelFitMode?: CadModelFitMode
  onHover: (e: any) => void
  onUnhover: () => void
  isHovered: boolean
  scale?: number
  isTranslucent?: boolean
  /** Per-part opacity in [0,1]; 1 = opaque, <1 = transparent. */
  opacity?: number
}) => {
  const { threeGeom, material } = useMemo(() => {
    const jscadObject = executeJscadOperations(jscad as any, jscadPlan)

    if (!jscadObject || (!jscadObject.polygons && !jscadObject.sides)) {
      return { threeGeom: null, material: null }
    }

    const threeGeom = convertCSGToThreeGeom(jscadObject)

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: isTranslucent,
      opacity: isTranslucent ? 0.5 : 1,
      depthWrite: !isTranslucent,
    })
    return { threeGeom, material }
  }, [jscadPlan, isTranslucent])

  const mesh = useMemo(() => {
    if (!threeGeom) return null
    const createdMesh = new THREE.Mesh(threeGeom, material)
    createdMesh.renderOrder = isTranslucent ? 2 : 1
    configureObjectShadows(createdMesh, {
      castShadow: !isTranslucent,
      receiveShadow: true,
    })
    return createdMesh
  }, [threeGeom, material, isTranslucent])

  // Apply per-part opacity by mutating the material (avoids rebuilding the
  // geometry on every slider tick). Translucent models are capped at 0.5.
  useEffect(() => {
    if (!material || !mesh) return
    const effectiveOpacity = isTranslucent ? Math.min(opacity, 0.5) : opacity
    const isTransparent = effectiveOpacity < 1
    material.transparent = isTransparent
    material.opacity = effectiveOpacity
    material.depthWrite = !isTransparent
    material.needsUpdate = true
    mesh.renderOrder = isTransparent ? 2 : 1
  }, [material, mesh, opacity, isTranslucent])
  const { boardTransformGroup } = useCadModelTransformGraph({
    model: mesh,
    position: positionOffset,
    rotation: rotationOffset,
    modelOffset,
    modelRotation,
    sourceCoordinateTransform,
    modelSize,
    modelFitMode,
    scale,
  })

  useEffect(() => {
    if (!material) return
    if (isHovered) {
      const color = new THREE.Color(material.color.getHex())
      material.emissive.copy(color)
      material.emissive.setRGB(0, 0, 1)
      material.emissiveIntensity = 0.2
    } else {
      material.emissiveIntensity = 0
    }
  }, [isHovered, material])

  if (!threeGeom) return null

  return (
    <ContainerWithTooltip
      isHovered={isHovered}
      onHover={onHover}
      onUnhover={onUnhover}
      object={boardTransformGroup}
    >
      {/* mesh is now added imperatively */}
    </ContainerWithTooltip>
  )
}
