import { expect, test } from "bun:test"
import * as THREE from "three"
import {
  applyCoordinateTransform,
  getCadLoaderTransformMatrix,
} from "../src/utils/cad-model-loader-transform"

test("loader compatibility mapping keeps flips before extrinsic XYZ rotation", () => {
  const config = {
    axisMapping: { x: "y", y: "-z", z: "x" },
    flipX: -1,
    rotation: { x: 31, y: -47, z: 23 },
  }
  const point = { x: 2, y: 3, z: 5 }
  const expected = new THREE.Vector3(-3, -5, 2)
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), (31 * Math.PI) / 180)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), (-47 * Math.PI) / 180)
    .applyAxisAngle(new THREE.Vector3(0, 0, 1), (23 * Math.PI) / 180)
  const actual = applyCoordinateTransform(point, config)
  const matrixPoint = new THREE.Vector3(point.x, point.y, point.z).applyMatrix4(
    getCadLoaderTransformMatrix(config)!,
  )
  for (const axis of ["x", "y", "z"] as const) {
    expect(actual[axis]).toBeCloseTo(expected[axis], 10)
    expect(matrixPoint[axis]).toBeCloseTo(expected[axis], 10)
  }
})
