import { expect, test } from "bun:test"
import * as THREE from "three"
import { getCadModelFitScale } from "../src/utils/cad-model-fit"

test("legacy fit keeps ratio one for flat axes and empty objects", () => {
  const model = new THREE.Mesh(new THREE.PlaneGeometry(2, 4))
  expect(
    getCadModelFitScale(model, [10, 10, 10], "contain_within_bounds"),
  ).toEqual([1, 1, 1])
  expect(getCadModelFitScale(model, [10, 10, 10], "fill_bounds")).toEqual([
    5, 2.5, 1,
  ])
  expect(
    getCadModelFitScale(new THREE.Group(), [10, 10, 10], "fill_bounds"),
  ).toEqual([1, 1, 1])
})
