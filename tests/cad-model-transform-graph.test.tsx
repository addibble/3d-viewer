import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act, StrictMode } from "react"
import { createRoot } from "react-dom/client"
import * as THREE from "three"
import type { CadComponent } from "circuit-json"
import { ThreeContext } from "../src/react-three/ThreeContext"
import { useCadModelTransformGraph } from "../src/three-components/useCadModelTransformGraph"
import {
  getCadModelObjectMatrix,
  getCadModelTransform,
} from "../src/utils/cad-model-transform"

test("the live graph consumes the composed matrix once across StrictMode and updates", async () => {
  const dom = new JSDOM('<div id="root"></div>')
  const previous = { window: globalThis.window, document: globalThis.document }
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  const reactRoot = createRoot(document.getElementById("root")!)
  const rootObject = new THREE.Group()
  const model = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4, 20).translate(13, 22, 40),
  )
  const cad: CadComponent = {
    type: "cad_component",
    cad_component_id: "cad",
    pcb_component_id: "pcb",
    source_component_id: "source",
    anchor_alignment: "center",
    position: { x: 7, y: -5, z: 2 },
    rotation: { x: 17, y: 31, z: 47 },
    model_origin_position: { x: 10, y: 20, z: 30 },
    model_board_normal_direction: "y+",
    size: { x: 12, y: 12, z: 10 },
    model_object_fit: "fill_bounds",
  }
  function Probe({ component }: { component: CadComponent }) {
    useCadModelTransformGraph({
      model,
      cadPlacement: getCadModelTransform(component, {
        layer: "top",
        pcbThickness: 1.6,
        modelType: "obj",
      }).placement,
      position: [999, 999, 999],
      modelOffset: [100, 100, 100],
      modelRotation: [1, 2, 3],
      scale: 50,
      sourceCoordinateTransform: new THREE.Matrix4().makeScale(10, 10, 10),
    })
    return null
  }
  try {
    for (const component of [
      cad,
      { ...cad, position: { x: 13, y: 17, z: 19 } },
    ]) {
      const expected = getCadModelObjectMatrix(
        model,
        getCadModelTransform(component, {
          layer: "top",
          pcbThickness: 1.6,
          modelType: "obj",
        }).placement,
      )
      await act(async () =>
        reactRoot.render(
          <StrictMode>
            <ThreeContext.Provider
              value={{
                scene: new THREE.Scene(),
                camera: new THREE.Camera(),
                renderer: Object.create(THREE.WebGLRenderer.prototype),
                rootObject,
                addFrameListener: () => {},
                removeFrameListener: () => {},
              }}
            >
              <Probe component={component} />
            </ThreeContext.Provider>
          </StrictMode>,
        ),
      )
      rootObject.updateMatrixWorld(true)
      expect(rootObject.children).toHaveLength(1)
      for (let i = 0; i < 16; i++)
        expect(model.matrixWorld.elements[i]).toBeCloseTo(
          expected.elements[i]!,
          4,
        )
      expect(rootObject.children[0]!.matrixAutoUpdate).toBe(false)
    }
  } finally {
    await act(async () => reactRoot.unmount())
    Object.assign(globalThis, previous, { IS_REACT_ACT_ENVIRONMENT: false })
    dom.window.close()
  }
})
