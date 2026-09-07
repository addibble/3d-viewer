import jscad from "@jscad/modeling"
import type { AnyCircuitElement } from "circuit-json"
import {
  convertCSGToThreeGeom,
  getJscadModelForFootprint,
} from "jscad-electronics/vanilla"
import { executeJscadOperations } from "jscad-planner"
import * as THREE from "three"
import * as jscadModeling from "@jscad/modeling"
import { load3DModel } from "./load-model"
import type { CadComponent } from "circuit-json"
import {
  getCadModelObjectMatrix,
  getCadModelTransform,
} from "./cad-model-transform"
import type { RenderedCadModelType } from "./get-cad-model-type"

export async function renderComponent(
  component: CadComponent,
  scene: THREE.Scene,
  options: { layer: string; pcbThickness: number } = {
    layer: "top",
    pcbThickness: 1.6,
  },
) {
  const addPlacedModel = (
    model: THREE.Object3D,
    modelType: RenderedCadModelType,
  ) => {
    const group = new THREE.Group()
    group.matrixAutoUpdate = false
    group.matrix.copy(
      getCadModelObjectMatrix(
        model,
        getCadModelTransform(component, { ...options, modelType }).placement,
      ),
    )
    group.add(model)
    scene.add(group)
  }
  // Handle STL/OBJ models first
  const url =
    component.model_obj_url ??
    component.model_wrl_url ??
    component.model_stl_url ??
    component.model_glb_url ??
    component.model_gltf_url
  if (url) {
    const model = await load3DModel(url)
    if (model) {
      addPlacedModel(
        model,
        component.model_obj_url
          ? "obj"
          : component.model_wrl_url
            ? "wrl"
            : component.model_stl_url
              ? "stl"
              : "glb",
      )
      return
    }
  }

  // Handle JSCAD models
  if (component.model_jscad) {
    const jscadObject = executeJscadOperations(
      jscad as any,
      component.model_jscad,
    )
    if (jscadObject && (jscadObject.polygons || jscadObject.sides)) {
      const threeGeom = convertCSGToThreeGeom(jscadObject)
      const material = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.5,
        roughness: 0.5,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(threeGeom, material)

      addPlacedModel(mesh, "jscad")
    }
    return
  }

  // Handle footprints
  if (component.footprinter_string) {
    const { geometries } = getJscadModelForFootprint(
      component.footprinter_string,
      jscadModeling,
    )

    const group = new THREE.Group()
    // Fit the complete footprint, not each colored solid independently.
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
        metalness: 0.2,
        roughness: 0.8,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(threeGeom, material)

      group.add(mesh)
    }
    if (group.children.length) addPlacedModel(group, "footprinter")
    return
  }

  // Add fallback box for failed components
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
  const material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.25,
  })
  const mesh = new THREE.Mesh(geometry, material)

  if (component.position) {
    mesh.position.set(
      component.position.x ?? 0,
      component.position.y ?? 0,
      (component.position.z ?? 0) + 0.5,
    )
  }
  scene.add(mesh)
}
