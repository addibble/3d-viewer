import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import * as THREE from "three"
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js"
import { HoverProvider } from "../src/react-three/HoverContext"
import {
  ThreeContext,
  type ThreeContextState,
} from "../src/react-three/ThreeContext"
import { FootprinterModel } from "../src/three-components/FootprinterModel"

test("FootprinterModel preserves steel, black-oxide and brass RGBA colors", async () => {
  const samples = [
    {
      footprint: "screw_m3_l8mm_socketcap",
      rgb: [0.75, 0.78, 0.82],
    },
    {
      footprint: "bolt_m3_l12mm_socketcap",
      rgb: [0.24, 0.25, 0.28],
    },
    {
      footprint: "heatsetinsert_m3_l5.7mm",
      rgb: [0.78, 0.6, 0.2],
    },
  ]
  const dom = new JSDOM('<div id="root"></div>')
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const previousActEnvironment = Reflect.get(
    globalThis,
    "IS_REACT_ACT_ENVIRONMENT",
  )
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })

  const scene = new THREE.Scene()
  const rootObject = new THREE.Object3D()
  scene.add(rootObject)
  const camera = new THREE.OrthographicCamera(-23, 23, 14, -14, 0.1, 200)
  // FootprinterModel's local geometry is Z-up, in mm; no exporter transform.
  camera.up.set(0, 0, 1)
  camera.position.set(12, -50, 20)
  camera.lookAt(0, 0, -3)
  const context: ThreeContextState = {
    scene,
    camera,
    // Only the DOM event boundary is stubbed; all geometry and colors are real.
    renderer: {
      domElement: document.createElement("canvas"),
    } as THREE.WebGLRenderer,
    rootObject,
    addFrameListener: () => {},
    removeFrameListener: () => {},
  }
  const reactRoot = createRoot(document.getElementById("root")!)

  try {
    await act(async () => {
      reactRoot.render(
        <ThreeContext.Provider value={context}>
          <HoverProvider>
            {samples.map(({ footprint }, index) => (
              <FootprinterModel
                key={footprint}
                footprint={footprint}
                positionOffset={[(index - 1) * 12, 0, 0]}
                onHover={() => {}}
                onUnhover={() => {}}
                isHovered={false}
              />
            ))}
          </HoverProvider>
        </ThreeContext.Provider>,
      )
    })

    expect(rootObject.children).toHaveLength(samples.length)
    const actual = rootObject.children.map((group, index) => {
      const colors = new Map<string, number[]>()
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        expect(child.material).toBeInstanceOf(THREE.MeshStandardMaterial)
        const attribute = child.geometry.getAttribute("color")
        expect(attribute?.count).toBeGreaterThan(0)
        for (let vertex = 0; vertex < attribute.count; vertex++) {
          const rgb = [
            attribute.getX(vertex),
            attribute.getY(vertex),
            attribute.getZ(vertex),
          ].map((channel) => Number(channel.toFixed(5)))
          colors.set(JSON.stringify(rgb), rgb)
        }
      })
      return {
        footprint: samples[index]!.footprint,
        colors: [...colors.values()],
      }
    })

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const light = new THREE.DirectionalLight(0xffffff, 0.4)
    light.position.set(-20, -30, 40)
    scene.add(light)
    const renderer = new SVGRenderer()
    renderer.setSize(736, 448)
    renderer.setClearColor(new THREE.Color("#e8e8e8"), 1)
    renderer.render(scene, camera)
    expect(renderer.info.render.faces).toBeGreaterThan(0)
    const svg = renderer.domElement
    const title = document.createElementNS(svg.namespaceURI, "text")
    title.setAttribute("x", "-348")
    title.setAttribute("y", "-200")
    title.setAttribute("font-size", "15")
    title.textContent =
      "Actual FootprinterModel scene (SVG diagnostic, not GLB)"
    svg.appendChild(title)
    const legend = title.cloneNode(true)
    legend.textContent =
      "Left to right: steel screw / black-oxide bolt / brass insert"
    if (legend instanceof dom.window.Element) legend.setAttribute("y", "204")
    svg.appendChild(legend)
    const diagnostic = new dom.window.XMLSerializer().serializeToString(svg)
    // Write before the behavioral assertion. This is current output, not a golden.
    await Bun.write(
      new URL(
        "./assets/footprinter-hardware-rgba-current.svg",
        import.meta.url,
      ),
      diagnostic,
    )

    // Linear vertex RGB must retain the hardware values, not become white or
    // receive an extra transfer function. The exporter reference tests the same
    // models' linear GLB material factors independently (with 8-bit rounding).
    expect(actual).toEqual(
      samples.map(({ footprint, rgb }) => ({ footprint, colors: [rgb] })),
    )
  } finally {
    rootObject.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.geometry.dispose()
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]
      for (const material of materials) material.dispose()
    })
    await act(async () => reactRoot.unmount())
    Object.assign(globalThis, {
      window: previousWindow,
      document: previousDocument,
    })
    if (previousActEnvironment === undefined) {
      Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT")
    } else {
      Reflect.set(
        globalThis,
        "IS_REACT_ACT_ENVIRONMENT",
        previousActEnvironment,
      )
    }
    dom.window.close()
  }
})
