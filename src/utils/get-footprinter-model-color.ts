import type { ColoredGeom } from "jscad-electronics/vanilla"
import * as THREE from "three"

export function getFootprinterModelColor(color: ColoredGeom["color"]) {
  // JSCAD RGB(A) arrays already contain linear RGB, unlike CSS colors.
  return Array.isArray(color)
    ? new THREE.Color().setRGB(color[0], color[1], color[2])
    : new THREE.Color(color).convertLinearToSRGB()
}
