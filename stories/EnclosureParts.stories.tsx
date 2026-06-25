import { CadViewer } from "src/CadViewer"
import type { AnyCircuitElement } from "circuit-json"

// A board with two "enclosure parts" (a base tray + a lid) tagged with the
// non-schema `enclosure_part_id` + `name` fields that the pcb-enclosure package
// attaches. These tags cause the right-click "Appearance" submenu to show a
// tri-state opacity control for each part: visible -> 50% -> hidden.
const makeEnclosurePart = ({
  id,
  name,
  color,
  size,
  z,
}: {
  id: string
  name: string
  color: [number, number, number]
  size: [number, number, number]
  z: number
}) =>
  ({
    type: "cad_component",
    cad_component_id: `cad_${id}`,
    pcb_component_id: `pcb_${id}`,
    source_component_id: `src_${id}`,
    anchor_alignment: "center",
    position: { x: 0, y: 0, z },
    rotation: { x: 0, y: 0, z: 0 },
    model_object_fit: "contain_within_bounds",
    // Non-schema fields added by pcb-enclosure that the viewer reads:
    enclosure_part_id: id,
    name,
    model_jscad: {
      type: "colorize",
      color,
      shape: { type: "cuboid", size },
    },
  }) as unknown as AnyCircuitElement

const circuitJson: AnyCircuitElement[] = [
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 24,
    height: 24,
    thickness: 1.2,
  } as AnyCircuitElement,
  makeEnclosurePart({
    id: "EN1-base",
    name: "EN1 Base",
    color: [0.6, 0.6, 0.6],
    size: [22, 22, 5],
    z: 3.1,
  }),
  makeEnclosurePart({
    id: "EN1-lid",
    name: "EN1 Lid",
    color: [0.2, 0.45, 0.9],
    size: [22, 22, 2],
    z: 6.6,
  }),
]

export const Default = () => <CadViewer circuitJson={circuitJson} />

Default.storyName = "Enclosure Parts (tri-state appearance)"

export default {
  title: "EnclosureParts",
  component: Default,
}
