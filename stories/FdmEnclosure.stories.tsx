import type { AnyCircuitElement } from "circuit-json"
import { CadViewer } from "src/CadViewer"

/**
 * Generated FDM enclosure parts arrive as `cad_fdm_enclosure` records: typed CAD
 * with no PCB owner, carrying a JSCAD plan already authored in the Circuit world
 * frame. Deliberately static circuit JSON like the other CAD stories, so this
 * does not reach into another repository's fixtures.
 *
 * The lid sets `show_as_translucent_model`, which is what lets you see the board
 * and its connector inside a closed box.
 */

const boardWidth = 40
const boardHeight = 24
const boardThickness = 1.4
const wallThickness = 2
const floorThickness = 2
const standoffHeight = 4
const lidThickness = 2
const topHeadroom = 6

const enclosureWidth = boardWidth + 2 * (wallThickness + 1)
const enclosureHeight = boardHeight + 2 * (wallThickness + 1)
const boardTopZ = floorThickness + standoffHeight + boardThickness
const seamZ = boardTopZ + topHeadroom
const enclosureDepth = seamZ + lidThickness

/** Outside bottom of the enclosure, in Circuit world Z. */
const enclosureZ = -boardThickness / 2 - floorThickness - standoffHeight

/** A USB-C sized opening through the front (-Y) wall. */
const apertureCut = {
  type: "translate",
  vector: [0, -(enclosureHeight / 2 - wallThickness / 2), boardTopZ + 2.3],
  shape: {
    type: "rotate",
    angles: [Math.PI / 2, 0, 0],
    shape: { type: "cuboid", size: [10, 4.6, wallThickness + 1] },
  },
}

const basePlan = {
  type: "subtract",
  shapes: [
    {
      type: "translate",
      vector: [0, 0, seamZ / 2],
      shape: {
        type: "cuboid",
        size: [enclosureWidth, enclosureHeight, seamZ],
      },
    },
    {
      type: "translate",
      vector: [0, 0, floorThickness + (seamZ - floorThickness + 1) / 2],
      shape: {
        type: "cuboid",
        size: [
          enclosureWidth - 2 * wallThickness,
          enclosureHeight - 2 * wallThickness,
          seamZ - floorThickness + 1,
        ],
      },
    },
    apertureCut,
  ],
}

const lidPlan = {
  type: "translate",
  vector: [0, 0, seamZ + lidThickness / 2],
  shape: {
    type: "cuboid",
    size: [enclosureWidth, enclosureHeight, lidThickness],
  },
}

const enclosureSize = {
  x: enclosureWidth,
  y: enclosureHeight,
  z: enclosureDepth,
}

const circuitJson = [
  {
    type: "source_assembly_device",
    source_assembly_device_id: "assembly_1",
    name: "enclosed-device",
  },
  { type: "source_board", source_board_id: "source_board_1" },
  {
    type: "source_fdm_enclosure",
    source_fdm_enclosure_id: "enclosure_1",
    source_assembly_device_id: "assembly_1",
    source_board_id: "source_board_1",
    name: "EN1",
    wall_thickness: wallThickness,
  },
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_1",
    center: { x: 0, y: 0 },
    width: boardWidth,
    height: boardHeight,
    thickness: boardThickness,
    num_layers: 2,
  },
  {
    type: "source_component",
    source_component_id: "source_j1",
    ftype: "simple_chip",
    name: "J1",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_j1",
    source_component_id: "source_j1",
    center: { x: 0, y: -boardHeight / 2 + 3 },
    width: 9,
    height: 6,
    rotation: 0,
    layer: "top",
  },
  {
    type: "cad_fdm_enclosure",
    cad_fdm_enclosure_id: "cad_enclosure_base",
    source_fdm_enclosure_id: "enclosure_1",
    name: "EN1.base",
    position: { x: 0, y: 0, z: enclosureZ },
    size: enclosureSize,
    model_jscad: basePlan,
    model_unit_to_mm_scale_factor: 1,
  },
  {
    type: "cad_fdm_enclosure",
    cad_fdm_enclosure_id: "cad_enclosure_lid",
    source_fdm_enclosure_id: "enclosure_1",
    name: "EN1.lid",
    position: { x: 0, y: 0, z: enclosureZ },
    size: enclosureSize,
    model_jscad: lidPlan,
    model_unit_to_mm_scale_factor: 1,
    show_as_translucent_model: true,
  },
] as unknown as AnyCircuitElement[]

export const FdmEnclosure = () => <CadViewer circuitJson={circuitJson} />

export default {
  title: "Enclosures/Fdm Box",
  component: FdmEnclosure,
}
