import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"

export interface LayerVisibilityState {
  boardBody: boolean
  topCopper: boolean
  bottomCopper: boolean
  keepout: boolean
  adhesive: boolean
  solderPaste: boolean
  topSilkscreen: boolean
  bottomSilkscreen: boolean
  topMask: boolean
  bottomMask: boolean
  throughHoleModels: boolean
  smtModels: boolean
  translucentModels: boolean
  modelsNotInPosFile: boolean
  modelsMarkedDNP: boolean
  modelBoundingBoxes: boolean
  threedAxis: boolean
  pcbNotes: boolean
  backgroundStart: boolean
  backgroundEnd: boolean
  /**
   * Enclosure parts get three states rather than two, because two is not
   * enough for something whose job is to surround everything else: hidden to
   * get it out of the way, see-through to check openings against the parts
   * behind them, solid to look at the print itself.
   *
   * One entry per printed part, matching `cad_fdm_enclosure.enclosure_part`,
   * so a lid can be taken off without losing the base. The set grows with the
   * process -- fasteners and inserts are parts too.
   */
  enclosureBase: PartVisibility
  enclosureLid: PartVisibility
}

/** Hidden, see-through, or solid. */
export type PartVisibility = "hidden" | "translucent" | "opaque"

/** The order the menu cycles through on each click. */
export const PART_VISIBILITY_CYCLE: PartVisibility[] = [
  "translucent",
  "opaque",
  "hidden",
]

export const nextPartVisibility = (current: PartVisibility): PartVisibility =>
  PART_VISIBILITY_CYCLE[
    (PART_VISIBILITY_CYCLE.indexOf(current) + 1) % PART_VISIBILITY_CYCLE.length
  ]!

interface LayerVisibilityContextType {
  visibility: LayerVisibilityState
  setLayerVisibility: <K extends keyof LayerVisibilityState>(
    layer: K,
    visible: LayerVisibilityState[K],
  ) => void
  resetToDefaults: () => void
}

const defaultVisibility: LayerVisibilityState = {
  boardBody: true,
  topCopper: true,
  bottomCopper: true,
  keepout: true,
  adhesive: false,
  solderPaste: false,
  topSilkscreen: true,
  bottomSilkscreen: true,
  topMask: true,
  bottomMask: true,
  throughHoleModels: true,
  smtModels: true,
  translucentModels: true,
  modelsNotInPosFile: false,
  modelsMarkedDNP: false,
  modelBoundingBoxes: false,
  threedAxis: false,
  pcbNotes: false,
  backgroundStart: true,
  backgroundEnd: true,
  // See-through by default: an opaque enclosure hides the board it was
  // generated from, and checking the openings against the parts behind them is
  // the reason to render it at all.
  enclosureBase: "translucent",
  enclosureLid: "translucent",
}

const LayerVisibilityContext = createContext<
  LayerVisibilityContextType | undefined
>(undefined)

export const LayerVisibilityProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [visibility, setVisibility] =
    useState<LayerVisibilityState>(defaultVisibility)

  const setLayerVisibility = useCallback(
    <K extends keyof LayerVisibilityState>(
      layer: K,
      visible: LayerVisibilityState[K],
    ) => {
      setVisibility((prev) => ({
        ...prev,
        [layer]: visible,
      }))
    },
    [],
  )

  const resetToDefaults = useCallback(() => {
    setVisibility(defaultVisibility)
  }, [])

  const value = useMemo(
    () => ({
      visibility,
      setLayerVisibility,
      resetToDefaults,
    }),
    [visibility, setLayerVisibility, resetToDefaults],
  )

  return (
    <LayerVisibilityContext.Provider value={value}>
      {children}
    </LayerVisibilityContext.Provider>
  )
}

export const useLayerVisibility = () => {
  const context = useContext(LayerVisibilityContext)
  if (!context) {
    throw new Error(
      "useLayerVisibility must be used within a LayerVisibilityProvider",
    )
  }
  return context
}
