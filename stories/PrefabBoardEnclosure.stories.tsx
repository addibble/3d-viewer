import type { AnyCircuitElement } from "circuit-json"
import { CadViewer } from "src/CadViewer"
import prefabBoardWithEnclosure from "./assets/prefab-board-with-enclosure.json"

/**
 * The prefab-board acceptance fixture, rendered from Circuit JSON produced by
 * core (`core/tests/enclosure/prefab-board/`). Regenerate with:
 *
 *   cd ../core && bun -e 'import("./tests/enclosure/prefab-board/render-prefab-board") \
 *     .then(async (m) => Bun.write( \
 *       "../3d-viewer/stories/assets/prefab-board-with-enclosure.json", \
 *       JSON.stringify(await m.renderPrefabBoardCircuitJson())))'
 *
 * Checked in as a static asset rather than rendered live, so 3d-viewer does not
 * depend on core (which in turn depends on 3d-viewer's siblings).
 *
 * Nine declared apertures across all six enclosure faces:
 *   front   J1 USB-C, J6 audio jack
 *   back    J3 micro-USB, J4 USB-A
 *   right   J2 vertical USB-C, J5 DC barrel
 *   left    J7 SMA
 *   top     SW1 tact-switch plunger (through the lid)
 *   bottom  LED1 viewing window (through the floor)
 */

/**
 * Core currently emits one `cad_fdm_enclosure` holding the *assembled* base+lid
 * union, so there is no separate lid record to make see-through (per-part
 * emission is a later migration phase). The asset is left exactly as core wrote
 * it; translucency is applied here as a story display choice, otherwise the
 * closed box hides the board and every cutout behind it.
 */
const withTranslucentEnclosure = (
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] =>
  circuitJson.map((element) =>
    element.type === "cad_fdm_enclosure"
      ? { ...element, show_as_translucent_model: true }
      : element,
  )

const circuitJson = withTranslucentEnclosure(
  prefabBoardWithEnclosure as unknown as AnyCircuitElement[],
)

export const PrefabBoardEnclosure = () => (
  <CadViewer circuitJson={circuitJson} />
)

/** The same fixture with the enclosure opaque, as core actually emits it. */
export const PrefabBoardEnclosureOpaque = () => (
  <CadViewer
    circuitJson={prefabBoardWithEnclosure as unknown as AnyCircuitElement[]}
  />
)

export default {
  title: "Enclosures/Prefab Board",
  component: PrefabBoardEnclosure,
}
