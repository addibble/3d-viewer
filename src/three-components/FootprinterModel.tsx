import {
  convertCSGToThreeGeom,
  getJscadModelForFootprint,
} from "jscad-electronics/vanilla"
import { useMemo, useEffect } from "react"
import * as jscadModeling from "@jscad/modeling"
import * as THREE from "three"
import ContainerWithTooltip from "src/ContainerWithTooltip"
import { configureObjectShadows } from "src/utils/configure-object-shadows"
import type { CadModelPlacementInput } from "src/utils/cad-model-transform"
import { useCadModelTransformGraph } from "./useCadModelTransformGraph"

export const FootprinterModel = ({
  positionOffset,
  footprint,
  rotationOffset,
  onHover,
  onUnhover,
  isHovered,
  scale,
  cadPlacement,
  isTranslucent = false,
}: {
  positionOffset: any
  footprint: string
  rotationOffset?: [number, number, number]
  onHover: (e: any) => void
  onUnhover: () => void
  isHovered: boolean
  scale?: number
  cadPlacement?: CadModelPlacementInput
  isTranslucent?: boolean
}) => {
  const group = useMemo(() => {
    if (!footprint) return null
    const { geometries } = getJscadModelForFootprint(footprint, jscadModeling)

    const group = new THREE.Group()

    for (const geomInfo of geometries.flat(Infinity) as any[]) {
      const geom = geomInfo.geom
      if (!geom || (!geom.polygons && !geom.sides)) {
        continue
      }
      const color = new THREE.Color(geomInfo.color)
      color.convertLinearToSRGB()
      const geomWithColor = { ...geom, color: [color.r, color.g, color.b] }

      const threeGeom = convertCSGToThreeGeom(geomWithColor)
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: isTranslucent,
        opacity: isTranslucent ? 0.5 : 1,
        depthWrite: !isTranslucent,
      })
      const mesh = new THREE.Mesh(threeGeom, material)
      mesh.renderOrder = isTranslucent ? 2 : 1
      configureObjectShadows(mesh, {
        castShadow: !isTranslucent,
        receiveShadow: true,
      })
      group.add(mesh)
    }

    return group
  }, [footprint, isTranslucent])

  const { boardTransformGroup } = useCadModelTransformGraph({
    model: group,
    position: positionOffset,
    rotation: rotationOffset,
    scale,
    cadPlacement,
  })

  useEffect(() => {
    if (!group) return
    group.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        if (isHovered) {
          child.material.emissive.setHex(0x0000ff)
          child.material.emissiveIntensity = 0.2
        } else {
          child.material.emissiveIntensity = 0
        }
      }
    })
  }, [isHovered, group])

  if (!group) return null

  return (
    <ContainerWithTooltip
      isHovered={isHovered}
      onHover={onHover}
      onUnhover={onUnhover}
      object={boardTransformGroup}
    >
      {/* group is now added imperatively */}
    </ContainerWithTooltip>
  )
}
