import { ASSEMBLY_HARDWARE_FAMILIES } from "@tscircuit/jscad-assembly-hardware"
import { parseModelStringParams } from "@tscircuit/modelprinter"
import type { CadComponent } from "circuit-json"

/**
 * Recognize a piece of assembly hardware -- a screw, bolt, heat-set insert or
 * spacer.
 *
 * Keyed on the `modelprinter_string` the part carries, which *states* what it
 * is, rather than on the shape of its owning records. That distinction matters
 * here: `isLegacyFdmEnclosure` has to sniff a do-not-place, off-board,
 * non-obstructing PCB owner because no field says "enclosure" -- and assembly
 * hardware uses exactly the same three flags on its own placeholder owner, so a
 * structural test would confuse the two. Only `model_origin_alignment`
 * currently keeps them apart, which is a thin thing to rest on.
 *
 * Parsing is done with modelprinter's own parser rather than a prefix match, so
 * the vocabulary cannot drift: if modelprinter stops recognizing a string, this
 * stops claiming it.
 */
export const getAssemblyHardwareFamily = (
  cadComponent: CadComponent,
): string | null => {
  // `footprinter_string` is Circuit JSON's one field for "a model named by a
  // string". The name is historical -- the renderers' shared entry point tries
  // the modelprinter vocabulary first and falls through to footprinter, which
  // is how `flexscreen` already travels.
  const modelString = cadComponent.footprinter_string
  if (!modelString) return null

  let family: string
  try {
    family = parseModelStringParams(modelString).fn
  } catch {
    return null
  }

  return (ASSEMBLY_HARDWARE_FAMILIES as readonly string[]).includes(family)
    ? family
    : null
}

export const isAssemblyHardware = (cadComponent: CadComponent): boolean =>
  getAssemblyHardwareFamily(cadComponent) !== null
