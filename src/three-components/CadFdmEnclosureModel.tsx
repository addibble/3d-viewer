import type { CadFdmEnclosure } from "circuit-json"
import { useState } from "react"
import { JscadModel } from "./JscadModel"

/**
 * Renders a generated FDM enclosure part.
 *
 * Unlike `cad_component`, this record has no PCB owner and needs none of the
 * asset-normalization that imported OBJ/STEP/STL models do: the JSCAD plan is
 * authored by tscircuit in the Circuit world frame, so its origin is already
 * (0,0,0), its up axis is already Circuit +Z, and its size is *reported by* the
 * geometry rather than a bound to scale into. `position` and `rotation` alone
 * place it -- deliberately no `sourceCoordinateTransform`, `modelOffset`,
 * `modelSize`, or `modelFitMode`.
 */
export const CadFdmEnclosureModel = ({
  cad_fdm_enclosure,
}: {
  cad_fdm_enclosure: CadFdmEnclosure
}) => {
  const [isHovered, setIsHovered] = useState(false)

  if (!cad_fdm_enclosure.model_jscad) return null

  const { position, rotation } = cad_fdm_enclosure

  return (
    <JscadModel
      key={cad_fdm_enclosure.cad_fdm_enclosure_id}
      jscadPlan={cad_fdm_enclosure.model_jscad}
      positionOffset={[position.x, position.y, position.z]}
      rotationOffset={
        rotation
          ? [
              (rotation.x * Math.PI) / 180,
              (rotation.y * Math.PI) / 180,
              (rotation.z * Math.PI) / 180,
            ]
          : [0, 0, 0]
      }
      scale={cad_fdm_enclosure.model_unit_to_mm_scale_factor ?? 1}
      isTranslucent={cad_fdm_enclosure.show_as_translucent_model}
      onHover={() => setIsHovered(true)}
      onUnhover={() => setIsHovered(false)}
      isHovered={isHovered}
    />
  )
}
