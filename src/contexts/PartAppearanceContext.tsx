import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

/**
 * Per-part appearance (opacity) for individual CAD parts in the 3D viewer.
 *
 * Unlike `LayerVisibilityContext` (which toggles whole *categories* on/off),
 * this tracks a continuous opacity in [0, 1] for individual parts so each one
 * can independently be set to visible (1), transparent (0 < o < 1) or invisible
 * (0). It is used for the PCB board and for parametric enclosure parts
 * (e.g. base / lid, or sleeve / cap_min / cap_max).
 *
 * Parts are addressed by a stable key:
 *   - the PCB board:              `BOARD_PART_KEY` ("board")
 *   - an enclosure part:          `enc:${enclosure_part_id}` (stable across edits)
 *   - any other cad_component:    `cad:${cad_component_id}`
 *
 * Default opacity is 1 (fully visible), except enclosure parts which default to
 * `DEFAULT_ENCLOSURE_PART_OPACITY` (50%) so a closed shell reveals the PCB on
 * load. An explicit, persisted user choice always overrides the default.
 */

export const BOARD_PART_KEY = "board"
export const ENCLOSURE_PART_KEY_PREFIX = "enc:"

/** Enclosure parts start half-transparent so the PCB inside is visible on load. */
export const DEFAULT_ENCLOSURE_PART_OPACITY = 0.5

export const getPartKey = (cadComponent: any): string => {
  const enclosurePartId = cadComponent?.enclosure_part_id
  if (enclosurePartId) return `${ENCLOSURE_PART_KEY_PREFIX}${enclosurePartId}`
  return `cad:${cadComponent?.cad_component_id}`
}

/** Default opacity for a part key when the user has not set one. */
export const getDefaultOpacity = (key: string): number =>
  key.startsWith(ENCLOSURE_PART_KEY_PREFIX) ? DEFAULT_ENCLOSURE_PART_OPACITY : 1

interface PartAppearanceContextType {
  /** Opacity in [0,1] for a part key; see `getDefaultOpacity` for defaults. */
  getOpacity: (key: string) => number
  setOpacity: (key: string, opacity: number) => void
  opacities: Record<string, number>
}

const STORAGE_KEY = "cadViewerPartOpacity"

const loadStored = (): Record<string, number> => {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

const PartAppearanceContext = createContext<
  PartAppearanceContextType | undefined
>(undefined)

export const PartAppearanceProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [opacities, setOpacities] = useState<Record<string, number>>(loadStored)

  const setOpacity = useCallback((key: string, opacity: number) => {
    const clamped = Math.max(0, Math.min(1, opacity))
    setOpacities((prev) => {
      const next = { ...prev, [key]: clamped }
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {}
      }
      return next
    })
  }, [])

  const getOpacity = useCallback(
    (key: string) => {
      const value = opacities[key]
      return typeof value === "number" ? value : getDefaultOpacity(key)
    },
    [opacities],
  )

  const value = useMemo(
    () => ({ getOpacity, setOpacity, opacities }),
    [getOpacity, setOpacity, opacities],
  )

  return (
    <PartAppearanceContext.Provider value={value}>
      {children}
    </PartAppearanceContext.Provider>
  )
}

export const usePartAppearance = () => {
  const context = useContext(PartAppearanceContext)
  if (!context) {
    throw new Error(
      "usePartAppearance must be used within a PartAppearanceProvider",
    )
  }
  return context
}
