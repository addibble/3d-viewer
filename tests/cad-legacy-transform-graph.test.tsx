import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import * as THREE from "three"
import { ThreeContext } from "../src/react-three/ThreeContext"
import { useCadModelTransformGraph } from "../src/three-components/useCadModelTransformGraph"

test("legacy position and Euler props retain board-fit-origin-rotation-unit-loader order", async () => {
  const dom = new JSDOM('<div id="root"></div>')
  const previous = { window: globalThis.window, document: globalThis.document }
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  const reactRoot = createRoot(document.getElementById("root")!)
  const rootObject = new THREE.Group()
  const model = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6))
  const position: [number, number, number] = [7, 11, 13]
  const rotation: [number, number, number] = [0.11, 0.22, 0.33]
  const offset: [number, number, number] = [1, 2, 3]
  const modelRotation: [number, number, number] = [0.3, 0.5, 0.7]
  const target: [number, number, number] = [20, 30, 40]
  function Probe({ source }: { source: THREE.Matrix4 }) {
    useCadModelTransformGraph({
      model,
      position,
      rotation,
      modelOffset: offset,
      modelRotation,
      sourceCoordinateTransform: source,
      scale: 2,
      modelSize: target,
      modelFitMode: "fill_bounds",
    })
    return null
  }
  try {
    for (const source of [
      new THREE.Matrix4().makeRotationZ(0.4),
      new THREE.Matrix4().makeRotationZ(0.4).scale(new THREE.Vector3(3, 1, 1)),
    ]) {
      const expectedModel = new THREE.Mesh(model.geometry)
      const loader = new THREE.Group()
      loader.matrixAutoUpdate = false
      loader.matrix.copy(source)
      loader.add(expectedModel)
      const local = new THREE.Group()
      local.position.fromArray(offset)
      local.rotation.set(...modelRotation)
      local.scale.setScalar(2)
      local.add(loader)
      const nativeSize = new THREE.Box3()
        .setFromObject(local)
        .getSize(new THREE.Vector3())
      const fit = new THREE.Group()
      fit.scale.set(
        target[0] / nativeSize.x,
        target[1] / nativeSize.y,
        target[2] / nativeSize.z,
      )
      fit.add(local)
      const board = new THREE.Group()
      board.position.fromArray(position)
      board.rotation.set(...rotation)
      board.add(fit)
      board.updateMatrixWorld(true)
      await act(async () =>
        reactRoot.render(
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
            <Probe source={source} />
          </ThreeContext.Provider>,
        ),
      )
      rootObject.updateMatrixWorld(true)
      expect(rootObject.children).toHaveLength(1)
      for (let i = 0; i < 16; i++)
        expect(model.matrixWorld.elements[i]).toBeCloseTo(
          expectedModel.matrixWorld.elements[i]!,
          5,
        )
    }
  } finally {
    await act(async () => reactRoot.unmount())
    Object.assign(globalThis, previous, { IS_REACT_ACT_ENVIRONMENT: false })
    dom.window.close()
  }
})
